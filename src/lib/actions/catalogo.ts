"use server";

import { revalidatePath } from "next/cache";
import {
  guardarAtraccion as guardarAtraccionDb,
  archivarAtraccion as archivarAtraccionDb,
  guardarPack as guardarPackDb,
  archivarPack as archivarPackDb,
} from "@/lib/local/repo";
import { requiereSesion } from "./utils";
import { texto, numero, booleano, type Resultado } from "./form";

export async function guardarAtraccion(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const nombre = texto(formData, "nombre");
  if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };

  const slug =
    texto(formData, "slug") ??
    nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const precio = formData.get("precio_base");
  const fila = {
    id,
    nombre,
    slug,
    categoria: texto(formData, "categoria") ?? "infantil",
    descripcion: texto(formData, "descripcion"),
    precio_base:
      typeof precio === "string" && precio.trim() !== "" ? numero(formData, "precio_base") : null,
    duracion_base: texto(formData, "duracion_base") ?? "3-4 h",
    incluida_en_packs: booleano(formData, "incluida_en_packs"),
    orden: numero(formData, "orden", 99),
    activa: true,
  };

  try {
    await guardarAtraccionDb(fila);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar la atracción.",
    };
  }

  revalidatePath("/catalogo");
  return { ok: true, mensaje: id ? "Atracción actualizada." : "Atracción creada." };
}

export async function archivarAtraccion(id: string): Promise<Resultado> {
  await requiereSesion();
  try {
    await archivarAtraccionDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al archivar la atracción.",
    };
  }
  revalidatePath("/catalogo");
  return { ok: true, mensaje: "Atracción archivada." };
}

export async function guardarPack(
  _prev: Resultado | null,
  formData: FormData
): Promise<Resultado> {
  await requiereSesion();

  const id = texto(formData, "id");
  const nombre = texto(formData, "nombre");
  if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };

  const incluyeRaw = texto(formData, "incluye") ?? "";
  const incluye = incluyeRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const precio = formData.get("precio_base");
  const fila = {
    id,
    nombre,
    descripcion: texto(formData, "descripcion"),
    incluye,
    precio_base:
      typeof precio === "string" && precio.trim() !== "" ? numero(formData, "precio_base") : null,
    orden: numero(formData, "orden", 99),
    activo: true,
  };

  try {
    await guardarPackDb(fila);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al guardar el pack.",
    };
  }

  revalidatePath("/catalogo");
  return { ok: true, mensaje: id ? "Pack actualizado." : "Pack creado." };
}

export async function archivarPack(id: string): Promise<Resultado> {
  await requiereSesion();
  try {
    await archivarPackDb(id);
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : "Error al archivar el pack.",
    };
  }
  revalidatePath("/catalogo");
  return { ok: true, mensaje: "Pack archivado." };
}
