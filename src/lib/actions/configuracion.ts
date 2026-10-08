"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requiereSesion } from "./utils";
import { texto, numero, type Resultado } from "./form";

export async function guardarConfiguracion(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const fila = {
    nombre: texto(formData, "nombre") ?? "Go Fun Eventos",
    cif: texto(formData, "cif"),
    direccion: texto(formData, "direccion"),
    poblacion: texto(formData, "poblacion"),
    provincia: texto(formData, "provincia"),
    telefono: texto(formData, "telefono"),
    email: texto(formData, "email"),
    iban: texto(formData, "iban"),
    iva_defecto: numero(formData, "iva_defecto", 21),
    irpf_defecto: numero(formData, "irpf_defecto", 0),
    serie_facturas: texto(formData, "serie_facturas") ?? "F",
    suplemento_5h: numero(formData, "suplemento_5h", 25),
    suplemento_8h: numero(formData, "suplemento_8h", 55),
    actualizado_en: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("empresa_config").update(fila).eq("id", 1);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/configuracion");
  return { ok: true, mensaje: "Configuración guardada." };
}
