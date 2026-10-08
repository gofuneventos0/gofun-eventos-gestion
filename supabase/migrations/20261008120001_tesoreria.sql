-- ============================================================
-- Go Fun Eventos · Gestión (contabilidad y calendario)
-- Migración Fase 2 — Tesorería
-- Cuentas (caja/banco), cobros y gastos
-- ============================================================

-- ------------------------------------------------------------
-- 1. Cuentas de tesorería (caja y banco)
-- ------------------------------------------------------------
create table if not exists cuentas (
  id                uuid primary key default gen_random_uuid(),
  nombre            text    not null,
  tipo              text    not null default 'caja' check (tipo in ('caja','banco')),
  saldo_inicial     numeric(12,2) not null default 0,
  activa            boolean not null default true,
  creado_en         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Cobros (entradas de dinero)
-- ------------------------------------------------------------
create table if not exists cobros (
  id                uuid primary key default gen_random_uuid(),
  cuenta_id         uuid not null references cuentas (id) on delete restrict,
  evento_id         uuid references eventos (id) on delete set null,
  cliente_id        uuid references clientes (id) on delete set null,
  concepto          text    not null,
  fecha             date    not null,
  importe           numeric(10,2) not null check (importe > 0),
  metodo            text    not null default 'efectivo' check (metodo in ('efectivo','transferencia','tarjeta','bizum')),
  notas             text,
  creado_en         timestamptz not null default now()
);

create index if not exists cobros_fecha_idx on cobros (fecha desc);
create index if not exists cobros_evento_idx on cobros (evento_id);
create index if not exists cobros_cuenta_idx on cobros (cuenta_id);

-- ------------------------------------------------------------
-- 3. Gastos (salidas de dinero)
-- ------------------------------------------------------------
create table if not exists gastos (
  id                uuid primary key default gen_random_uuid(),
  cuenta_id         uuid not null references cuentas (id) on delete restrict,
  categoria         text    not null default 'otros' check (categoria in ('combustible','reparaciones','material','publicidad','impuestos','personal','otros')),
  concepto          text    not null,
  fecha             date    not null,
  importe           numeric(10,2) not null check (importe > 0),
  proveedor         text,
  metodo            text    not null default 'efectivo' check (metodo in ('efectivo','transferencia','tarjeta','bizum')),
  factura_ref       text,
  notas             text,
  creado_en         timestamptz not null default now()
);

create index if not exists gastos_fecha_idx on gastos (fecha desc);
create index if not exists gastos_cuenta_idx on gastos (cuenta_id);

-- ------------------------------------------------------------
-- 4. Seguridad (RLS): acceso para el equipo autenticado
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['cuentas','cobros','gastos']
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
-- 5. Semilla: cuentas por defecto
-- ------------------------------------------------------------
insert into cuentas (nombre, tipo, saldo_inicial, activa) values
  ('Caja',  'caja',  0, true),
  ('Banco', 'banco', 0, true);