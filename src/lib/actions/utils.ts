"use server";

import { getSessionUser } from "@/lib/local/sesion-servidor";

/** Toda Server Action debe verificar la sesión: son alcanzables por POST directo. */
export async function requiereSesion() {
  const user = await getSessionUser();
  if (!user) throw new Error("No autorizado");
  return user;
}
