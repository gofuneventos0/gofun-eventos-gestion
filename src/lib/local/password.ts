import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseñas (scrypt + sal). Sin dependencias externas.
 * Solo se usa en modo local; en modo Supabase la autenticación la gestiona GoTrue.
 */
export function hashPassword(password: string): string {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(password, sal, 64).toString("hex");
  return `${sal}:${hash}`;
}

export function verificarPassword(password: string, almacenado: string): boolean {
  const [sal, hash] = almacenado.split(":");
  if (!sal || !hash) return false;
  const calc = scryptSync(password, sal, 64);
  const esperado = Buffer.from(hash, "hex");
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}