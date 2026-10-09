# Go Fun · Gestión

Aplicación privada de gestión para **Go Fun Eventos** (Almagro, Ciudad Real):
calendario de eventos y gestión económica del negocio de alquiler de hinchables.

- **Stack**: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + Supabase.
- **Datos**: Supabase (Postgres) con seguridad RLS para el equipo autenticado.
- **Renderizado**: páginas dinámicas del lado del servidor (sesión obligatoria en todo el panel).

## Puesta en marcha

### Opción A — Modo local (sin Supabase, ideal para probar ya)

La app arranca sin configuración y funciona con una **base SQLite local**
(`data/gofun.db`, ignorada por git) y una sesión propia:

```bash
npm install
npm run dev
```

- **Usuario**: `admin` · **Contraseña**: `admin` (configurable en la tabla `usuarios`).
- Abre [http://localhost:3000](http://localhost:3000) y entra con esas credenciales.
- El catálogo y packs reales de la web se siembran automáticamente al primer arranque.

Cuando quieras pasar a producción con el equipo, crea el proyecto de Supabase y
rellena `.env.local` (opción B): la app detecta las credenciales y cambia a
Supabase automáticamente sin tocar código.

> El modo local es para desarrollo/pruebas. Para datos reales del negocio usa
> Supabase (opción B), que tiene RLS y copias de seguridad.

### Opción B — Supabase (producción)

### 1. Crear el proyecto de Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com/dashboard).
2. Copia **Project URL** y **anon key** desde *Project Settings → API*.
3. Rellena `.env.local` (copia desde `.env.example`):

   ```bash
   cp .env.example .env.local
   # y edita .env.local con tus credenciales reales
   ```

4. Ejecuta las migraciones de `supabase/migrations/` en el **SQL Editor**
   de Supabase, en orden (`20261008120000_init.sql` → `20261008120001_tesoreria.sql`
   → `20261008130000_facturacion.sql`). Crean las tablas, activan RLS e insertan el
   catálogo real de la web y los packs.
5. Crea un usuario del equipo en **Authentication → Users → Add user**.

Hasta que existan credenciales reales, la app muestra una pantalla de
configuración en `/login`.

### 2. Instalar y arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El `proxy` redirige
cualquier ruta privada sin sesión a `/login`.

## Estructura

```
supabase/migrations/        # SQL inicial (esquema + RLS + semilla)
src/
  proxy.ts                  # Protección de rutas y refresco de sesión (Next 16)
  lib/
    types.ts                # Tipos de dominio
    constantes.ts           # Estados de evento, zonas, duraciones, catálogo
    data.ts                 # Consultas (Server Components)
    format.ts               # Formato de fechas, horas y euros
    supabase/               # Clientes de Supabase (server/client/proxy)
    actions/                # Server Actions (escriben en la BD)
  components/               # Shell, calendario, formularios, UI
  app/
    login/                  # Acceso del equipo
    (app)/                  # Panel, calendario, eventos, tesorería, facturación…
    ```

## Funcionalidad por fases

- **F0 — Base**: proyecto, Supabase, login, shell y navegación.
- **F1 — Catálogo y eventos** ✅:
  - Calendario mensual por URL (`?mes=YYYY-MM`), con estado, dirección y horario de montaje.
  - Eventos con líneas (atracción × cantidad × precio), auto-precio según tarifa
    y suplementos de duración (5 h / 8 h) configurables en Ajustes.
  - Clientes (particulares y empresas; IRPF por cliente) y catálogo de atracciones/packs.
- **F2 — Tesorería** ✅:
  - Cuentas por defecto (Caja y Banco) con saldo inicial y saldo actual.
  - **Cobros** (señales, pagos a cuenta, pago completo) enlazables a un evento:
    el detalle del evento muestra **cobrado / pendiente** y un acceso directo
    a «Registrar cobro».
  - **Gastos** con categoría, proveedor, método de pago y nº de factura.
  - Libro mensual de movimientos (`?mes=YYYY-MM`) con totales de ingresos, gastos
    y neto del mes, edición y borrado de cada movimiento.
- **F3 — Facturación** ✅:
  - Generación de facturas desde los eventos con **numeración correlativa por serie**
    (`F2026-0001`, serie configurable en Ajustes).
  - **IVA 21 %** siempre y retención de **IRPF 15 %** solo cuando el cliente es
    empresa o administración (total = base + IVA − IRPF). Estados *proforma*,
    *emitida* y *anulada* (el número anulado no se reutiliza).
  - Vista imprimible de la factura con los datos fiscales de la empresa y del cliente,
    e **informe fiscal** por trimestre o año (base imponible, cuota IVA, retención
    IRPF y total), contando solo las facturas emitidas.
- **F4 — Pulido** (en curso):
  - **Exportaciones CSV** ✅ (F4.1): libro de tesorería por mes, eventos y clientes
    desde sus listados, e informe fiscal por trimestre/año desde Facturación.
    Archivos compatibles con Excel/LibreOffice (`;`, decimales con coma, UTF-8).
  - **PWA** (pendiente): instalable y con caché offline.

## Decisiones de fiscalidad

- Empresa S.L./S.A. → **IVA 21 %**, sin retención propia al emitir.
- **IRPF 15 %** se aplica solo cuando el cliente es empresa o administración
  (ajustable por cliente en `retiene_irpf`).
- Los importes de los suplementos (25 € / 5 h, 55 € / 8 h) y la serie de facturas
  (`F`) son configurables en **Ajustes**; conviene que tu gestor valide los
  valores por defecto.