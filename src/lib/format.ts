import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";

const MONEDA_EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONEDA_EUR_SIN_DEC = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1234.5 → "1.234,50 €" */
export function euros(value: number | null | undefined): string {
  return MONEDA_EUR.format(Number(value ?? 0));
}

/** 1234.5 → "1.235 €" (para listados compactos) */
export function eurosCorto(value: number | null | undefined): string {
  return MONEDA_EUR_SIN_DEC.format(Number(value ?? 0));
}

/** '2026-10-08' → 'jueves, 8 de octubre de 2026' */
export function fechaLarga(iso: string): string {
  return format(parseISO(iso), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

/** '2026-10-08' → 'jue 8 oct' */
export function fechaCorta(iso: string): string {
  return format(parseISO(iso), "EEE d MMM", { locale: es });
}

/** '2026-10-08' → '08/10/2026' */
export function fechaNumerica(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy");
}

/** '2026-10-08' → 'octubre 2026' (capitalizado) */
export function mesTexto(iso: string): string {
  const s = format(parseISO(iso), "MMMM yyyy", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** '10:30:00' → '10:30' */
export function hora(value: string | null | undefined): string {
  if (!value) return "—";
  const [h, m] = value.split(":");
  return `${h}:${m}`;
}

/** '2026-10-08' → '2026-10-08' (Supabase devuelve string) */
export function hoyISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

/** Texto "hoy / mañana / pasado mañana" para una fecha ISO */
export function relativo(iso: string): string {
  const hoy = parseISO(hoyISO());
  const fecha = parseISO(iso);
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === 2) return "Pasado mañana";
  if (dias === -1) return "Ayer";
  return "";
}
