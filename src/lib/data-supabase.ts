import { createClient } from "@/lib/supabase/server";
import type {
  Atraccion,
  Cliente,
  EmpresaConfig,
  EstadoEvento,
  EventoCompleto,
  Pack,
} from "@/lib/types";

const CAMPOS_EVENTO =
  "*, cliente:clientes(id,nombre,tipo,retiene_irpf,telefono), evento_lineas(*)";

// ------------------------------------------------------------
// Configuración de la empresa
// ------------------------------------------------------------
export async function getConfig(): Promise<EmpresaConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresa_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as EmpresaConfig) ?? null;
}

// ------------------------------------------------------------
// Catálogo
// ------------------------------------------------------------
export async function getAtracciones(soloActivas = true): Promise<Atraccion[]> {
  const supabase = await createClient();
  let q = supabase.from("atracciones").select("*").order("orden", { ascending: true });
  if (soloActivas) q = q.eq("activa", true);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as Atraccion[]) ?? [];
}

export async function getPacks(): Promise<Pack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packs")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Pack[]) ?? [];
}

// ------------------------------------------------------------
// Clientes
// ------------------------------------------------------------
export async function getClientes(busqueda?: string): Promise<Cliente[]> {
  const supabase = await createClient();
  let q = supabase
    .from("clientes")
    .select("*")
    .is("borrado_en", null)
    .order("nombre", { ascending: true });

  if (busqueda?.trim()) {
    const t = `%${busqueda.trim()}%`;
    q = q.or(`nombre.ilike.${t},telefono.ilike.${t},poblacion.ilike.${t},cif_nif.ilike.${t}`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as Cliente[]) ?? [];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Cliente) ?? null;
}

// ------------------------------------------------------------
// Eventos
// ------------------------------------------------------------
export async function getEventosRango(desde: string, hasta: string): Promise<EventoCompleto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select(CAMPOS_EVENTO)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);
  return (data as unknown as EventoCompleto[]) ?? [];
}

export async function getEvento(id: string): Promise<EventoCompleto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select(CAMPOS_EVENTO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as unknown as EventoCompleto) ?? null;
}

/** Eventos ordenados por fecha con filtros opcionales de estado y búsqueda. */
export async function getEventos(opciones?: {
  estados?: EstadoEvento[];
  desde?: string;
  hasta?: string;
  limite?: number;
}): Promise<EventoCompleto[]> {
  const supabase = await createClient();
  let q = supabase.from("eventos").select(CAMPOS_EVENTO).order("fecha", { ascending: false });

  if (opciones?.estados?.length) q = q.in("estado", opciones.estados);
  if (opciones?.desde) q = q.gte("fecha", opciones.desde);
  if (opciones?.hasta) q = q.lte("fecha", opciones.hasta);
  if (opciones?.limite) q = q.limit(opciones.limite);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as unknown as EventoCompleto[]) ?? [];
}

/** Próximos eventos a partir de hoy (para el panel). */
export async function getProximosEventos(limite = 6, desde: string): Promise<EventoCompleto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select(CAMPOS_EVENTO)
    .gte("fecha", desde)
    .neq("estado", "cancelado")
    .order("fecha", { ascending: true })
    .limit(limite);

  if (error) throw new Error(error.message);
  return (data as unknown as EventoCompleto[]) ?? [];
}

/** Recuento por estado dentro de un rango de fechas. */
export async function getConteoEstados(
  desde: string,
  hasta: string
): Promise<Record<EstadoEvento, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("estado, fecha")
    .gte("fecha", desde)
    .lte("fecha", hasta);

  if (error) throw new Error(error.message);

  const acc = {
    borrador: 0,
    confirmado: 0,
    realizado: 0,
    cobrado: 0,
    cancelado: 0,
  } as Record<EstadoEvento, number>;

  for (const fila of data ?? []) acc[fila.estado as EstadoEvento]++;
  return acc;
}