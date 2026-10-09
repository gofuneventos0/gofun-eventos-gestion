import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { db } from "./db";
import { IRPF_RETENCION_DEFECTO, siguienteNumeroFactura } from "@/lib/constantes";
import type {
  Atraccion,
  BienInversion,
  Cliente,
  Cobro,
  Cuenta,
  EmpresaConfig,
  EstadoEvento,
  Evento,
  EventoCompleto,
  EventoLinea,
  Factura,
  FacturaCompleta,
  FacturaLinea,
  Gasto,
  Movimiento,
  Pack,
  ResumenTesoreria,
  SaldoCuenta,
  TipoBienInversion,
} from "@/lib/types";

// ------------------------------------------------------------
// Helpers de mapeo (SQLite → tipos)
// ------------------------------------------------------------
const bool = (v: number | null | undefined) => v === 1;
type Fila = Record<string, unknown>;

function aConfig(f: Fila): EmpresaConfig {
  return {
    id: Number(f.id),
    nombre: String(f.nombre),
    cif: (f.cif as string) ?? null,
    direccion: (f.direccion as string) ?? null,
    poblacion: (f.poblacion as string) ?? null,
    provincia: (f.provincia as string) ?? null,
    telefono: (f.telefono as string) ?? null,
    email: (f.email as string) ?? null,
    iban: (f.iban as string) ?? null,
    iva_defecto: Number(f.iva_defecto),
    irpf_defecto: Number(f.irpf_defecto),
    serie_facturas: String(f.serie_facturas),
    ultimo_numero: Number(f.ultimo_numero),
    moneda: String(f.moneda),
    suplemento_5h: Number(f.suplemento_5h),
    suplemento_8h: Number(f.suplemento_8h),
    actualizado_en: String(f.actualizado_en),
  };
}

function aAtraccion(f: Fila): Atraccion {
  return {
    id: String(f.id),
    nombre: String(f.nombre),
    slug: String(f.slug),
    categoria: f.categoria as Atraccion["categoria"],
    descripcion: (f.descripcion as string) ?? null,
    precio_base: f.precio_base == null ? null : Number(f.precio_base),
    duracion_base: String(f.duracion_base),
    incluida_en_packs: bool(f.incluida_en_packs as number),
    orden: Number(f.orden),
    activa: bool(f.activa as number),
    creado_en: String(f.creado_en),
  };
}

function aPack(f: Fila): Pack {
  return {
    id: String(f.id),
    nombre: String(f.nombre),
    descripcion: (f.descripcion as string) ?? null,
    incluye: (JSON.parse(String(f.incluye)) as string[]) ?? [],
    precio_base: f.precio_base == null ? null : Number(f.precio_base),
    orden: Number(f.orden),
    activo: bool(f.activo as number),
    creado_en: String(f.creado_en),
  };
}

function aCliente(f: Fila): Cliente {
  return {
    id: String(f.id),
    nombre: String(f.nombre),
    tipo: f.tipo as Cliente["tipo"],
    cif_nif: (f.cif_nif as string) ?? null,
    email: (f.email as string) ?? null,
    telefono: (f.telefono as string) ?? null,
    direccion: (f.direccion as string) ?? null,
    poblacion: (f.poblacion as string) ?? null,
    provincia: (f.provincia as string) ?? null,
    cp: (f.cp as string) ?? null,
    retiene_irpf: bool(f.retiene_irpf as number),
    notas: (f.notas as string) ?? null,
    borrado_en: (f.borrado_en as string) ?? null,
    creado_en: String(f.creado_en),
  };
}

function aEvento(f: Fila): Evento {
  return {
    id: String(f.id),
    cliente_id: (f.cliente_id as string) ?? null,
    titulo: String(f.titulo),
    tipo: f.tipo as Evento["tipo"],
    estado: f.estado as Evento["estado"],
    fecha: String(f.fecha),
    hora_salida: (f.hora_salida as string) ?? null,
    hora_montaje: (f.hora_montaje as string) ?? null,
    hora_inicio: (f.hora_inicio as string) ?? null,
    hora_fin: (f.hora_fin as string) ?? null,
    direccion: (f.direccion as string) ?? null,
    poblacion: (f.poblacion as string) ?? null,
    provincia: (f.provincia as string) ?? null,
    zona: f.zona as Evento["zona"],
    duracion_horas: f.duracion_horas as Evento["duracion_horas"],
    importe_total: Number(f.importe_total),
    notas: (f.notas as string) ?? null,
    creado_en: String(f.creado_en),
    actualizado_en: String(f.actualizado_en),
  };
}

function aLinea(f: Fila): EventoLinea {
  return {
    id: String(f.id),
    evento_id: String(f.evento_id),
    atraccion_id: (f.atraccion_id as string) ?? null,
    descripcion: String(f.descripcion),
    cantidad: Number(f.cantidad),
    precio_unitario: Number(f.precio_unitario),
    orden: Number(f.orden),
  };
}

function lineasDe(eventoId: string): EventoLinea[] {
  const filas = db
    .prepare("select * from evento_lineas where evento_id = ? order by orden asc")
    .all(eventoId) as Fila[];
  return filas.map(aLinea);
}

function completar(f: Fila): EventoCompleto {
  const evento = aEvento(f);
  let cliente: EventoCompleto["cliente"] = null;
  if (evento.cliente_id) {
    const c = db
      .prepare("select id, nombre, tipo, retiene_irpf, telefono from clientes where id = ?")
      .get(evento.cliente_id) as Fila | undefined;
    if (c) {
      cliente = {
        id: String(c.id),
        nombre: String(c.nombre),
        tipo: c.tipo as Cliente["tipo"],
        retiene_irpf: bool(c.retiene_irpf as number),
        telefono: (c.telefono as string) ?? null,
      };
    }
  }
  return { ...evento, cliente, evento_lineas: lineasDe(evento.id) };
}

const JUNTAR =
  "select e.* from eventos e where e.fecha >= ? and e.fecha <= ? order by e.fecha asc, e.hora_inicio asc nulls first";

// ------------------------------------------------------------
// Lecturas (misma API que data.ts)
// ------------------------------------------------------------
export function getConfig(): EmpresaConfig | null {
  const f = db.prepare("select * from empresa_config where id = 1").get() as Fila | undefined;
  return f ? aConfig(f) : null;
}

export function getAtracciones(soloActivas = true): Atraccion[] {
  const sql = soloActivas
    ? "select * from atracciones where activa = 1 order by orden asc"
    : "select * from atracciones order by orden asc";
  const filas = db.prepare(sql).all() as Fila[];
  return filas.map(aAtraccion);
}

export function getPacks(): Pack[] {
  const filas = db
    .prepare("select * from packs where activo = 1 order by orden asc")
    .all() as Fila[];
  return filas.map(aPack);
}

export function getClientes(busqueda?: string): Cliente[] {
  let filas: Fila[];
  if (busqueda?.trim()) {
    const t = `%${busqueda.trim()}%`;
    filas = db
      .prepare(
        `select * from clientes
         where borrado_en is null
           and (nombre like ? or telefono like ? or poblacion like ? or cif_nif like ?)
         order by nombre collate nocase asc`
      )
      .all(t, t, t, t) as Fila[];
  } else {
    filas = db
      .prepare("select * from clientes where borrado_en is null order by nombre collate nocase asc")
      .all() as Fila[];
  }
  return filas.map(aCliente);
}

export function getCliente(id: string): Cliente | null {
  const f = db.prepare("select * from clientes where id = ?").get(id) as Fila | undefined;
  return f ? aCliente(f) : null;
}

export function getEventosRango(desde: string, hasta: string): EventoCompleto[] {
  const filas = db.prepare(JUNTAR).all(desde, hasta) as Fila[];
  return filas.map(completar);
}

export function getEvento(id: string): EventoCompleto | null {
  const f = db.prepare("select * from eventos where id = ?").get(id) as Fila | undefined;
  return f ? completar(f) : null;
}

export function getEventos(opciones?: {
  estados?: EstadoEvento[];
  desde?: string;
  hasta?: string;
  limite?: number;
}): EventoCompleto[] {
  const conds: string[] = [];
  const params: SQLInputValue[] = [];
  if (opciones?.estados?.length) {
    conds.push(`e.estado in (${opciones.estados.map(() => "?").join(",")})`);
    params.push(...opciones.estados);
  }
  if (opciones?.desde) {
    conds.push("e.fecha >= ?");
    params.push(opciones.desde);
  }
  if (opciones?.hasta) {
    conds.push("e.fecha <= ?");
    params.push(opciones.hasta);
  }
  const sql =
    `select e.* from eventos e` +
    (conds.length ? ` where ${conds.join(" and ")}` : "") +
    ` order by e.fecha desc` +
    (opciones?.limite ? ` limit ?` : "");
  if (opciones?.limite) params.push(opciones.limite);
  const filas = db.prepare(sql).all(...params) as Fila[];
  return filas.map(completar);
}

export function getProximosEventos(limite = 6, desde: string): EventoCompleto[] {
  const filas = db
    .prepare(
      `select e.* from eventos e
       where e.fecha >= ? and e.estado != 'cancelado'
       order by e.fecha asc
       limit ?`
    )
    .all(desde, limite) as Fila[];
  return filas.map(completar);
}

export function getConteoEstados(desde: string, hasta: string): Record<EstadoEvento, number> {
  const filas = db
    .prepare(
      `select estado, count(*) as n from eventos
       where fecha >= ? and fecha <= ?
       group by estado`
    )
    .all(desde, hasta) as Array<{ estado: string; n: number }>;
  const acc: Record<EstadoEvento, number> = {
    borrador: 0,
    confirmado: 0,
    realizado: 0,
    cobrado: 0,
    cancelado: 0,
  };
  for (const f of filas) {
    const k = f.estado as EstadoEvento;
    if (k in acc) acc[k] = Number(f.n);
  }
  return acc;
}

// ------------------------------------------------------------
// Mutaciones (misma lógica que las Server Actions)
// ------------------------------------------------------------
export interface LineaEntrada {
  atraccion_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface FilaEvento {
  id?: string | null;
  cliente_id: string | null;
  titulo: string;
  tipo: string;
  estado: string;
  fecha: string;
  hora_salida: string | null;
  hora_montaje: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  zona: string;
  duracion_horas: string;
  notas: string | null;
  importe_total: number;
}

/** Inserta o actualiza un evento y reemplaza sus líneas (recalcula el importe). */
export function guardarEvento(fila: FilaEvento, lineas: LineaEntrada[]): { id: string } {
  const id = fila.id ?? randomUUID();
  const importe = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
  const ahora = new Date().toISOString();

  if (fila.id) {
    db.prepare(
      `update eventos set
         cliente_id = ?, titulo = ?, tipo = ?, estado = ?, fecha = ?,
         hora_salida = ?, hora_montaje = ?, hora_inicio = ?, hora_fin = ?,
         direccion = ?, poblacion = ?, provincia = ?, zona = ?, duracion_horas = ?,
         notas = ?, importe_total = ?, actualizado_en = ?
       where id = ?`
    ).run(
      fila.cliente_id, fila.titulo, fila.tipo, fila.estado, fila.fecha,
      fila.hora_salida, fila.hora_montaje, fila.hora_inicio, fila.hora_fin,
      fila.direccion, fila.poblacion, fila.provincia, fila.zona, fila.duracion_horas,
      fila.notas, importe, ahora, id
    );
    db.prepare("delete from evento_lineas where evento_id = ?").run(id);
  } else {
    db.prepare(
      `insert into eventos
         (id, cliente_id, titulo, tipo, estado, fecha,
          hora_salida, hora_montaje, hora_inicio, hora_fin,
          direccion, poblacion, provincia, zona, duracion_horas,
          notas, importe_total, creado_en, actualizado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, fila.cliente_id, fila.titulo, fila.tipo, fila.estado, fila.fecha,
      fila.hora_salida, fila.hora_montaje, fila.hora_inicio, fila.hora_fin,
      fila.direccion, fila.poblacion, fila.provincia, fila.zona, fila.duracion_horas,
      fila.notas, importe, ahora, ahora
    );
  }

  const insLinea = db.prepare(
    `insert into evento_lineas (id, evento_id, atraccion_id, descripcion, cantidad, precio_unitario, orden)
     values (?, ?, ?, ?, ?, ?, ?)`
  );
  lineas.forEach((l, i) =>
    insLinea.run(randomUUID(), id, l.atraccion_id, l.descripcion, l.cantidad, l.precio_unitario, i)
  );

  return { id };
}

export function cambiarEstadoEvento(id: string, estado: string): void {
  db.prepare("update eventos set estado = ?, actualizado_en = ? where id = ?").run(
    estado,
    new Date().toISOString(),
    id
  );
}

export function borrarEvento(id: string): void {
  db.prepare("delete from eventos where id = ?").run(id);
}

export interface FilaCliente {
  id?: string | null;
  nombre: string;
  tipo: string;
  cif_nif: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  cp: string | null;
  retiene_irpf: boolean;
  notas: string | null;
}

export function guardarCliente(fila: FilaCliente, id?: string | null): void {
  const ahora = new Date().toISOString();
  if (id) {
    db.prepare(
      `update clientes set
         nombre = ?, tipo = ?, cif_nif = ?, email = ?, telefono = ?, direccion = ?,
         poblacion = ?, provincia = ?, cp = ?, retiene_irpf = ?, notas = ?
       where id = ?`
    ).run(
      fila.nombre, fila.tipo, fila.cif_nif, fila.email, fila.telefono, fila.direccion,
      fila.poblacion, fila.provincia, fila.cp, fila.retiene_irpf ? 1 : 0, fila.notas, id
    );
  } else {
    db.prepare(
      `insert into clientes
         (id, nombre, tipo, cif_nif, email, telefono, direccion, poblacion, provincia, cp, retiene_irpf, notas, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(), fila.nombre, fila.tipo, fila.cif_nif, fila.email, fila.telefono,
      fila.direccion, fila.poblacion, fila.provincia, fila.cp,
      fila.retiene_irpf ? 1 : 0, fila.notas, ahora
    );
  }
}

export function archivarCliente(id: string): void {
  db.prepare("update clientes set borrado_en = ? where id = ?").run(
    new Date().toISOString(),
    id
  );
}

export interface FilaAtraccion {
  id?: string | null;
  nombre: string;
  slug: string;
  categoria: string;
  descripcion: string | null;
  precio_base: number | null;
  duracion_base: string;
  incluida_en_packs: boolean;
  orden: number;
  activa: boolean;
}

export function guardarAtraccion(fila: FilaAtraccion): void {
  const id = fila.id ?? randomUUID();
  const ahora = new Date().toISOString();
  if (fila.id) {
    db.prepare(
      `update atracciones set
         nombre = ?, slug = ?, categoria = ?, descripcion = ?, precio_base = ?,
         duracion_base = ?, incluida_en_packs = ?, orden = ?, activa = ?
       where id = ?`
    ).run(
      fila.nombre, fila.slug, fila.categoria, fila.descripcion, fila.precio_base,
      fila.duracion_base, fila.incluida_en_packs ? 1 : 0, fila.orden,
      fila.activa ? 1 : 0, id
    );
  } else {
    db.prepare(
      `insert into atracciones
         (id, nombre, slug, categoria, descripcion, precio_base, duracion_base, incluida_en_packs, orden, activa, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, fila.nombre, fila.slug, fila.categoria, fila.descripcion, fila.precio_base,
      fila.duracion_base, fila.incluida_en_packs ? 1 : 0, fila.orden,
      fila.activa ? 1 : 0, ahora
    );
  }
}

export function archivarAtraccion(id: string): void {
  db.prepare("update atracciones set activa = 0 where id = ?").run(id);
}

export interface FilaPack {
  id?: string | null;
  nombre: string;
  descripcion: string | null;
  incluye: string[];
  precio_base: number | null;
  orden: number;
  activo: boolean;
}

export function guardarPack(fila: FilaPack): void {
  const id = fila.id ?? randomUUID();
  const ahora = new Date().toISOString();
  const incluyeJson = JSON.stringify(fila.incluye);
  if (fila.id) {
    db.prepare(
      `update packs set nombre = ?, descripcion = ?, incluye = ?, precio_base = ?, orden = ?, activo = ? where id = ?`
    ).run(fila.nombre, fila.descripcion, incluyeJson, fila.precio_base, fila.orden, fila.activo ? 1 : 0, id);
  } else {
    db.prepare(
      `insert into packs (id, nombre, descripcion, incluye, precio_base, orden, activo, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, fila.nombre, fila.descripcion, incluyeJson, fila.precio_base, fila.orden, fila.activo ? 1 : 0, ahora);
  }
}

export function archivarPack(id: string): void {
  db.prepare("update packs set activo = 0 where id = ?").run(id);
}

export interface FilaConfig {
  nombre: string;
  cif: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  iban: string | null;
  iva_defecto: number;
  irpf_defecto: number;
  serie_facturas: string;
  suplemento_5h: number;
  suplemento_8h: number;
}

export function guardarConfiguracion(fila: FilaConfig): void {
  db.prepare(
    `update empresa_config set
       nombre = ?, cif = ?, direccion = ?, poblacion = ?, provincia = ?,
       telefono = ?, email = ?, iban = ?, iva_defecto = ?, irpf_defecto = ?,
       serie_facturas = ?, suplemento_5h = ?, suplemento_8h = ?, actualizado_en = ?
     where id = 1`
  ).run(
    fila.nombre, fila.cif, fila.direccion, fila.poblacion, fila.provincia,
    fila.telefono, fila.email, fila.iban, fila.iva_defecto, fila.irpf_defecto,
    fila.serie_facturas, fila.suplemento_5h, fila.suplemento_8h, new Date().toISOString()
  );
}

// ------------------------------------------------------------
// Tesorería
// ------------------------------------------------------------
function aCuenta(f: Fila): Cuenta {
  return {
    id: String(f.id),
    nombre: String(f.nombre),
    tipo: f.tipo as Cuenta["tipo"],
    saldo_inicial: Number(f.saldo_inicial),
    activa: bool(f.activa as number),
    creado_en: String(f.creado_en),
  };
}

const COLUMNAS_COBRO =
  `c.id, c.fecha, c.concepto, c.importe, c.metodo, c.evento_id, c.cliente_id,
   cu.nombre as cuenta_nombre, e.titulo as evento_titulo, cl.nombre as cliente_nombre,
   null as categoria, null as referencia`;

const COLUMNAS_GASTO =
  `g.id, g.fecha, g.concepto, g.importe, g.metodo, g.factura_ref as referencia,
   cu.nombre as cuenta_nombre, null as evento_id, null as cliente_id,
   null as evento_titulo, null as cliente_nombre, g.categoria`;

const aCobroRow = (f: Fila): Movimiento => ({
  id: String(f.id),
  tipo: "cobro",
  fecha: String(f.fecha),
  concepto: String(f.concepto),
  cuenta_nombre: (f.cuenta_nombre as string) ?? "—",
  importe: Number(f.importe),
  evento_id: f.evento_id ? String(f.evento_id) : null,
  evento_titulo: (f.evento_titulo as string) ?? null,
  cliente_nombre: (f.cliente_nombre as string) ?? null,
  categoria: null,
  metodo: f.metodo as Movimiento["metodo"],
  referencia: null,
});

const aGastoRow = (f: Fila): Movimiento => ({
  id: String(f.id),
  tipo: "gasto",
  fecha: String(f.fecha),
  concepto: String(f.concepto),
  cuenta_nombre: (f.cuenta_nombre as string) ?? "—",
  importe: Number(f.importe),
  evento_id: null,
  evento_titulo: null,
  cliente_nombre: null,
  categoria: (f.categoria as Movimiento["categoria"]) ?? "otros",
  metodo: f.metodo as Movimiento["metodo"],
  referencia: (f.referencia as string) ?? null,
});

export function getCuentas(): Cuenta[] {
  const filas = db
    .prepare("select * from cuentas where activa = 1 order by tipo asc, nombre asc")
    .all() as Fila[];
  return filas.map(aCuenta);
}

/** Saldo histórico total por cuenta y entradas/salidas del período. */
export function getResumenTesoreria(desde: string, hasta: string): ResumenTesoreria {
  const cuentas = getCuentas();

  const cobrosPeriodo = db
    .prepare(
      `select cuenta_id, coalesce(sum(importe), 0) as s from cobros
       where fecha between ? and ? group by cuenta_id`
    )
    .all(desde, hasta) as Array<{ cuenta_id: string; s: number }>;
  const gastosPeriodo = db
    .prepare(
      `select cuenta_id, coalesce(sum(importe), 0) as s from gastos
       where fecha between ? and ? group by cuenta_id`
    )
    .all(desde, hasta) as Array<{ cuenta_id: string; s: number }>;

  const cobrosTotal = db
    .prepare(`select cuenta_id, coalesce(sum(importe), 0) as s from cobros group by cuenta_id`)
    .all() as Array<{ cuenta_id: string; s: number }>;
  const gastosTotal = db
    .prepare(`select cuenta_id, coalesce(sum(importe), 0) as s from gastos group by cuenta_id`)
    .all() as Array<{ cuenta_id: string; s: number }>;

  const sumar = (arr: Array<{ cuenta_id: string; s: number }>) => arr.reduce((m, r) => {
    m[r.cuenta_id] = Number(r.s);
    return m;
  }, {} as Record<string, number>);

  const cp = sumar(cobrosPeriodo);
  const gp = sumar(gastosPeriodo);
  const ct = sumar(cobrosTotal);
  const gt = sumar(gastosTotal);

  const resumen: SaldoCuenta[] = cuentas.map((cuenta) => ({
    cuenta,
    ingresosPeriodo: cp[cuenta.id] ?? 0,
    gastosPeriodo: gp[cuenta.id] ?? 0,
    saldoTotal: cuenta.saldo_inicial + (ct[cuenta.id] ?? 0) - (gt[cuenta.id] ?? 0),
  }));

  const filasCobros = db
    .prepare(
      `select ${COLUMNAS_COBRO}
       from cobros c
       left join cuentas cu on cu.id = c.cuenta_id
       left join eventos e on e.id = c.evento_id
       left join clientes cl on cl.id = c.cliente_id
       where c.fecha between ? and ?`
    )
    .all(desde, hasta) as Fila[];
  const filasGastos = db
    .prepare(
      `select ${COLUMNAS_GASTO}
       from gastos g
       left join cuentas cu on cu.id = g.cuenta_id
       where g.fecha between ? and ?`
    )
    .all(desde, hasta) as Fila[];

  const movimientos: Movimiento[] = [
    ...filasCobros.map(aCobroRow),
    ...filasGastos.map(aGastoRow),
  ].sort((a, b) => (a.fecha === b.fecha ? a.id.localeCompare(b.id) : a.fecha < b.fecha ? 1 : -1));

  return {
    cuentas: resumen,
    movimientos,
    totalIngresos: movimientos.filter((m) => m.tipo === "cobro").reduce((s, m) => s + m.importe, 0),
    totalGastos: movimientos.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.importe, 0),
  };
}

/** Cobros registrados contra un evento (para calcular cobrado/pendiente). */
export function getCobrosEvento(eventoId: string): Movimiento[] {
  const filas = db
    .prepare(
      `select ${COLUMNAS_COBRO}
       from cobros c
       left join cuentas cu on cu.id = c.cuenta_id
       left join eventos e on e.id = c.evento_id
       left join clientes cl on cl.id = c.cliente_id
       where c.evento_id = ?
       order by c.fecha desc`
    )
    .all(eventoId) as Fila[];
  return filas.map(aCobroRow);
}

export interface FilaCobro {
  id?: string | null;
  cuenta_id: string;
  evento_id: string | null;
  cliente_id: string | null;
  concepto: string;
  fecha: string;
  importe: number;
  metodo: string;
  notas: string | null;
}

export function guardarCobro(fila: FilaCobro, id?: string | null): void {
  const ahora = new Date().toISOString();
  if (id) {
    db.prepare(
      `update cobros set
         cuenta_id = ?, evento_id = ?, cliente_id = ?, concepto = ?, fecha = ?,
         importe = ?, metodo = ?, notas = ?
       where id = ?`
    ).run(
      fila.cuenta_id, fila.evento_id, fila.cliente_id, fila.concepto, fila.fecha,
      fila.importe, fila.metodo, fila.notas, id
    );
  } else {
    db.prepare(
      `insert into cobros
         (id, cuenta_id, evento_id, cliente_id, concepto, fecha, importe, metodo, notas, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(), fila.cuenta_id, fila.evento_id, fila.cliente_id, fila.concepto,
      fila.fecha, fila.importe, fila.metodo, fila.notas, ahora
    );
  }
}

export function borrarCobro(id: string): void {
  db.prepare("delete from cobros where id = ?").run(id);
}

export interface FilaGasto {
  id?: string | null;
  cuenta_id: string;
  categoria: string;
  concepto: string;
  fecha: string;
  importe: number;
  proveedor: string | null;
  metodo: string;
  factura_ref: string | null;
  notas: string | null;
}

export function guardarGasto(fila: FilaGasto, id?: string | null): void {
  const ahora = new Date().toISOString();
  if (id) {
    db.prepare(
      `update gastos set
         cuenta_id = ?, categoria = ?, concepto = ?, fecha = ?, importe = ?,
         proveedor = ?, metodo = ?, factura_ref = ?, notas = ?
       where id = ?`
    ).run(
      fila.cuenta_id, fila.categoria, fila.concepto, fila.fecha, fila.importe,
      fila.proveedor, fila.metodo, fila.factura_ref, fila.notas, id
    );
  } else {
    db.prepare(
      `insert into gastos
         (id, cuenta_id, categoria, concepto, fecha, importe, proveedor, metodo, factura_ref, notas, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(), fila.cuenta_id, fila.categoria, fila.concepto, fila.fecha,
      fila.importe, fila.proveedor, fila.metodo, fila.factura_ref, fila.notas, ahora
    );
  }
}

function aCobro(f: Fila): Cobro {
  return {
    id: String(f.id),
    cuenta_id: String(f.cuenta_id),
    evento_id: f.evento_id ? String(f.evento_id) : null,
    cliente_id: f.cliente_id ? String(f.cliente_id) : null,
    concepto: String(f.concepto),
    fecha: String(f.fecha),
    importe: Number(f.importe),
    metodo: f.metodo as Cobro["metodo"],
    notas: f.notas ? String(f.notas) : null,
    creado_en: String(f.creado_en),
  };
}

function aGasto(f: Fila): Gasto {
  return {
    id: String(f.id),
    cuenta_id: String(f.cuenta_id),
    categoria: f.categoria as Gasto["categoria"],
    concepto: String(f.concepto),
    fecha: String(f.fecha),
    importe: Number(f.importe),
    proveedor: f.proveedor ? String(f.proveedor) : null,
    metodo: f.metodo as Gasto["metodo"],
    factura_ref: f.factura_ref ? String(f.factura_ref) : null,
    notas: f.notas ? String(f.notas) : null,
    creado_en: String(f.creado_en),
  };
}

export function getCobro(id: string): Cobro | null {
  const f = db.prepare("select * from cobros where id = ?").get(id) as Fila | undefined;
  return f ? aCobro(f) : null;
}

export function getGasto(id: string): Gasto | null {
  const f = db.prepare("select * from gastos where id = ?").get(id) as Fila | undefined;
  return f ? aGasto(f) : null;
}

export function borrarGasto(id: string): void {
  db.prepare("delete from gastos where id = ?").run(id);
}

// ------------------------------------------------------------
// Facturación (Fase 3)
// ------------------------------------------------------------
function aFactura(f: Fila): Factura {
  return {
    id: String(f.id),
    numero: String(f.numero),
    serie: String(f.serie),
    fecha: String(f.fecha),
    cliente_id: f.cliente_id ? String(f.cliente_id) : null,
    evento_id: f.evento_id ? String(f.evento_id) : null,
    estado: f.estado as Factura["estado"],
    base_imponible: Number(f.base_imponible),
    iva: Number(f.iva),
    iva_importe: Number(f.iva_importe),
    irpf: Number(f.irpf),
    irpf_importe: Number(f.irpf_importe),
    total: Number(f.total),
    notas: f.notas ? String(f.notas) : null,
    creado_en: String(f.creado_en),
  };
}

function aFacturaLinea(f: Fila): FacturaLinea {
  return {
    id: String(f.id),
    factura_id: String(f.factura_id),
    descripcion: String(f.descripcion),
    cantidad: Number(f.cantidad),
    precio_unitario: Number(f.precio_unitario),
    orden: Number(f.orden),
  };
}

function completarFactura(f: Fila): FacturaCompleta {
  const factura = aFactura(f);

  const lineas = (
    db
      .prepare("select * from factura_lineas where factura_id = ? order by orden asc")
      .all(factura.id) as Fila[]
  ).map(aFacturaLinea);

  let cliente: FacturaCompleta["cliente"] = null;
  if (factura.cliente_id) {
    const c = db
      .prepare(
        `select id, nombre, tipo, cif_nif, direccion, poblacion, provincia, cp, retiene_irpf
         from clientes where id = ?`
      )
      .get(factura.cliente_id) as Fila | undefined;
    if (c) {
      cliente = {
        id: String(c.id),
        nombre: String(c.nombre),
        tipo: c.tipo as Cliente["tipo"],
        cif_nif: (c.cif_nif as string) ?? null,
        direccion: (c.direccion as string) ?? null,
        poblacion: (c.poblacion as string) ?? null,
        provincia: (c.provincia as string) ?? null,
        cp: (c.cp as string) ?? null,
        retiene_irpf: bool(c.retiene_irpf as number),
      };
    }
  }

  let evento: FacturaCompleta["evento"] = null;
  if (factura.evento_id) {
    const e = db
      .prepare("select id, titulo, fecha from eventos where id = ?")
      .get(factura.evento_id) as Fila | undefined;
    if (e) {
      evento = { id: String(e.id), titulo: String(e.titulo), fecha: String(e.fecha) };
    }
  }

  return { ...factura, cliente, evento, factura_lineas: lineas };
}

export function getFacturas(desde: string, hasta: string): FacturaCompleta[] {
  const filas = db
    .prepare(
      "select * from facturas where fecha between ? and ? order by fecha desc, numero desc"
    )
    .all(desde, hasta) as Fila[];
  return filas.map(completarFactura);
}

export function getFactura(id: string): FacturaCompleta | null {
  const f = db.prepare("select * from facturas where id = ?").get(id) as Fila | undefined;
  return f ? completarFactura(f) : null;
}

/** Factura activa (no anulada) vinculada a un evento, si existe. */
export function getFacturaEvento(eventoId: string): FacturaCompleta | null {
  const f = db
    .prepare(
      `select * from facturas where evento_id = ? and estado != 'anulada'
       order by fecha desc limit 1`
    )
    .get(eventoId) as Fila | undefined;
  return f ? completarFactura(f) : null;
}

export interface NuevaFactura {
  evento_id: string;
  fecha: string;
  estado: string; // 'proforma' | 'emitida'
  serie: string;
  iva: number; // tipo de IVA en %
  irpf: number; // tasa de retención en % (se aplica solo si el cliente retiene)
}

/** Crea la factura a partir de las líneas y el cliente del evento. Devuelve el id. */
export function crearFacturaDesdeEvento(nueva: NuevaFactura): { id: string } {
  const evento = db
    .prepare("select * from eventos where id = ?")
    .get(nueva.evento_id) as Fila | undefined;
  if (!evento) throw new Error("No se encontró el evento.");
  const clienteId = evento.cliente_id ? String(evento.cliente_id) : null;
  const cliente = clienteId
    ? (db.prepare("select * from clientes where id = ?").get(clienteId) as Fila | undefined)
    : undefined;
  if (!cliente) throw new Error("El evento no tiene cliente asignado.");

  const lineas = db
    .prepare(
      `select descripcion, cantidad, precio_unitario from evento_lineas
       where evento_id = ? order by orden asc`
    )
    .all(nueva.evento_id) as Array<{ descripcion: string; cantidad: number; precio_unitario: number }>;
  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario), 0);
  if (base <= 0) throw new Error("El evento no tiene importes para facturar.");

  const retiene = bool(cliente.retiene_irpf as number);
  const irpfTasa = retiene ? (nueva.irpf > 0 ? nueva.irpf : IRPF_RETENCION_DEFECTO) : 0;
  const ivaImporte = Number(((base * nueva.iva) / 100).toFixed(2));
  const irpfImporte = Number(((base * irpfTasa) / 100).toFixed(2));
  const total = Number((base + ivaImporte - irpfImporte).toFixed(2));

  const anio = Number(String(nueva.fecha).slice(0, 4)) || new Date().getFullYear();
  const numeros = (
    db.prepare("select numero from facturas where serie = ?").all(nueva.serie) as Array<{
      numero: string;
    }>
  ).map((r) => r.numero);
  const numero = siguienteNumeroFactura(numeros, nueva.serie, anio);

  const id = randomUUID();
  const ahora = new Date().toISOString();

  db.prepare(
    `insert into facturas
       (id, numero, serie, fecha, cliente_id, evento_id, estado,
        base_imponible, iva, iva_importe, irpf, irpf_importe, total, notas, creado_en)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, numero, nueva.serie, nueva.fecha, String(cliente.id), nueva.evento_id, nueva.estado,
    base, nueva.iva, ivaImporte, irpfTasa, irpfImporte, total, null, ahora
  );

  const insLinea = db.prepare(
    `insert into factura_lineas (id, factura_id, descripcion, cantidad, precio_unitario, orden)
     values (?, ?, ?, ?, ?, ?)`
  );
  lineas.forEach((l, i) =>
    insLinea.run(randomUUID(), id, String(l.descripcion), Number(l.cantidad), Number(l.precio_unitario), i)
  );

  return { id };
}

export function cambiarEstadoFactura(id: string, estado: string): void {
  db.prepare("update facturas set estado = ? where id = ?").run(estado, id);
}

// ------------------------------------------------------------
// Amortizaciones (Fase 4.2): bienes de inversión
// ------------------------------------------------------------

function aBien(f: Fila): BienInversion {
  return {
    id: String(f.id),
    descripcion: String(f.descripcion),
    numero_factura: (f.numero_factura as string) ?? null,
    fecha_adquisicion: String(f.fecha_adquisicion),
    valor_sin_iva: Number(f.valor_sin_iva),
    tipo_iva: Number(f.tipo_iva),
    iva_importe: Number(f.iva_importe),
    tipo_bien: f.tipo_bien as TipoBienInversion,
    porcentaje_max: Number(f.porcentaje_max),
    observaciones: (f.observaciones as string) ?? null,
    creado_en: String(f.creado_en),
    actualizado_en: String(f.actualizado_en),
  };
}

export function getBienesInversion(): BienInversion[] {
  const filas = db
    .prepare("select * from bienes_inversion order by fecha_adquisicion desc, creado_en desc")
    .all() as Fila[];
  return filas.map(aBien);
}

export function getBienInversion(id: string): BienInversion | null {
  const f = db
    .prepare("select * from bienes_inversion where id = ?")
    .get(id) as Fila | undefined;
  return f ? aBien(f) : null;
}

export interface NuevoBienInversion {
  descripcion: string;
  numero_factura: string | null;
  fecha_adquisicion: string;
  valor_sin_iva: number;
  tipo_iva: number;
  iva_importe: number;
  tipo_bien: TipoBienInversion;
  porcentaje_max: number;
  observaciones: string | null;
}

export function crearBienInversion(nuevo: NuevoBienInversion): { id: string } {
  const id = randomUUID();
  const ahora = new Date().toISOString();
  db.prepare(
    `insert into bienes_inversion
       (id, descripcion, numero_factura, fecha_adquisicion, valor_sin_iva, tipo_iva,
        iva_importe, tipo_bien, porcentaje_max, observaciones, creado_en, actualizado_en)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, nuevo.descripcion, nuevo.numero_factura, nuevo.fecha_adquisicion,
    nuevo.valor_sin_iva, nuevo.tipo_iva, nuevo.iva_importe, nuevo.tipo_bien,
    nuevo.porcentaje_max, nuevo.observaciones, ahora, ahora
  );
  return { id };
}

export function actualizarBienInversion(id: string, cambios: NuevoBienInversion): void {
  db.prepare(
    `update bienes_inversion set
       descripcion = ?, numero_factura = ?, fecha_adquisicion = ?, valor_sin_iva = ?,
       tipo_iva = ?, iva_importe = ?, tipo_bien = ?, porcentaje_max = ?, observaciones = ?,
       actualizado_en = ?
     where id = ?`
  ).run(
    cambios.descripcion, cambios.numero_factura, cambios.fecha_adquisicion,
    cambios.valor_sin_iva, cambios.tipo_iva, cambios.iva_importe, cambios.tipo_bien,
    cambios.porcentaje_max, cambios.observaciones,
    new Date().toISOString(), id
  );
}

export function borrarBienInversion(id: string): void {
  db.prepare("delete from bienes_inversion where id = ?").run(id);
}