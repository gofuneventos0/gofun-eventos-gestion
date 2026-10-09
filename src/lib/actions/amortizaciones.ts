"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esModoLocal } from "@/lib/supabase/env";
import {
  crearBienInversion as crearBienInversionLocal,
  actualizarBienInversion as actualizarBienInversionLocal,
  borrarBienInversion as borrarBienInversionLocal,
} from "@/lib/local/repo";
import {
  crearBienInversion as crearBienInversionSupabase,
  actualizarBienInversion as actualizarBienInversionSupabase,
  borrarBienInversion as borrarBienInversionSupabase,
} from "@/lib/data-supabase";
import { porcentajeTipoBien, TIPOS_BIEN_INVERSION, TIPOS_IVA_BIEN } from "@/lib/constantes";
import { requiereSesion } from "./utils";
import { numero, texto, type Resultado } from "./form";
import type { TipoBienInversion } from "@/lib/types";

function redondear2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type DatosBien = {
  descripcion: string;
  numero_factura: string | null;
  fecha_adquisicion: string;
  valor_sin_iva: number;
  tipo_iva: number;
  iva_importe: number;
  tipo_bien: TipoBienInversion;
  porcentaje_max: number;
  observaciones: string | null;
};

function leerDatos(formData: FormData): { error: string } | { dato: DatosBien } {
  const descripcion = texto(formData, "descripcion");
  const fecha = texto(formData, "fecha_adquisicion");
  const tipoRaw = texto(formData, "tipo_bien");
  const tipoValido = TIPOS_BIEN_INVERSION .some((t) => t.valor === tipoRaw);
  const tipoBien: TipoBienInversion | null = tipoValido ? (tipoRaw as TipoBienInversion) : null;
  if (!descripcion) return { error: "La descripción del bien es obligatoria." };
  if (!fecha) return { error: "La fecha de adquisición es obligatoria." };
  if (!tipoBien) return { error: "Elige el tipo de bien de inversión." };

  const valor = Number(numero(formData, "valor_sin_iva"));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "El valor de adquisición (sin IVA) debe ser mayor que 0." };
  }

  const tipoIvaRaw = numero(formData, "tipo_iva", 21);
  const tipoIva = TIPOS_IVA_BIEN.includes(tipoIvaRaw) ? tipoIvaRaw : 21;
  const ivaImporte = redondear2((valor * tipoIva) / 100);

  return {
    dato: {
      descripcion,
      numero_factura: texto(formData, "numero_factura"),
      fecha_adquisicion: fecha,
      valor_sin_iva: redondear2(valor),
      tipo_iva: tipoIva,
      iva_importe: ivaImporte,
      tipo_bien: tipoBien,
      porcentaje_max: porcentajeTipoBien(tipoBien),
      observaciones: texto(formData, "observaciones"),
    },
  };
}

export async function crearBien(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();
  const resultado = leerDatos(formData);
  if ("error" in resultado) return { ok: false, mensaje: resultado.error };

  if (esModoLocal()) {
    let id: string;
    try {
      ({ id } = crearBienInversionLocal(resultado.dato));
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "Error al guardar el bien." };
    }
    revalidatePath("/amortizaciones");
    redirect(`/amortizaciones/${id}`);
  }

  try {
    const { id } = await crearBienInversionSupabase(resultado.dato);
    revalidatePath("/amortizaciones");
    redirect(`/amortizaciones/${id}`);
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error al guardar el bien." };
  }
}

export async function actualizarBien(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();
  const id = texto(formData, "id");
  if (!id) return { ok: false, mensaje: "Falta el identificador del bien." };
  const resultado = leerDatos(formData);
  if ("error" in resultado) return { ok: false, mensaje: resultado.error };

  if (esModoLocal()) {
    try {
      actualizarBienInversionLocal(id, resultado.dato);
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "Error al guardar el bien." };
    }
    revalidar(id);
    return { ok: true, mensaje: "Bien actualizado." };
  }

  try {
    await actualizarBienInversionSupabase(id, resultado.dato);
    revalidar(id);
    return { ok: true, mensaje: "Bien actualizado." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error al guardar el bien." };
  }
}

export async function borrarBien(id: string): Promise<Resultado> {
  await requiereSesion();

  if (esModoLocal()) {
    try {
      borrarBienInversionLocal(id);
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "No se pudo borrar el bien." };
    }
    revalidar();
    return { ok: true, mensaje: "Bien eliminado." };
  }

  try {
    await borrarBienInversionSupabase(id);
    revalidar();
    return { ok: true, mensaje: "Bien eliminado." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "No se pudo borrar el bien." };
  }
}

function revalidar(id?: string) {
  revalidatePath("/amortizaciones");
  if (id) revalidatePath(`/amortizaciones/${id}`);
}