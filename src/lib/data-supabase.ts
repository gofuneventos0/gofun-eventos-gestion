import { createClient } from "@/lib/supabase/server";
import { IRPF_RETENCION_DEFECTO, siguienteNumeroFactura } from "@/lib/constantes";
import type {
  Atraccion,
  Cliente,
  Cobro,
  Cuenta,
  EmpresaConfig,
  EstadoEvento,
  EventoCompleto,
  FacturaCompleta,
  Gasto,
  Movimiento,
  Pack,
  ResumenTesoreria,
  SaldoCuenta,
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

// ------------------------------------------------------------
// Tesorería
// ------------------------------------------------------------
export async function getCuentas(): Promise<Cuenta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cuentas")
    .select("*")
    .eq("activa", true)
    .order("tipo", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Cuenta[]) ?? [];
}

/** Relación embebida de supabase: puede llegar como objeto o como array de 1. */
type RelRow = Record<string, unknown>;

function nombreRelacion(v: unknown): string | null {
  if (Array.isArray(v)) {
    const n = (v[0] as { nombre?: unknown } | undefined)?.nombre;
    return typeof n === "string" ? n : null;
  }
  if (v && typeof v === "object") {
    const n = (v as { nombre?: unknown }).nombre;
    return typeof n === "string" ? n : null;
  }
  return null;
}

function sumarPorCuenta(arr: unknown): Record<string, number> {
  const totales: Record<string, number> = {};
  const filas = (arr as RelRow[] | null) ?? [];
  for (const r of filas) {
    const key = String(r.cuenta_id ?? "");
    if (!key) continue;
    totales[key] = (totales[key] ?? 0) + Number(r.importe ?? 0);
  }
  return totales;
}

function mapearCobro(c: RelRow): Movimiento {
  return {
    id: String(c.id),
    tipo: "cobro",
    fecha: String(c.fecha),
    concepto: String(c.concepto),
    cuenta_nombre: nombreRelacion(c.cuenta) ?? "—",
    importe: Number(c.importe),
    evento_id: c.evento_id ? String(c.evento_id) : null,
    evento_titulo: nombreRelacion(c.evento),
    cliente_nombre: nombreRelacion(c.cliente),
    categoria: null,
    metodo: c.metodo as Movimiento["metodo"],
    referencia: null,
  };
}

export async function getResumenTesoreria(
  desde: string,
  hasta: string
): Promise<ResumenTesoreria> {
  const supabase = await createClient();

  const [cuentasR, cobrosR, gastosR, cobrosTotR, gastosTotR] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("tipo", { ascending: true }),
    supabase
      .from("cobros")
      .select("id, fecha, concepto, importe, metodo, cuenta_id, cuenta:cuentas(nombre), evento:eventos(titulo), cliente:clientes(nombre)")
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("gastos")
      .select("id, fecha, concepto, importe, metodo, cuenta_id, categoria, factura_ref, cuenta:cuentas(nombre)")
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase.from("cobros").select("cuenta_id, importe"),
    supabase.from("gastos").select("cuenta_id, importe"),
  ]);

  for (const r of [cuentasR, cobrosR, gastosR, cobrosTotR, gastosTotR])
    if (r.error) throw new Error(r.error.message);

  const cuentas = (cuentasR.data as unknown as Cuenta[]) ?? [];
  const cobros = (cobrosR.data as unknown as RelRow[]) ?? [];
  const gastos = (gastosR.data as unknown as RelRow[]) ?? [];

  const cp = sumarPorCuenta(cobrosR.data);
  const gp = sumarPorCuenta(gastosR.data);
  const ct = sumarPorCuenta(cobrosTotR.data);
  const gt = sumarPorCuenta(gastosTotR.data);

  const resumen: SaldoCuenta[] = cuentas.map((cuenta) => ({
    cuenta,
    ingresosPeriodo: cp[cuenta.id] ?? 0,
    gastosPeriodo: gp[cuenta.id] ?? 0,
    saldoTotal: cuenta.saldo_inicial + (ct[cuenta.id] ?? 0) - (gt[cuenta.id] ?? 0),
  }));

  const movimientos: Movimiento[] = [
    ...cobros.map(mapearCobro),
    ...gastos.map((g) => ({
      id: String(g.id),
      tipo: "gasto" as const,
      fecha: String(g.fecha),
      concepto: String(g.concepto),
      cuenta_nombre: nombreRelacion(g.cuenta) ?? "—",
      importe: Number(g.importe),
      evento_id: null,
      evento_titulo: null,
      cliente_nombre: null,
      categoria: (g.categoria as Movimiento["categoria"]) ?? "otros",
      metodo: g.metodo as Movimiento["metodo"],
      referencia: g.factura_ref ? String(g.factura_ref) : null,
    })),
  ].sort((a, b) => (a.fecha === b.fecha ? 0 : a.fecha < b.fecha ? 1 : -1));

  return {
    cuentas: resumen,
    movimientos,
    totalIngresos: movimientos.filter((m) => m.tipo === "cobro").reduce((s, m) => s + m.importe, 0),
    totalGastos: movimientos.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.importe, 0),
  };
}

/** Cobros registrados contra un evento (para calcular cobrado/pendiente). */
export async function getCobrosEvento(eventoId: string): Promise<Movimiento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cobros")
    .select("id, fecha, concepto, importe, metodo, evento_id, cuenta:cuentas(nombre), evento:eventos(titulo), cliente:clientes(nombre)")
    .eq("evento_id", eventoId)
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as unknown as RelRow[]) ?? []).map(mapearCobro);
}

export async function getCobro(id: string): Promise<Cobro | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cobros").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Cobro) ?? null;
}

export async function getGasto(id: string): Promise<Gasto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gastos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Gasto) ?? null;
}

// ------------------------------------------------------------
// Facturación (Fase 3)
// ------------------------------------------------------------
const CAMPOS_FACTURA =
  "*, cliente:clientes(id,nombre,tipo,cif_nif,direccion,poblacion,provincia,cp,retiene_irpf), evento:eventos(id,titulo,fecha), factura_lineas(*)";

function aFacturaCompleta(f: Record<string, unknown>): FacturaCompleta {
  return {
    id: String(f.id),
    numero: String(f.numero),
    serie: String(f.serie),
    fecha: String(f.fecha),
    cliente_id: f.cliente_id ? String(f.cliente_id) : null,
    evento_id: f.evento_id ? String(f.evento_id) : null,
    estado: f.estado as FacturaCompleta["estado"],
    base_imponible: Number(f.base_imponible),
    iva: Number(f.iva),
    iva_importe: Number(f.iva_importe),
    irpf: Number(f.irpf),
    irpf_importe: Number(f.irpf_importe),
    total: Number(f.total),
    notas: (f.notas as string) ?? null,
    creado_en: String(f.creado_en),
    cliente: (f.cliente as FacturaCompleta["cliente"]) ?? null,
    evento: (f.evento as FacturaCompleta["evento"]) ?? null,
    factura_lineas: ((f.factura_lineas as unknown[]) ?? []).map((l) => ({
      id: String((l as Record<string, unknown>).id),
      factura_id: String((l as Record<string, unknown>).factura_id),
      descripcion: String((l as Record<string, unknown>).descripcion),
      cantidad: Number((l as Record<string, unknown>).cantidad),
      precio_unitario: Number((l as Record<string, unknown>).precio_unitario),
      orden: Number((l as Record<string, unknown>).orden),
    })),
  };
}

export async function getFacturas(desde: string, hasta: string): Promise<FacturaCompleta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select(CAMPOS_FACTURA)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as unknown as Record<string, unknown>[]) ?? []).map(aFacturaCompleta);
}

export async function getFactura(id: string): Promise<FacturaCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select(CAMPOS_FACTURA)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? aFacturaCompleta(data as Record<string, unknown>) : null;
}

/** Factura activa (no anulada) vinculada a un evento, si existe. */
export async function getFacturaEvento(eventoId: string): Promise<FacturaCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select(CAMPOS_FACTURA)
    .eq("evento_id", eventoId)
    .neq("estado", "anulada")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? aFacturaCompleta(data as Record<string, unknown>) : null;
}

export async function crearFacturaDesdeEvento(nueva: {
  evento_id: string;
  fecha: string;
  estado: string;
  serie: string;
  iva: number;
  irpf: number;
}): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data: evento, error: errE } = await supabase
    .from("eventos")
    .select("cliente_id")
    .eq("id", nueva.evento_id)
    .maybeSingle();
  if (errE) throw new Error(errE.message);
  if (!evento) throw new Error("No se encontró el evento.");
  const clienteId = evento.cliente_id as string | null;
  if (!clienteId) throw new Error("El evento no tiene cliente asignado.");

  const [clienteR, lineasR, numerosR] = await Promise.all([
    supabase.from("clientes").select("id, retiene_irpf").eq("id", clienteId).maybeSingle(),
    supabase
      .from("evento_lineas")
      .select("descripcion, cantidad, precio_unitario")
      .eq("evento_id", nueva.evento_id)
      .order("orden", { ascending: true }),
    supabase.from("facturas").select("numero").eq("serie", nueva.serie),
  ]);
  for (const r of [clienteR, lineasR, numerosR]) if (r.error) throw new Error(r.error.message);

  const cliente = clienteR.data as { id: string; retiene_irpf: boolean } | null;
  if (!cliente) throw new Error("El evento no tiene cliente asignado.");

  const lineas = (lineasR.data as Array<{ descripcion: string; cantidad: number; precio_unitario: number }>) ?? [];
  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario), 0);
  if (base <= 0) throw new Error("El evento no tiene importes para facturar.");

  const numeros = ((numerosR.data as Array<{ numero: string }>) ?? []).map((r) => r.numero);
  const anio = Number(String(nueva.fecha).slice(0, 4)) || new Date().getFullYear();
  const numero = siguienteNumeroFactura(numeros, nueva.serie, anio);

  const retiene = Boolean(cliente.retiene_irpf);
  const irpfTasa = retiene ? (nueva.irpf > 0 ? nueva.irpf : IRPF_RETENCION_DEFECTO) : 0;
  const ivaImporte = Number(((base * nueva.iva) / 100).toFixed(2));
  const irpfImporte = Number(((base * irpfTasa) / 100).toFixed(2));
  const total = Number((base + ivaImporte - irpfImporte).toFixed(2));

  const { data: factura, error } = await supabase
    .from("facturas")
    .insert({
      numero,
      serie: nueva.serie,
      fecha: nueva.fecha,
      cliente_id: clienteId,
      evento_id: nueva.evento_id,
      estado: nueva.estado,
      base_imponible: base,
      iva: nueva.iva,
      iva_importe: ivaImporte,
      irpf: irpfTasa,
      irpf_importe: irpfImporte,
      total,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (lineas.length) {
    const { error: errL } = await supabase.from("factura_lineas").insert(
      lineas.map((l, i) => ({
        factura_id: factura.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        orden: i,
      }))
    );
    if (errL) throw new Error(errL.message);
  }

  return { id: factura.id as string };
}

export async function cambiarEstadoFactura(id: string, estado: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("facturas").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
}