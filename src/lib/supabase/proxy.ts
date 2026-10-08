import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, esModoLocal, supabaseUrl, supabaseAnonKey } from "./env";
import { COOKIE_SESION, verificarToken } from "@/lib/local/sesion";

/**
 * Refresca la sesión en cada petición y devuelve el usuario junto con la
 * respuesta propagada.
 *
 * - Modo local: verifica la cookie firmada (HMAC) sin tocar la base de datos.
 * - Modo Supabase: rota las cookies de GoTrue.
 *
 * Usado desde `src/proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  // La respuesta que seguimos y en la que escribimos las cookies rotadas.
  const response = NextResponse.next({ request });

  if (esModoLocal()) {
    const token = request.cookies.get(COOKIE_SESION)?.value;
    const userId = token ? await verificarToken(token) : null;
    return { request, response, user: userId ? { id: userId } : null, configurado: true };
  }

  if (!isSupabaseConfigured()) {
    return { request, response, user: null, configurado: false };
  }

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Importante: no usar getUser() en Server Components sin esto,
  // porque no rota el refresh token y la sesión caducaría.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { request, response, user, configurado: true };
}