-- ============================================================
-- Go Fun Eventos · Gestión (contabilidad y calendario)
-- Migración Fase 4.2 — Amortizaciones
-- Bienes de inversión y cálculo de tablas de amortización
-- ============================================================

-- ------------------------------------------------------------
-- 1. Bienes de inversión
-- porcentaje_max: porcentaje lineal máximo anual según el tipo
-- de bien (tablas de Hacienda). La tabla de amortización de cada
-- bien se calcula en la app a partir de estos datos.
-- ------------------------------------------------------------
create table if not exists bienes_inversion (
  id                uuid primary key default gen_random_uuid(),
  descripcion       text    not null,
  numero_factura    text,
  fecha_adquisicion date    not null,
  valor_sin_iva     numeric(12,2) not null default 0,
  tipo_iva          numeric(5,2)  not null default 21,
  iva_importe       numeric(12,2) not null default 0,
  tipo_bien         text    not null default 'instalaciones'
                    check (tipo_bien in (
                      'instalaciones','maquinaria','equipos_informaticos',
                      'utiles_herramientas','edificios','transporte',
                      'ganado_vacuno','frutales_citricos','ganado_equino','olivar'
                    )),
  porcentaje_max    numeric(5,2)  not null default 10,
  observaciones     text,
  creado_en         timestamptz   not null default now(),
  actualizado_en    timestamptz   not null default now()
);

create index if not exists bienes_inversion_fecha_idx on bienes_inversion (fecha_adquisicion desc);

-- ------------------------------------------------------------
-- 2. Seguridad (RLS): acceso para el equipo autenticado
-- ------------------------------------------------------------
do $$
begin
  perform 1 where to_regclass('public.bienes_inversion') is not null;
  if found then
    execute 'alter table public.bienes_inversion enable row level security';
    execute 'drop policy if exists "equipo total" on public.bienes_inversion';
    execute 'create policy "equipo total" on public.bienes_inversion for all to authenticated using (true) with check (true)';
  end if;
end;
$$;