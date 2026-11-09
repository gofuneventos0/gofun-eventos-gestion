"use server";

import { revalidatePath } from "next/cache";
import {
  guardarCliente as guardarClienteDb,
  archivarCliente as archivarClienteDb,
} from "@/lib/local/repo";
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

  try {
    await guardarClienteDb(fila, id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar el cliente.",
    };
  }

  revalidatePath("/clientes");
  revalidatePath("/panel");
  return { ok: true, mensaje: id ? "Cliente actualizado." : "Cliente creado." };
}

export async function borrarCliente(id: string): Promise<Resultado> {
  await requiereSesion();

  // Borrado lógico: conserva el histórico de eventos.
  try {
    await archivarClienteDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al archivar el cliente.",
    };
  }

  revalidatePath("/clientes");
  return { ok: true, mensaje: "Cliente archivado." };
}
