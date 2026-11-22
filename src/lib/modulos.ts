/**
 * Módulos ocultados temporalmente de la interfaz para aligerar la navegación.
 *
 * NO eliminan funcionalidad: las rutas, Server Actions, datos y exportaciones
 * siguen disponibles si se abre la URL directamente. Para volver a mostrarlos,
 * basta con quitarlos de esta lista.
 */
export const MODULOS_OCULTOS = [
  "/facturacion",
  "/amortizaciones",
  "/tesoreria",
] as const;

/** Devuelve true si la ruta (o alguna subclave) no está oculta. */
export function moduloVisible(href: string): boolean {
  return !MODULOS_OCULTOS.some(
    (modulo) => href === modulo || href.startsWith(`${modulo}/`)
  );
}
