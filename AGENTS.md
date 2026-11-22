<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Go Fun · Gestión — notas para agentes

## Puesta en marcha y comandos

- Ejecuta `npm install` antes de nada; `node_modules/` no está versionado. Usa Node 24+ (o una versión con `node:sqlite` disponible sin flags); el modo local depende de ese módulo integrado.
- `npm run dev` — Next.js 16 (App Router) con Turbopack.
- `npm run lint` — ESLint sobre todo el repo.
- `npm run build` — build de producción; también genera `.next/types` para los tipos globales de rutas.
- No hay tests ni CI. Verifica con `npm run lint` y después `npm run build`. `npx tsc --noEmit` solo funciona después de que `dev`/`build` hayan generado `.next/types` (en un clon limpio faltan `next-env.d.ts`, `PageProps` y `LayoutProps`).

## Dos backends de datos (la trampa principal)

- La app arranca en **modo local** salvo que existan credenciales reales de Supabase. El modo local usa SQLite en `data/gofun.db` (ignorado por git), sembrado en el primer uso con `admin` / `admin`, el catálogo, los packs y las cuentas Caja/Banco. Borra `data/` para reiniciar los datos locales.
- Para pasar a Supabase, copia `.env.example` a `.env.local`, rellena URL y anon key reales, aplica `supabase/migrations/*.sql` a mano en el SQL Editor de Supabase por orden de nombre y reinicia el servidor. El modo lo decide `isSupabaseConfigured()` / `esModoLocal()` en `src/lib/supabase/env.ts`; las variables se leen al cargar el módulo.
- Las lecturas deben pasar por la fachada `@/lib/data`. Esta elige `src/lib/local/repo.ts` (SQLite) o `src/lib/data-supabase.ts` (REST).
- Las escrituras están en Server Actions de `src/lib/actions/*` y normalmente necesitan **ambas** ramas: mutación local en `src/lib/local/repo.ts` y código Supabase con `createClient()` de `@/lib/supabase/server`. `createClient()` lanza error en modo local, así que guarda siempre con `esModoLocal()`.
- El esquema está duplicado: `supabase/migrations/*.sql` (Postgres + RLS + semilla) y `src/lib/local/db.ts` (esquema SQLite + semilla). Al cambiar una tabla o campo hay que actualizar ambos y `src/lib/types.ts`.
- Toda Server Action debe llamar a `await requiereSesion()`; las acciones son accesibles por POST directo y el proxy solo protege páginas. Mantén `redirect()` fuera de `try/catch` porque lanza `NEXT_REDIRECT`.
- `src/lib/actions/form.ts` no lleva `"use server"` a propósito: un módulo con esa directiva solo puede exportar funciones asíncronas, y estos helpers son síncronos.

## Next.js 16 y rutas

- La protección de rutas está en `src/proxy.ts`; Next 16 renombró `middleware` a `proxy`. Solo `/` y `/login` son públicas. No añadas `middleware.ts`.
- `src/app/(app)/` es el panel autenticado; sus páginas leen sesión y datos en cada petición.
- Cache Components está desactivado a propósito en `next.config.ts`; no lo reactives ni añadas `<Suspense>` solo por eso.
- Las páginas usan los tipos globales generados `PageProps<"/ruta">` / `LayoutProps<"/">`; mantén ese estilo en vez de escribir los props a mano.

## Convenciones de dominio

- Los textos de UI, los nombres de campos de dominio y la mayoría de comentarios están en español; mantén la coherencia.
- Fechas e importes se formatean solo con `src/lib/format.ts` (`es-ES`, EUR).
- Facturación: IVA 21 % siempre; IRPF 15 % solo para clientes con `retiene_irpf`; total = base + IVA − IRPF. La numeración es por serie/año (`F2026-0001`) mediante `siguienteNumeroFactura` en `src/lib/constantes.ts`. Un evento no puede tener una segunda factura activa (no `anulada`).
- La sesión local es una cookie firmada `gofun_sesion`; configura `GOFUN_SESION_SECRET` fuera de desarrollo (por defecto usa un secreto de desarrollo). El modo Supabase usa las cookies de GoTrue.
