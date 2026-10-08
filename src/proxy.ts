import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Rutas públicas: raíz y login. Todo lo demás exige sesión. */
const PUBLICOS = ["/", "/login"];

function esPublica(pathname: string): boolean {
  return PUBLICOS.includes(pathname);
}

/**
 * Next.js 16: `middleware` se ha renombrado a `proxy`.
 * Refresca la sesión de Supabase y protege las rutas privadas.
 */
export async function proxy(request: NextRequest) {
  const { response, user, configurado } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Sin credenciales: sólo dejamos ver la raíz y la página de login
  // (que explica cómo configurar Supabase).
  if (!configurado) {
    if (esPublica(pathname)) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user && !esPublica(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("desde", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  // Excluimos assets estáticos, imágenes y API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp|css|js|map)$).*)"],
};
