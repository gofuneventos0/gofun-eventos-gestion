-- ============================================================
-- Go Fun Eventos · Gestión (contabilidad y calendario)
-- Migración Fase 3 — Facturación
-- Facturas (IVA 21 % y retención IRPF 15 %) e informes fiscales
-- ============================================================

-- ------------------------------------------------------------
-- 1. Facturas
-- numeración correlativa por serie: F2026-0001, F2026-0002…
-- total = base_imponible + iva_importe − irpf_importe
-- ------------------------------------------------------------
create table if not exists facturas (
  id                uuid primary key default gen_random_uuid(),
  numero            text    not null unique,
  serie             text    not null default 'F',
  fecha             date    not null,
  cliente_id        uuid references clientes (id) on delete restrict,
  evento_id         uuid references eventos (id) on delete set null,
  estado            text    not null default 'proforma' check (estado in ('proforma','emitida','anulada')),
  base_imponible    numeric(12,2) not null default 0,
  iva               numeric(5,2)  not null default 21,
  iva_importe       numeric(12,2) not null default 0,
  irpf              numeric(5,2)  not null default 0,
  irpf_importe      numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  notas             text,
  creado_en         timestamptz   not null default now()
);

create index if not exists facturas_fecha_idx on facturas (fecha desc);
create index if not exists facturas_cliente_idx on facturas (cliente_id);
create index if not exists facturas_evento_idx on facturas (evento_id);

-- ------------------------------------------------------------
-- 2. Líneas de factura (copia de las líneas del evento)
-- ------------------------------------------------------------
create table if not exists factura_lineas (
  id                uuid primary key default gen_random_uuid(),
  factura_id        uuid not null references facturas (id) on delete cascade,
  descripcion       text    not null,
  cantidad          integer not null default 1 check (cantidad > 0),
  precio_unitario   numeric(10,2) not null default 0,
  orden             integer not null default 0
);

create index if not exists factura_lineas_factura_idx on factura_lineas (factura_id);

-- ------------------------------------------------------------
-- 3. Seguridad (RLS): acceso para el equipo autenticado
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['facturas','factura_lineas']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'drop policy if exists "equipo total" on %I', t);
    execute format(
      'create policy "equipo total" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;