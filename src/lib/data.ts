import { esModoLocal } from "./supabase/env";
import * as supabase from "./data-supabase";
import * as local from "./local/repo";

/**
 * Fachada de datos: elige la implementación según el modo de ejecución.
 * - Modo local (sin credenciales de Supabase): SQLite (./local/repo).
 * - Con Supabase configurado: consultas REST (./data-supabase).
 */
const impl = esModoLocal() ? local : supabase;

export const getConfig = impl.getConfig;
export const getAtracciones = impl.getAtracciones;
export const getPacks = impl.getPacks;
export const getClientes = impl.getClientes;
export const getCliente = impl.getCliente;
export const getEventosRango = impl.getEventosRango;
export const getEvento = impl.getEvento;
export const getEventos = impl.getEventos;
export const getProximosEventos = impl.getProximosEventos;
export const getConteoEstados = impl.getConteoEstados;

// Tesorería (Fase 2)
export const getCuentas = impl.getCuentas;
export const getResumenTesoreria = impl.getResumenTesoreria;
export const getCobrosEvento = impl.getCobrosEvento;
export const getCobro = impl.getCobro;
export const getGasto = impl.getGasto;

// Facturación (Fase 3) — solo lecturas; las mutaciones van por Server Actions
export const getFacturas = impl.getFacturas;
export const getFactura = impl.getFactura;
export const getFacturaEvento = impl.getFacturaEvento;