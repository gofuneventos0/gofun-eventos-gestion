"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  guardarCobro as guardarCobroDb,
  borrarCobro as borrarCobroDb,
  guardarGasto as guardarGastoDb,
  borrarGasto as borrarGastoDb,
} from "@/lib/local/repo";
import { requiereSesion } from "./utils";
import { texto, numero, type Resultado } from "./form";

/** Validación común a cobros y gastos. */
function validarMovimiento(formData: FormData) {
  const concepto = texto(formData, "concepto");
  const fecha = texto(formData, "fecha");
  const importe = numero(formData, "importe");
  const cuenta_id = texto(formData, "cuenta_id");

  if (!concepto) return { error: "El concepto es obligatorio." } as const;
  if (!fecha) return { error: "La fecha es obligatoria." } as const;
  if (!cuenta_id) return { error: "Elige una cuenta (caja o banco)." } as const;
  if (importe <= 0) return { error: "El importe debe ser mayor que 0." } as const;
  return { error: null, concepto, fecha, importe, cuenta_id };
}

function revalidarTesoreria(eventoId: string | null) {
  revalidatePath("/tesoreria");
  revalidatePath("/panel");
  if (eventoId) revalidatePath(`/eventos/${eventoId}`);
}

export async function guardarCobro(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const v = validarMovimiento(formData);
  if (v.error) return { ok: false, mensaje: v.error };

  const fila = {
    id,
    cuenta_id: v.cuenta_id,
    evento_id: texto(formData, "evento_id"),
    cliente_id: texto(formData, "cliente_id"),
    concepto: v.concepto,
    fecha: v.fecha,
    importe: v.importe,
    metodo: texto(formData, "metodo") ?? "efectivo",
    notas: texto(formData, "notas"),
  };

  try {
    await guardarCobroDb(fila, id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar el cobro.",
    };
  }

  revalidarTesoreria(fila.evento_id);
  redirect("/tesoreria");
}

export async function borrarCobro(id: string, eventoId?: string): Promise<Resultado> {
  await requiereSesion();

  try {
    await borrarCobroDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al eliminar el cobro.",
    };
  }

  revalidarTesoreria(eventoId ?? null);
  return { ok: true, mensaje: "Cobro eliminado." };
}

export async function guardarGasto(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const v = validarMovimiento(formData);
  if (v.error) return { ok: false, mensaje: v.error };

  const fila = {
    id,
    cuenta_id: v.cuenta_id,
    categoria: texto(formData, "categoria") ?? "otros",
    concepto: v.concepto,
    fecha: v.fecha,
    importe: v.importe,
    proveedor: texto(formData, "proveedor"),
    metodo: texto(formData, "metodo") ?? "efectivo",
    factura_ref: texto(formData, "factura_ref"),
    notas: texto(formData, "notas"),
  };

  try {
    await guardarGastoDb(fila, id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar el gasto.",
    };
  }

  revalidarTesoreria(null);
  redirect("/tesoreria");
}

export async function borrarGasto(id: string): Promise<Resultado> {
  await requiereSesion();

  try {
    await borrarGastoDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al eliminar el gasto.",
    };
  }

  revalidarTesoreria(null);
  return { ok: true, mensaje: "Gasto eliminado." };
}
