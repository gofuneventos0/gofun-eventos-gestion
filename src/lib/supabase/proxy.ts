import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./env";

/**
 * Refresca la sesión de Supabase en cada petición (rotación de cookies)
 * y devuelve el usuario junto con la respuesta propagada.
 *
 * Usado desde `src/proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  // La respuesta que seguimos y en la que escribimos las cookies rotadas.
  const response = NextResponse.next({ request });

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
