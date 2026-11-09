/**
 * Token de sesión firmado (HMAC-SHA256) de la app.
 * Stateless: lo puede verificar el proxy (middleware) sin tocar la base de datos,
 * usando solo WebCrypto (compatible con los runtimes que se cruzan por el camino).
 */

export const COOKIE_SESION = "gofun_sesion";
const DURACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const SECRET_POR_DEFECTO = "gofun-dev-secret-cambiar-en-produccion";
const SECRET = process.env.GOFUN_SESION_SECRET ?? SECRET_POR_DEFECTO;

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  SECRET === SECRET_POR_DEFECTO
) {
  console.warn(
    "[auth] Define GOFUN_SESION_SECRET con una cadena aleatoria: ahora mismo la cookie de sesión usa el secreto de desarrollo."
  );
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(new Uint8Array(sig));
}

/** Crea un token firmado que identifica al usuario y caduca a los 30 días. */
export async function firmarSesion(userId: string): Promise<string> {
  const exp = String(Date.now() + DURACION_MS);
  const payload = `${userId}.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Devuelve el userId si la firma es válida y el token no ha caducado; si no, null. */
export async function verificarToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [userId, exp, firma] = partes;
  if (!userId || !exp || !firma) return null;

  const esperado = await hmac(`${userId}.${exp}`);
  // Comparación en tiempo constante a través de la longitud de los hashes.
  if (esperado.length !== firma.length || esperado !== firma) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}