import { getSessionUser } from "@/lib/local/sesion-servidor";

/**
 * Se renderiza dentro de su propio <Suspense> en el layout: así el menú y el
 * contenido no esperan a la lectura de sesión para aparecer.
 */
export default async function CorreoSesion() {
  const user = await getSessionUser();
  return <>{user?.email ?? "Sesión activa"}</>;
}
