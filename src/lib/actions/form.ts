/**
 * Helpers síncronos para leer FormData.
 * NO llevan "use server": un módulo con esa directiva solo puede exportar
 * funciones asíncronas, y estos helpers se usan dentro de las Server Actions.
 */
export type Resultado = { ok: boolean; mensaje?: string };

export function texto(formData: FormData, campo: string): string | null {
  const v = formData.get(campo);
  if (typeof v !== "string") return null;
  const limpio = v.trim();
  return limpio.length ? limpio : null;
}

export function numero(formData: FormData, campo: string, porDefecto = 0): number {
  const v = formData.get(campo);
  if (typeof v !== "string" || v.trim() === "") return porDefecto;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : porDefecto;
}

export function booleano(formData: FormData, campo: string): boolean {
  const v = formData.get(campo);
  return v === "on" || v === "true" || v === "1";
}
