import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getStore } from "@netlify/blobs";
import { after } from "next/server";
import { hashPassword } from "./password";

/**
 * Base SQLite del modo local (sin Supabase).
 *
 * - En development / servidor propio: el archivo vive en `data/gofun.db`
 *   (ignorado por git).
 * - En Netlify: las funciones no tienen disco persistente (solo `/tmp`, que
 *   se pierde entre invocaciones). El archivo se descarga de **Netlify Blobs**
 *   al arrancar la función y se vuelve a subir al terminar la petición. Así los
 *   datos sobreviven a deploys y a periodos de inactividad, sin depender de un
 *   servicio externo que pueda pausarse.
 *
 * El esquema replica supabase/migrations/*.sql.
 */

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "gofun.db");

/** Netlify inyecta estas variables en Functions/Edge Functions. */
export function enNetlify(): boolean {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY === "true");
}

const BLOB_STORE = "gofun-db";
const BLOB_KEY = "gofun.db";
const ARCHIVO_TMP = path.join(os.tmpdir(), `gofun-${process.pid}.db`);

let instancia: DatabaseSync | null = null;
let promesaNetlify: Promise<void> | null = null;
let etagBlob: string | undefined;
let sucio = false;
let cadenaGuardado: Promise<void> = Promise.resolve();

interface Sentencia {
  sql: string;
  params: SQLInputValue[];
}
let pendientes: Sentencia[] = [];

function registrar(sql: string, params: SQLInputValue[] = []): void {
  if (!enNetlify()) return;
  pendientes.push({ sql, params });
  sucio = true;
}

function abrirBase(file: string, journal: "WAL" | "DELETE"): DatabaseSync {
  const d = new DatabaseSync(file);

  // El primer arranque concurrente (build, varios procesos) puede dar
  // "database is locked": se reintenta hasta que el otro proceso ceda.
  let reintentos = 0;
  for (;;) {
    try {
      d.exec("PRAGMA busy_timeout = 10000;");
      d.exec(`PRAGMA journal_mode = ${journal};`);
      d.exec("PRAGMA foreign_keys = ON;");
      break;
    } catch (e) {
      const err = e as { errcode?: number };
      if (err.errcode === 5 && reintentos < 8) {
        reintentos++;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
        continue;
      }
      throw e;
    }
  }

  d.exec(ESQUEMA);
  sembrar(d);
  return d;
}

function abrir(): DatabaseSync {
  if (instancia) return instancia;

  if (enNetlify()) {
    // `inicializarDb()` ya ha descargado el blob a ARCHIVO_TMP antes de que
    // se ejecute cualquier consulta (lo llaman data.ts y las Server Actions).
    throw new Error(
      "La base de datos de Netlify todavía no se ha inicializado (falta await inicializarDb())."
    );
  }

  fs.mkdirSync(DIR, { recursive: true });
  instancia = abrirBase(FILE, "WAL");
  return instancia;
}

// ------------------------------------------------------------
// Persistencia en Netlify Blobs
// ------------------------------------------------------------

function store() {
  return getStore({ name: BLOB_STORE, consistency: "strong" });
}

async function descargarBlob(): Promise<void> {
  const entrada = await store().getWithMetadata(BLOB_KEY, {
    consistency: "strong",
    type: "arrayBuffer",
  });
  etagBlob = entrada?.etag;

  if (entrada?.data) {
    fs.writeFileSync(ARCHIVO_TMP, Buffer.from(entrada.data as ArrayBuffer));
  } else if (fs.existsSync(ARCHIVO_TMP)) {
    fs.unlinkSync(ARCHIVO_TMP);
  }

  instancia = abrirBase(ARCHIVO_TMP, "DELETE");
  // La apertura ejecuta el esquema y la semilla: aunque el blob ya existiera,
  // puede haber cambios de esquema pendientes tras un deploy.
  sucio = true;
}

/** Inicializa la BD (en Netlify, descarga el blob). Seguro llamarla varias veces. */
export async function inicializarDb(): Promise<void> {
  if (!enNetlify()) return;

  if (!promesaNetlify) promesaNetlify = descargarBlob();
  await promesaNetlify;

  // La subida se hace después de responder para no añadir latencia, pero antes
  // de que la función termine (Next mantiene vivas las promesas de `after`).
  try {
    after(() => guardarDb());
  } catch {
    // `after` no está disponible fuera de una petición (p. ej. build): en ese
    // caso no hay escritura que persistir.
  }
}

async function subir(contenido: Buffer, etag: string | undefined): Promise<boolean> {
  const opciones = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
  const bytes = new Uint8Array(contenido);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const { modified } = await store().set(BLOB_KEY, buffer, opciones);
  return modified;
}

/** Reaplica las sentencias de la petición sobre la versión más reciente del blob. */
async function fusionarCambios(intentos = 4): Promise<boolean> {
  for (let i = 0; i < intentos; i++) {
    const actual = await store().getWithMetadata(BLOB_KEY, {
      consistency: "strong",
      type: "arrayBuffer",
    });

    const archivoFusion = `${ARCHIVO_TMP}.merge-${i}.db`;
    if (fs.existsSync(archivoFusion)) fs.unlinkSync(archivoFusion);
    if (actual?.data) fs.writeFileSync(archivoFusion, Buffer.from(actual.data as ArrayBuffer));

    const d = abrirBase(archivoFusion, "DELETE");
    try {
      for (const { sql, params } of pendientes) d.prepare(sql).run(...params);
    } finally {
      d.close();
    }

    if (await subir(fs.readFileSync(archivoFusion), actual?.etag)) {
      etagBlob = actual?.etag;
      // La instancia local se queda desactualizada: se recargará en la
      // siguiente petición que llegue a este worker.
      try {
        instancia?.close();
      } catch {
        // Ya estaba cerrada.
      }
      promesaNetlify = null;
      instancia = null;
      return true;
    }
  }
  return false;
}

async function guardarDb(): Promise<void> {
  if (!enNetlify() || !instancia || !sucio) return;

  const tarea = cadenaGuardado.then(async () => {
    if (!sucio) return;

    // Con WAL desactivado, el archivo principal contiene todas las escrituras.
    const contenido = fs.readFileSync(ARCHIVO_TMP);
    if (await subir(contenido, etagBlob)) {
      const entrada = await store().getMetadata(BLOB_KEY, { consistency: "strong" });
      etagBlob = entrada?.etag;
    } else if (!(await fusionarCambios())) {
      throw new Error("No se pudieron guardar los cambios: otra petición está escribiendo. Inténtalo de nuevo.");
    }

    pendientes = [];
    sucio = false;
  });

  cadenaGuardado = tarea.catch(() => undefined);
  await tarea;
}

// ------------------------------------------------------------
// Esquema
// ------------------------------------------------------------
const ESQUEMA = `
create table if not exists empresa_config (
  id                integer primary key check (id = 1),
  nombre            text    not null default 'Go Fun Eventos',
  cif               text,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  telefono          text,
  email             text,
  iban              text,
  iva_defecto       real    not null default 21,
  irpf_defecto      real    not null default 0,
  serie_facturas    text    not null default 'F',
  ultimo_numero     integer not null default 0,
  moneda            text    not null default 'EUR',
  suplemento_5h     real    not null default 25,
  suplemento_8h     real    not null default 55,
  actualizado_en    text    not null
);

create table if not exists atracciones (
  id                text primary key,
  nombre            text    not null,
  slug              text    not null unique,
  categoria         text    not null default 'infantil',
  descripcion       text,
  precio_base       real,
  duracion_base     text    not null default '3-4 h',
  incluida_en_packs integer not null default 0,
  orden             integer not null default 0,
  activa            integer not null default 1,
  creado_en         text    not null
);

create table if not exists packs (
  id                text primary key,
  nombre            text    not null,
  descripcion       text,
  incluye           text    not null default '[]',
  precio_base       real,
  orden             integer not null default 0,
  activo            integer not null default 1,
  creado_en         text    not null
);

create table if not exists clientes (
  id                text primary key,
  nombre            text    not null,
  tipo              text    not null default 'particular',
  cif_nif           text,
  email             text,
  telefono          text,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  cp                text,
  retiene_irpf      integer not null default 0,
  notas             text,
  borrado_en        text,
  creado_en         text    not null
);

create table if not exists eventos (
  id                text primary key,
  cliente_id        text references clientes (id) on delete set null,
  titulo            text    not null,
  tipo              text    not null default 'particular',
  estado            text    not null default 'borrador',
  fecha             text    not null,
  hora_salida       text,
  hora_montaje      text,
  hora_inicio       text,
  hora_fin          text,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  zona              text    not null default 'almagro_30km',
  duracion_horas    text    not null default '3-4 h',
  importe_total     real    not null default 0,
  notas             text,
  creado_en         text    not null,
  actualizado_en    text    not null
);

create index if not exists eventos_fecha_idx on eventos (fecha desc);
create index if not exists eventos_cliente_idx on eventos (cliente_id);

create table if not exists evento_lineas (
  id                text primary key,
  evento_id         text not null references eventos (id) on delete cascade,
  atraccion_id      text references atracciones (id) on delete set null,
  descripcion       text    not null,
  cantidad          integer not null default 1,
  precio_unitario   real    not null default 0,
  orden             integer not null default 0
);

create index if not exists evento_lineas_evento_idx on evento_lineas (evento_id);

create table if not exists usuarios (
  id                text primary key,
  email             text    not null unique,
  password_hash     text    not null,
  nombre            text    not null,
  creado_en         text    not null
);

create table if not exists cuentas (
  id                text primary key,
  nombre            text    not null,
  tipo              text    not null default 'caja' check (tipo in ('caja','banco')),
  saldo_inicial     real    not null default 0,
  activa            integer not null default 1,
  creado_en         text    not null
);

create table if not exists cobros (
  id                text primary key,
  cuenta_id         text not null references cuentas (id),
  evento_id         text references eventos (id) on delete set null,
  cliente_id        text references clientes (id) on delete set null,
  concepto          text    not null,
  fecha             text    not null,
  importe           real    not null check (importe > 0),
  metodo            text    not null default 'efectivo' check (metodo in ('efectivo','transferencia','tarjeta','bizum')),
  notas             text,
  creado_en         text    not null
);

create index if not exists cobros_fecha_idx on cobros (fecha desc);
create index if not exists cobros_evento_idx on cobros (evento_id);
create index if not exists cobros_cuenta_idx on cobros (cuenta_id);

create table if not exists gastos (
  id                text primary key,
  cuenta_id         text not null references cuentas (id),
  categoria         text    not null default 'otros' check (categoria in ('combustible','reparaciones','material','publicidad','impuestos','personal','otros')),
  concepto          text    not null,
  fecha             text    not null,
  importe           real    not null check (importe > 0),
  proveedor         text,
  metodo            text    not null default 'efectivo' check (metodo in ('efectivo','transferencia','tarjeta','bizum')),
  factura_ref       text,
  notas             text,
  creado_en         text    not null
);

create index if not exists gastos_fecha_idx on gastos (fecha desc);
create index if not exists gastos_cuenta_idx on gastos (cuenta_id);

create table if not exists facturas (
  id                text primary key,
  numero            text    not null unique,
  serie             text    not null default 'F',
  fecha             text    not null,
  cliente_id        text references clientes (id) on delete restrict,
  evento_id         text references eventos (id) on delete set null,
  estado            text    not null default 'proforma' check (estado in ('proforma','emitida','anulada')),
  base_imponible    real    not null default 0,
  iva               real    not null default 21,
  iva_importe       real    not null default 0,
  irpf              real    not null default 0,
  irpf_importe      real    not null default 0,
  total             real    not null default 0,
  notas             text,
  creado_en         text    not null
);

create index if not exists facturas_fecha_idx on facturas (fecha desc);
create index if not exists facturas_cliente_idx on facturas (cliente_id);
create index if not exists facturas_evento_idx on facturas (evento_id);

create table if not exists factura_lineas (
  id                text primary key,
  factura_id        text not null references facturas (id) on delete cascade,
  descripcion       text    not null,
  cantidad          integer not null default 1 check (cantidad > 0),
  precio_unitario   real    not null default 0,
  orden             integer not null default 0
);

create index if not exists factura_lineas_factura_idx on factura_lineas (factura_id);
`;

// ------------------------------------------------------------
// Semilla (idempotente)
// ------------------------------------------------------------
function sembrar(d: DatabaseSync) {
  const ahora = () => new Date().toISOString();

  // Configuración de la empresa
  const hayConfig = d.prepare("select 1 from empresa_config where id = 1").get();
  if (!hayConfig) {
    d.prepare(
      `insert into empresa_config (id, nombre, iva_defecto, irpf_defecto, serie_facturas, actualizado_en)
       values (1, 'Go Fun Eventos', 21, 15, 'F', ?)`
    ).run(ahora());
  }
  // Normaliza el antiguo valor por defecto de IRPF (0 → 15 % estándar para
  // facturas a clientes que retienen). El form de Ajustes permite cambiarlo.
  d.prepare("update empresa_config set irpf_defecto = 15 where id = 1 and irpf_defecto = 0").run();

  // Catálogo (igual que la migración de Supabase)
  const hayAtracciones = d.prepare("select 1 from atracciones limit 1").get();
  if (!hayAtracciones) {
    const insAtraccion = d.prepare(`
      insert into atracciones (id, nombre, slug, categoria, descripcion, precio_base, duracion_base, incluida_en_packs, orden, activa, creado_en)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const atracciones: Array<[string, string, string, string | null, number | null]> = [
      ["Castillos Hinchables", "castillos", "infantil", "Saltos y diversión para comuniones y cumpleaños. Hinchables homologados con revisión técnica.", 150],
      ["Toro Mecánico", "toro", "adultos", "Incluye monitor profesional para adaptar la velocidad a niños y adultos.", 350],
      ["La Barredora Humana", "barredora", "deportes", "Demuestra tus reflejos. ¿Quién aguantará más tiempo en pie sin caer?", 300],
      ["Deslizador Acuático", "deslizador", "verano", "La mejor opción para eventos de verano y fiestas acuáticas.", 250],
      ["Cañón de Espuma", "espona", "verano", "Fiesta de la espuma apta para todas las edades.", 200],
      ["Equipo de Música", "musica", "servicios", "Sonido e iluminación profesional para ambientar tu celebración.", null],
      ["Futbolín Humano", "futbolin", "deportes", "Trabajo en equipo y competencia deportiva en formato gigante.", 150],
      ["Circuito de Karts", "karts", "deportes", "Circuito móvil de karts a pedales para poner a prueba tu habilidad de conducción.", 350],
      ["Camas Elásticas", "camas", "infantil", "Estructuras de salto con protección de red de alta seguridad.", 80],
      ["Zona de Juegos", "zona-juegos", "servicios", "Tiro con arco, mini golf, bádminton, ping pong y paracaídas de colores.", null],
    ];
    const soloPacks = new Set(["musica", "zona-juegos"]);
    atracciones.forEach(([nombre, slug, categoria, descripcion, precio], i) =>
      insAtraccion.run(
        randomUUID(), nombre, slug, categoria, descripcion, precio, "3-4 h",
        soloPacks.has(slug) ? 1 : 0, i + 1, ahora()
      )
    );

    const insPack = d.prepare(`
      insert into packs (id, nombre, descripcion, incluye, precio_base, orden, activo, creado_en)
      values (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const packs: Array<[string, string, string[]]> = [
      ["Pack Estándar", "Barredora o toro + hinchables (3 h).", ["⚡ Barredora o Toro 🐂", "🏰 Hinchables (3h)"]],
      ["Pack Verano", "La combinación acuática completa para primavera y verano.", ["🧼 Cañón de Espuma", "🏰 Deslizador Acuático", "🔊 Equipo Sonido", "⚽ Futbolín Humano"]],
      ["Pack Despedida", "Nivel profesional para despedidas de soltero/a.", ["🐂 Toro Mecánico (Nivel Pro)", "🔊 Equipo Sonido 2000W", "🎁 Regalo sorpresa"]],
      ["Pack VIP", "Todo incluido, el pack más completo.", ["⚡ Barredora o Toro 🐂", "🏰 Deslizador Acuático", "🔊 Equipo Sonido", "🧼 Cañón de Espuma", "🏰 Hinchable (3h)"]],
      ["Pack a Medida", "Combina las atracciones que quieras. Ej.: Toro + Castillo = 450 € · Castillo + Futbolín = 275 €.", ["Configura tu combinación personalizada"]],
    ];
    packs.forEach(([nombre, descripcion, incluye], i) =>
      insPack.run(randomUUID(), nombre, descripcion, JSON.stringify(incluye), null, i + 1, ahora())
    );
  }

  // Usuario local por defecto: admin / admin
  const hayUsuarios = d.prepare("select 1 from usuarios limit 1").get();
  if (!hayUsuarios) {
    d.prepare(
      `insert into usuarios (id, email, password_hash, nombre, creado_en) values (?, ?, ?, ?, ?)`
    ).run(randomUUID(), "admin", hashPassword("admin"), "Administración", ahora());
  }

  // Cuentas de tesorería por defecto
  const hayCuentas = d.prepare("select 1 from cuentas limit 1").get();
  if (!hayCuentas) {
    const insCuenta = d.prepare(
      `insert into cuentas (id, nombre, tipo, saldo_inicial, activa, creado_en) values (?, ?, ?, ?, 1, ?)`
    );
    insCuenta.run(randomUUID(), "Caja", "caja", 0, ahora());
    insCuenta.run(randomUUID(), "Banco", "banco", 0, ahora());
  }
}

/**
 * Proxy con inicialización perezosa: `db.prepare(...)` abre la conexión la
 * primera vez que se usa. Así los procesos/threads no compiten al importar.
 * En Netlify registra las escrituras para subir el blob al terminar la petición.
 */
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = abrir();

    if (prop === "prepare") {
      return (sql: string) => {
        const stmt = real.prepare(sql);
        return new Proxy(stmt, {
          get(s, p) {
            const v = (s as unknown as Record<PropertyKey, unknown>)[p];
            if (p === "run" && typeof v === "function") {
              return (...params: SQLInputValue[]) => {
                registrar(sql, params);
                return (v as (...args: SQLInputValue[]) => unknown).apply(s, params);
              };
            }
            return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(s) : v;
          },
        });
      };
    }

    if (prop === "exec") {
      return (sql: string) => {
        registrar(sql);
        return real.exec(sql);
      };
    }

    const v = (real as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(real) : v;
  },
}) as DatabaseSync;