"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  guardarEvento as guardarEventoDb,
  cambiarEstadoEvento as cambiarEstadoEventoDb,
  borrarEvento as borrarEventoDb,
} from "@/lib/local/repo";
import type { EstadoEvento } from "@/lib/types";
import { requiereSesion } from "./utils";
import { texto, numero, type Resultado } from "./form";

interface LineaEntrada {
  atraccion_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

function parsearLineas(formData: FormData): LineaEntrada[] {
  const raw = formData.get("lineas");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const arr = JSON.parse(raw) as LineaEntrada[];
    return arr
      .filter((l) => l && typeof l.descripcion === "string" && l.descripcion.trim().length)
      .map((l) => ({
        atraccion_id: l.atraccion_id ?? null,
        descripcion: l.descripcion.trim(),
        cantidad: Number(l.cantidad) > 0 ? Math.floor(Number(l.cantidad)) : 1,
        precio_unitario: Number(l.precio_unitario) || 0,
      }));
  } catch {
    return [];
  }
}

export async function guardarEvento(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const titulo = texto(formData, "titulo");
  const fecha = texto(formData, "fecha");

  if (!titulo) return { ok: false, mensaje: "El título es obligatorio." };
  if (!fecha) return { ok: false, mensaje: "La fecha es obligatoria." };

  const fila = {
    id,
    cliente_id: texto(formData, "cliente_id"),
    titulo,
    tipo: texto(formData, "tipo") ?? "particular",
    estado: (texto(formData, "estado") ?? "borrador") as EstadoEvento,
    fecha,
    hora_salida: texto(formData, "hora_salida"),
    hora_montaje: texto(formData, "hora_montaje"),
    hora_inicio: texto(formData, "hora_inicio"),
    hora_fin: texto(formData, "hora_fin"),
    direccion: texto(formData, "direccion"),
    poblacion: texto(formData, "poblacion"),
    provincia: texto(formData, "provincia"),
    zona: texto(formData, "zona") ?? "almagro_30km",
    duracion_horas: texto(formData, "duracion_horas") ?? "3-4 h",
    notas: texto(formData, "notas"),
    importe_total: numero(formData, "importe_total"),
  };

  const lineas = parsearLineas(formData);

  // El redirect va FUERA del try/catch: redirect() lanza un error interno
  // (NEXT_REDIRECT) que el catch no debe capturar.
  let nuevoId: string;
  try {
    ({ id: nuevoId } = await guardarEventoDb(fila, lineas));
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar el evento.",
    };
  }

  revalidatePath("/calendario");
  revalidatePath("/eventos");
  revalidatePath("/panel");
  revalidatePath(`/eventos/${nuevoId}`);
  redirect(`/eventos/${nuevoId}`);
}

export async function cambiarEstadoEvento(
  id: string,
  estado: EstadoEvento
): Promise<Resultado> {
  await requiereSesion();

  try {
    await cambiarEstadoEventoDb(id, estado);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al actualizar el estado.",
    };
  }

  revalidatePath("/calendario");
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${id}`);
  revalidatePath("/panel");
  return { ok: true, mensaje: "Estado actualizado." };
}

export async function borrarEvento(id: string): Promise<Resultado> {
  await requiereSesion();

  try {
    await borrarEventoDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al eliminar el evento.",
    };
  }

  revalidatePath("/calendario");
  revalidatePath("/eventos");
  revalidatePath("/panel");
  return { ok: true, mensaje: "Evento eliminado." };
}
