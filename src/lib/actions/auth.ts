"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, firmarSesion } from "@/lib/local/sesion";
import { autenticarLocal } from "@/lib/local/auth";
import { texto, type Resultado } from "./form";

/** Login del equipo contra la tabla `usuarios` de la base de datos. */
export async function acceder(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  const email = texto(formData, "email") ?? "";
  const password = texto(formData, "password") ?? "";
  const desde = texto(formData, "desde") ?? "/panel";

  if (!email || !password) {
    return { ok: false, mensaje: "Introduce usuario y contraseña." };
  }

  const usuario = await autenticarLocal(email, password);
  if (!usuario) return { ok: false, mensaje: "Usuario o contraseña incorrectos." };

  const token = await firmarSesion(usuario.id);
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  redirect(desde.startsWith("/") ? desde : "/panel");
}

/** Cierra la sesión. */
export async function salirSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/login");
}
