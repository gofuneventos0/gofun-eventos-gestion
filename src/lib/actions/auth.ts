"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { esModoLocal } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_SESION, firmarSesion } from "@/lib/local/sesion";
import { autenticarLocal } from "@/lib/local/auth";
import { texto, type Resultado } from "./form";

/**
 * Login del equipo. Funciona en ambos modos:
 * - Local: verifica admin/admin contra la BD SQLite y firma una cookie.
 * - Supabase: signInWithPassword en el servidor (GoTrue gestiona las cookies).
 */
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

  if (esModoLocal()) {
    const usuario = autenticarLocal(email, password);
    if (!usuario) return { ok: false, mensaje: "Usuario o contraseña incorrectos." };

    const token = await firmarSesion(usuario.id);
    (await cookies()).set(COOKIE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    redirect(desde.startsWith("/") ? desde : "/panel");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, mensaje: "Correo o contraseña incorrectos." };
  redirect(desde.startsWith("/") ? desde : "/panel");
}

/** Cierra la sesión en cualquiera de los dos modos. */
export async function salirSesion(): Promise<void> {
  if (esModoLocal()) {
    (await cookies()).delete(COOKIE_SESION);
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}