import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/local/sesion";

/** Rutas públicas: raíz y login. Todo lo demás exige sesión. */
const PUBLICOS = ["/", "/login"];

function esPublica(pathname: string): boolean {
  return PUBLICOS.includes(pathname);
}

/**
 * Next.js 16: `middleware` se ha renombrado a `proxy`.
 * Verifica la cookie de sesión firmada (HMAC) y protege las rutas privadas.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_SESION)?.value;
  const userId = token ? await verificarToken(token) : null;

  if (!userId && !esPublica(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("desde", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluimos assets estáticos, imágenes y API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp|css|js|map)$).*)"],
};
