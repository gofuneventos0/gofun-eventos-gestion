"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requiereSesion } from "./utils";
import { texto, booleano, type Resultado } from "./form";

export async function guardarCliente(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const nombre = texto(formData, "nombre");
  if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };

  const fila = {
    nombre,
    tipo: texto(formData, "tipo") ?? "particular",
    cif_nif: texto(formData, "cif_nif"),
    email: texto(formData, "email"),
    telefono: texto(formData, "telefono"),
    direccion: texto(formData, "direccion"),
    poblacion: texto(formData, "poblacion"),
    provincia: texto(formData, "provincia"),
    cp: texto(formData, "cp"),
    retiene_irpf: booleano(formData, "retiene_irpf"),
    notas: texto(formData, "notas"),
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("clientes").update(fila).eq("id", id)
    : await supabase.from("clientes").insert(fila);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/clientes");
  revalidatePath("/panel");
  return { ok: true, mensaje: id ? "Cliente actualizado." : "Cliente creado." };
}

export async function borrarCliente(id: string): Promise<Resultado> {
  await requiereSesion();
  const supabase = await createClient();

  // Borrado lógico: conserva el histórico de eventos.
  const { error } = await supabase
    .from("clientes")
    .update({ borrado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/clientes");
  return { ok: true, mensaje: "Cliente archivado." };
}
