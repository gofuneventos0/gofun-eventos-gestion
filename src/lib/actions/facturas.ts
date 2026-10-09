"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esModoLocal } from "@/lib/supabase/env";
import {
  crearFacturaDesdeEvento as crearFacturaDesdeEventoLocal,
  cambiarEstadoFactura as cambiarEstadoFacturaLocal,
} from "@/lib/local/repo";
import { crearFacturaDesdeEvento as crearFacturaDesdeEventoSupabase } from "@/lib/data-supabase";
import { getConfig, getFactura, getFacturaEvento } from "@/lib/data";
import { requiereSesion } from "./utils";
import { texto, type Resultado } from "./form";
import type { EstadoFactura } from "@/lib/types";

const ESTADOS_VALIDOS: EstadoFactura[] = ["proforma", "emitida", "anulada"];

export async function crearFactura(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const evento_id = texto(formData, "evento_id");
  const fecha = texto(formData, "fecha");
  if (!evento_id) return { ok: false, mensaje: "Elige el evento que quieres facturar." };
  if (!fecha) return { ok: false, mensaje: "La fecha de la factura es obligatoria." };
  const estado: EstadoFactura = texto(formData, "estado") === "emitida" ? "emitida" : "proforma";

  const existente = await getFacturaEvento(evento_id);
  if (existente) {
    return {
      ok: false,
      mensaje: `El evento ya tiene la factura ${existente.numero}. Ánula la anterior para generar otra.`,
    };
  }

  const config = await getConfig();
  const serie = config?.serie_facturas?.trim() || "F";
  const iva = config?.iva_defecto || 21;
  const irpf = config?.irpf_defecto || 15;

  if (esModoLocal()) {
    // El redirect va FUERA del try/catch: redirect() lanza un error interno
    // (NEXT_REDIRECT) que el catch no debe capturar.
    let id: string;
    try {
      ({ id } = crearFacturaDesdeEventoLocal({ evento_id, fecha, estado, serie, iva, irpf }));
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : "Error al generar la factura.",
      };
    }
    revalidatePath("/facturacion");
    revalidatePath(`/eventos/${evento_id}`);
    redirect(`/facturacion/${id}`);
  }

  try {
    const { id } = await crearFacturaDesdeEventoSupabase({
      evento_id,
      fecha,
      estado,
      serie,
      iva,
      irpf,
    });
    revalidatePath("/facturacion");
    revalidatePath(`/eventos/${evento_id}`);
    redirect(`/facturacion/${id}`);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al generar la factura.",
    };
  }
}

/** Emitir (proforma → emitida) o anular una factura. */
export async function cambiarEstadoFactura(
  id: string,
  estado: EstadoFactura
): Promise<Resultado> {
  await requiereSesion();

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { ok: false, mensaje: "Estado de factura no válido." };
  }

  const eventoId = (await getFactura(id))?.evento_id ?? null;

  if (esModoLocal()) {
    try {
      cambiarEstadoFacturaLocal(id, estado);
    } catch (e) {
      return {
        ok: false,
        mensaje: e instanceof Error ? e.message : "Error al actualizar la factura.",
      };
    }
    revalidar(eventoId);
    revalidatePath(`/facturacion/${id}`);
    return { ok: true, mensaje: "Factura actualizada." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("facturas").update({ estado }).eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidar(eventoId);
  revalidatePath(`/facturacion/${id}`);
  return { ok: true, mensaje: "Factura actualizada." };
}

function revalidar(eventoId: string | null) {
  revalidatePath("/facturacion");
  revalidatePath("/panel");
  if (eventoId) revalidatePath(`/eventos/${eventoId}`);
}