/**
 * Loading boundary del panel. Next.js 16 no prefetchea rutas dinámicas sin este
 * archivo: con él, al pinchar en el menú se muestra este esqueleto al instante
 * mientras llega el contenido real.
 */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando…" role="status">
      <div className="h-8 w-1/3 rounded-lg bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-100" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100" />
        ))}
      </div>

      <div className="h-64 rounded-xl bg-gray-100" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
