import { cookies } from "next/headers";
import { COOKIE_SESION, verificarToken } from "./sesion";
import { obtenerUsuarioPorId, type UsuarioLocal } from "./auth";

/**
 * Usuario autenticado a partir de la cookie de sesión firmada.
 * Solo para Server Components y Server Actions (usa next/headers).
 */
export async function getSessionUser(): Promise<UsuarioLocal | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  const userId = await verificarToken(token);
  if (!userId) return null;
  return obtenerUsuarioPorId(userId);
}
