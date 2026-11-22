<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Flujo de trabajo del repo (decisión del usuario)

Netlify tiene un límite diario de pushes/builds:

- Trabajar en local y hacer **un commit local por cada desarrollo terminado**.
- **No hacer `git push`** después de cada commit ni sin confirmación explícita.
- Solo cuando el usuario lo pida, hacer **un único `git push origin development`**
  con todos los commits locales acumulados, para que Netlify haga una sola build.
