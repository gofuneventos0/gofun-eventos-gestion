import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, esModoLocal, supabaseUrl, supabaseAnonKey } from "./env";
import { COOKIE_SESION, verificarToken } from "@/lib/local/sesion";
import { obtenerUsuarioPorId } from "@/lib/local/auth";

/**
 * Cliente de Supabase para Server Components y Server Actions.
 * Las cookies se leen y escriben de forma asíncrona en Next.js 16.
 * Solo se usa en modo Supabase; en modo local la app usa SQLite (./local/repo).
 */
export async function createClient() {
  // Leemos cookies primero: marca la ruta como dinámica y evita que el build
  // intente prerenderizar páginas que dependen de la sesión.
  const cookieStore = await cookies();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado. " + "Completa .env.local antes de continuar.");
  }

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Llamado desde un Server Component: las cookies las gestiona el proxy.
        }
      },
    },
  });
}

/**
 * Devuelve el usuario autenticado o null.
 * Útil en Server Actions: hay que verificar SIEMPRE la sesión dentro de la acción.
 */
export async function getSessionUser() {
  if (esModoLocal()) {
    const token = (await cookies()).get(COOKIE_SESION)?.value;
    if (!token) return null;
    const userId = await verificarToken(token);
    if (!userId) return null;
    return obtenerUsuarioPorId(userId);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}