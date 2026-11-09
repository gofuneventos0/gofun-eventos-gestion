# Go Fun · Gestión

Aplicación privada de gestión para **Go Fun Eventos** (Almagro, Ciudad Real):
calendario de eventos y gestión económica del negocio de alquiler de hinchables.

- **Stack**: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4.
- **Datos**: SQLite gestionado con **Turso (libSQL)** en producción. Es gratuito,
  no se suspende por inactividad y funciona en serverless (conexión HTTP).
- **Renderizado**: páginas dinámicas del lado del servidor (sesión obligatoria en todo el panel).

## Puesta en marcha

### Opción A — Desarrollo local (sin cuenta de Turso)

La app arranca sin configuración y funciona con una **base SQLite local**
(`data/gofun.db`, ignorada por git) y una sesión propia:

```bash
npm install
npm run dev
```

- **Usuario**: `admin` · **Contraseña**: `admin` (configurable en la tabla `usuarios`).
- Abre [http://localhost:3000](http://localhost:3000) y entra con esas credenciales.
- El catálogo y packs reales de la web se siembran automáticamente al primer arranque.

El esquema se crea solo (tablas + semilla) la primera vez que se usa la base.

### Opción B — Turso (producción)

1. Crea una cuenta gratuita en [turso.tech](https://turso.tech).
2. Instala la CLI y crea la base de datos:

   ```bash
   turso auth login
   turso db create gofun
   turso db show gofun --url          # TURSO_DATABASE_URL
   turso db tokens create gofun       # TURSO_AUTH_TOKEN
   ```

3. Copia `.env.example` a `.env.local` y rellena:

   ```bash
   TURSO_DATABASE_URL=libsql://gofun-tuusuario.turso.io
   TURSO_AUTH_TOKEN=...
   GOFUN_SESION_SECRET=una-cadena-larga-y-aleatoria
   ```

4. Arranca (`npm run dev`) y entra con `admin` / `admin`. El esquema y el
   catálogo se crean automáticamente en Turso en el primer acceso.

> Cambia la contraseña de `admin` desde la tabla `usuarios` (hash scrypt) o
> añade usuarios nuevos antes de dar acceso al equipo.

## Despliegue en Netlify

La app está preparada para Netlify (Next.js 16 con su runtime; `netlify.toml`
y `.nvmrc` incluidos). En serverless **no hay sistema de archivos persistente**,
así que producción debe usar Turso.

1. **Turso**: crea la base y anota URL + token (ver Opción B).
2. **Conecta el repo en Netlify** (*Add new site → Import an existing project*).
   Netlify detecta Next.js automáticamente (`npm run build` y `.next`) y respeta
   `.nvmrc` (Node 24).
3. **Variables de entorno** en *Site → Configuration → Environment variables*:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `GOFUN_SESION_SECRET`

   Tras cambiarlas, lanza un rebuild en *Deploys → Trigger deploy*.

### Repo y despliegue automático

El repo se renombró en GitHub de `contabilidadycalendario` a
**`gofuneventos0/gofun-eventos-gestion`** (la URL antigua redirige automáticamente).
El sitio de Netlify está conectado a este mismo repo y despliega la rama
`development`. Cada `git push origin development` sube el código y Netlify
**redespliega solo**.

## Estructura

```
src/
  proxy.ts                  # Protección de rutas y sesión (Next 16)
  lib/
    types.ts                # Tipos de dominio
    constantes.ts           # Estados de evento, zonas, duraciones, catálogo
    data.ts                 # Fachada de datos (re-exporta local/repo)
    format.ts               # Formato de fechas, horas y euros
    local/
      db.ts                 # Cliente Turso/libSQL + esquema + semilla
      repo.ts               # Consultas y mutaciones
      auth.ts               # Usuarios y contraseñas
      sesion.ts             # Cookie de sesión firmada (HMAC)
    actions/                # Server Actions (escriben en la BD)
  components/               # Shell, calendario, formularios, UI
  app/
    login/                  # Acceso del equipo
    (app)/                  # Panel, calendario, eventos, tesorería, facturación…
```

> La carpeta `supabase/` se conserva como histórico de la primera versión; la
> app ya no la usa ni necesita Supabase.

## Funcionalidad por fases

- **F0 — Base**: proyecto, base de datos, login, shell y navegación.
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
  - **Amortizaciones** ✅ (F4.2): bienes de inversión y tablas de amortización.
  - **PWA** (pendiente): instalable y con caché offline.

## Decisiones de fiscalidad

- Empresa S.L./S.A. → **IVA 21 %**, sin retención propia al emitir.
- **IRPF 15 %** se aplica solo cuando el cliente es empresa o administración
  (ajustable por cliente en `retiene_irpf`).
- Los importes de los suplementos (25 € / 5 h, 55 € / 8 h) y la serie de facturas
  (`F`) son configurables en **Ajustes**; conviene que tu gestor valide los
  valores por defecto.
