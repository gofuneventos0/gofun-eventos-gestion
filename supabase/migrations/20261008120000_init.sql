-- ============================================================
-- Go Fun Eventos · Gestión (contabilidad y calendario)
-- Migración inicial — Fase 0 + 1
-- Configuración, catálogo, clientes y eventos
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. Configuración de la empresa (tabla de una sola fila, id = 1)
-- ------------------------------------------------------------
create table if not exists empresa_config (
  id                int primary key check (id = 1),
  nombre            text    not null default 'Go Fun Eventos',
  cif               text,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  telefono          text,
  email             text,
  iban              text,
  -- Fiscalidad (S.L.): IVA 21%, sin retención propia en emisión
  iva_defecto       numeric(5,2) not null default 21.00,
  irpf_defecto      numeric(5,2) not null default 0.00,
  serie_facturas    text    not null default 'F',
  ultimo_numero     int     not null default 0,
  moneda            text    not null default 'EUR',
  -- Suplementos de tarifa por duración (horas)
  suplemento_5h     numeric(5,2) not null default 25.00,
  suplemento_8h     numeric(5,2) not null default 55.00,
  actualizado_en    timestamptz not null default now()
);

insert into empresa_config (id, nombre)
values (1, 'Go Fun Eventos')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. Catálogo de atracciones
-- ------------------------------------------------------------
create table if not exists atracciones (
  id                uuid primary key default gen_random_uuid(),
  nombre            text    not null,
  slug              text    not null unique,
  categoria         text    not null default 'infantil'
                    check (categoria in ('infantil','verano','deportes','adultos','servicios')),
  descripcion       text,
  -- null = solo incluida en packs (equipo de música, zona de juegos)
  precio_base       numeric(10,2),
  duracion_base     text    not null default '3-4 h',
  incluida_en_packs boolean not null default false,
  orden             int     not null default 0,
  activa            boolean not null default true,
  creado_en         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Packs de ahorro
-- ------------------------------------------------------------
create table if not exists packs (
  id                uuid primary key default gen_random_uuid(),
  nombre            text    not null,
  descripcion       text,
  incluye           text[]  not null default '{}',
  precio_base       numeric(10,2),
  orden             int     not null default 0,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. Clientes
-- ------------------------------------------------------------
create table if not exists clientes (
  id                uuid primary key default gen_random_uuid(),
  nombre            text    not null,
  tipo              text    not null default 'particular'
                    check (tipo in ('particular','empresa','administracion')),
  cif_nif           text,
  email             text,
  telefono          text,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  cp                text,
  -- Si el cliente es S.L./S.A./admón. público, retiene 15% IRPF
  retiene_irpf      boolean not null default false,
  notas             text,
  borrado_en        timestamptz,
  creado_en         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. Eventos (reservas de montaje)
-- ------------------------------------------------------------
create table if not exists eventos (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid references clientes (id) on delete set null,
  titulo            text    not null,
  tipo              text    not null default 'particular'
                    check (tipo in ('particular','cumpleaños','comunión','boda','verbena',
                                    'ayuntamiento','colegio','empresa','otro')),
  estado            text    not null default 'borrador'
                    check (estado in ('borrador','confirmado','realizado','cobrado','cancelado')),
  fecha             date    not null,
  -- Horario del día: salida del almacén → montaje → inicio → fin
  hora_salida       time,
  hora_montaje      time,
  hora_inicio       time,
  hora_fin          time,
  direccion         text,
  poblacion         text,
  provincia         text    default 'Ciudad Real',
  zona              text    not null default 'almagro'
                    check (zona in ('almagro_30km','provincia_cr','clm')),
  duracion_horas    text    not null default '3-4 h'
                    check (duracion_horas in ('3-4 h','5 h','8 h')),
  importe_total     numeric(10,2) not null default 0,
  notas             text,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index if not exists eventos_fecha_idx on eventos (fecha desc);
create index if not exists eventos_cliente_idx on eventos (cliente_id);

-- ------------------------------------------------------------
-- 6. Líneas del evento (atracciones contratadas)
-- ------------------------------------------------------------
create table if not exists evento_lineas (
  id                uuid primary key default gen_random_uuid(),
  evento_id         uuid not null references eventos (id) on delete cascade,
  atraccion_id      uuid references atracciones (id) on delete set null,
  -- Nombre congelado: el catálogo puede cambiar sin romper el histórico
  descripcion       text    not null,
  cantidad          int     not null default 1 check (cantidad > 0),
  precio_unitario   numeric(10,2) not null default 0,
  orden             int     not null default 0
);

create index if not exists evento_lineas_evento_idx on evento_lineas (evento_id);

-- ------------------------------------------------------------
-- 7. updated_at automático
-- ------------------------------------------------------------
create or replace function touch_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists eventos_touch on eventos;
create trigger eventos_touch
  before update on eventos
  for each row execute function touch_actualizado_en();

-- ------------------------------------------------------------
-- 8. Recálculo del importe total del evento al tocar sus líneas
-- ------------------------------------------------------------
create or replace function recalc_importe_evento()
returns trigger
language plpgsql
as $$
declare
  afectado uuid;
begin
  afectado := coalesce(new.evento_id, old.evento_id);

  update eventos e
     set importe_total = coalesce(
           (select sum(el.cantidad * el.precio_unitario)
              from evento_lineas el
             where el.evento_id = e.id), 0)
   where e.id = afectado;

  return coalesce(new, old);
end;
$$;

drop trigger if exists evento_lineas_recalc on evento_lineas;
create trigger evento_lineas_recalc
  after insert or update or delete on evento_lineas
  for each row execute function recalc_importe_evento();

-- ------------------------------------------------------------
-- 9. Seguridad (RLS): acceso para el equipo autenticado
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['empresa_config','atracciones','packs','clientes','eventos','evento_lineas']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'drop policy if exists "equipo total" on %I', t);
    execute format(
      'create policy "equipo total" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 10. Semilla: catálogo real de Go Fun Eventos (web pública)
-- ------------------------------------------------------------
insert into atracciones (nombre, slug, categoria, descripcion, precio_base, duracion_base, incluida_en_packs, orden) values
  ('Castillos Hinchables',   'castillos',   'infantil', 'Saltos y diversión para comuniones y cumpleaños. Hinchables homologados con revisión técnica.', 150.00, '3-4 h', false, 1),
  ('Toro Mecánico',          'toro',        'adultos',  'Incluye monitor profesional para adaptar la velocidad a niños y adultos.',                        350.00, '3-4 h', false, 2),
  ('La Barredora Humana',    'barredora',   'deportes', 'Demuestra tus reflejos. ¿Quién aguantará más tiempo en pie sin caer?',                          300.00, '3-4 h', false, 3),
  ('Deslizador Acuático',    'deslizador',  'verano',   'La mejor opción para eventos de verano y fiestas acuáticas.',                                  250.00, '3-4 h', false, 4),
  ('Cañón de Espuma',        'espona',      'verano',   'Fiesta de la espuma apta para todas las edades.',                                              200.00, '3-4 h', false, 5),
  ('Equipo de Música',       'musica',      'servicios','Sonido e iluminación profesional para ambientar tu celebración.',                               null,    '3-4 h', true,  6),
  ('Futbolín Humano',        'futbolin',    'deportes', 'Trabajo en equipo y competencia deportiva en formato gigante.',                                 150.00, '3-4 h', false, 7),
  ('Circuito de Karts',      'karts',       'deportes', 'Circuito móvil de karts a pedales para poner a prueba tu habilidad de conducción.',            350.00, '3-4 h', false, 8),
  ('Camas Elásticas',        'camas',       'infantil', 'Estructuras de salto con protección de red de alta seguridad.',                                  80.00,  '3-4 h', false, 9),
  ('Zona de Juegos',         'zona-juegos', 'servicios','Tiro con arco, mini golf, bádminton, ping pong y paracaídas de colores.',                        null,    '3-4 h', true,  10)
on conflict (slug) do nothing;

insert into packs (nombre, descripcion, incluye, precio_base, orden) values
  ('Pack Estándar', 'Barredora o toro + hinchables (3 h).',
     array['⚡ Barredora o Toro 🐂','🏰 Hinchables (3h)'], null, 1),
  ('Pack Verano', 'La combinación acuática completa para primavera y verano.',
     array['🧼 Cañón de Espuma','🏰 Deslizador Acuático','🔊 Equipo Sonido','⚽ Futbolín Humano'], null, 2),
  ('Pack Despedida', 'Nivel profesional para despedidas de soltero/a.',
     array['🐂 Toro Mecánico (Nivel Pro)','🔊 Equipo Sonido 2000W','🎁 Regalo sorpresa'], null, 3),
  ('Pack VIP', 'Todo incluido, el pack más completo.',
     array['⚡ Barredora o Toro 🐂','🏰 Deslizador Acuático','🔊 Equipo Sonido','🧼 Cañón de Espuma','🏰 Hinchable (3h)'], null, 4),
  ('Pack a Medida', 'Combina las atracciones que quieras. Ej.: Toro + Castillo = 450 € · Castillo + Futbolín = 275 €.',
     array['Configura tu combinación personalizada'], null, 5)
on conflict do nothing;
