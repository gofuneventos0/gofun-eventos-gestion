import { esModoLocal } from "./supabase/env";
import * as supabase from "./data-supabase";
import * as local from "./local/repo";
import { inicializarDb } from "./local/db";

/**
 * Fachada de datos: elige la implementación según el modo de ejecución.
 * - Modo local (sin credenciales de Supabase): SQLite (./local/repo).
 *   En Netlify esa SQLite se hidrata desde Netlify Blobs antes de cada lectura.
 * - Con Supabase configurado: consultas REST (./data-supabase).
 */
const impl = esModoLocal() ? local : supabase;

type Fn = (...args: never[]) => unknown;

/** Asegura que la BD local esté lista antes de consultarla. */
function conDb<F extends Fn>(
  fn: F
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
  return (async (...args: Parameters<F>) => {
    await inicializarDb();
    return (fn as (...args: Parameters<F>) => ReturnType<F>)(...args);
  }) as (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
}

export const getConfig = conDb(impl.getConfig);
export const getAtracciones = conDb(impl.getAtracciones);
export const getPacks = conDb(impl.getPacks);
export const getClientes = conDb(impl.getClientes);
export const getCliente = conDb(impl.getCliente);
export const getEventosRango = conDb(impl.getEventosRango);
export const getEvento = conDb(impl.getEvento);
export const getEventos = conDb(impl.getEventos);
export const getProximosEventos = conDb(impl.getProximosEventos);
export const getConteoEstados = conDb(impl.getConteoEstados);

// Tesorería (Fase 2)
export const getCuentas = conDb(impl.getCuentas);
export const getResumenTesoreria = conDb(impl.getResumenTesoreria);
export const getCobrosEvento = conDb(impl.getCobrosEvento);
export const getCobro = conDb(impl.getCobro);
export const getGasto = conDb(impl.getGasto);

// Facturación (Fase 3) — solo lecturas; las mutaciones van por Server Actions
export const getFacturas = conDb(impl.getFacturas);
export const getFactura = conDb(impl.getFactura);
export const getFacturaEvento = conDb(impl.getFacturaEvento);
