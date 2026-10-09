import type {
  CategoriaAtraccion,
  CategoriaGasto,
  DuracionEvento,
  EstadoEvento,
  EstadoFactura,
  MetodoPago,
  TipoBienInversion,
  TipoCliente,
  TipoCuenta,
  TipoEvento,
  ZonaEvento,
} from "./types";

// ------------------------------------------------------------
// Estados del evento
// ------------------------------------------------------------
export const ESTADOS: Record<
  EstadoEvento,
  { label: string; chip: string; punto: string; texto: string }
> = {
  borrador: {
    label: "Borrador",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    punto: "bg-slate-400",
    texto: "text-slate-600",
  },
  confirmado: {
    label: "Confirmado",
    chip: "bg-lime-100 text-lime-800 ring-lime-200",
    punto: "bg-lime-500",
    texto: "text-lime-700",
  },
  realizado: {
    label: "Realizado",
    chip: "bg-sky-100 text-sky-800 ring-sky-200",
    punto: "bg-sky-500",
    texto: "text-sky-700",
  },
  cobrado: {
    label: "Cobrado",
    chip: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    punto: "bg-emerald-500",
    texto: "text-emerald-700",
  },
  cancelado: {
    label: "Cancelado",
    chip: "bg-rose-100 text-rose-800 ring-rose-200",
    punto: "bg-rose-500",
    texto: "text-rose-600",
  },
};

export const ORDEN_ESTADOS: EstadoEvento[] = [
  "borrador",
  "confirmado",
  "realizado",
  "cobrado",
  "cancelado",
];

// ------------------------------------------------------------
// Tipos de evento
// ------------------------------------------------------------
export const TIPOS_EVENTO: TipoEvento[] = [
  "particular",
  "cumpleaños",
  "comunión",
  "boda",
  "verbena",
  "ayuntamiento",
  "colegio",
  "empresa",
  "otro",
];

// ------------------------------------------------------------
// Categorías del catálogo (mismos filtros que la web pública)
// ------------------------------------------------------------
export const CATEGORIAS: { valor: CategoriaAtraccion; label: string }[] = [
  { valor: "infantil", label: "Infantil" },
  { valor: "verano", label: "Verano" },
  { valor: "deportes", label: "Deportes" },
  { valor: "adultos", label: "Adultos" },
  { valor: "servicios", label: "Servicios" },
];

export function labelCategoria(c: CategoriaAtraccion): string {
  return CATEGORIAS.find((x) => x.valor === c)?.label ?? c;
}

// ------------------------------------------------------------
// Zonas de cobertura (coinciden con la calculadora de la web)
// ------------------------------------------------------------
export const ZONAS: { valor: ZonaEvento; label: string; detalle: string }[] = [
  {
    valor: "almagro_30km",
    label: "Almagro y 30 km",
    detalle: "Transporte y montaje incluidos en el precio",
  },
  {
    valor: "provincia_cr",
    label: "Provincia de Ciudad Real",
    detalle: "Transporte y montaje incluidos",
  },
  {
    valor: "clm",
    label: "Resto de Castilla-La Mancha",
    detalle: "Puede aplicarse suplemento por distancia",
  },
];

export function labelZona(z: ZonaEvento): string {
  return ZONAS.find((x) => x.valor === z)?.label ?? z;
}

// ------------------------------------------------------------
// Duración y suplementos
// ------------------------------------------------------------
export const DURACIONES: DuracionEvento[] = ["3-4 h", "5 h", "8 h"];

// ------------------------------------------------------------
// Tipos de cliente (define si retiene IRPF)
// ------------------------------------------------------------
export const TIPOS_CLIENTE: {
  valor: TipoCliente;
  label: string;
  retiene: boolean;
  ayuda: string;
}[] = [
  {
    valor: "particular",
    label: "Particular",
    retiene: false,
    ayuda: "No retiene IRPF. Cobras el 100% de la factura.",
  },
  {
    valor: "empresa",
    label: "Empresa (S.L./S.A./Autónomo)",
    retiene: true,
    ayuda: "Retiene el 15% de IRPF. Cobras el 85%.",
  },
  {
    valor: "administracion",
    label: "Administración pública",
    retiene: true,
    ayuda: "Retiene IRPF. Factura con importe bruto.",
  },
];

export function labelTipoCliente(t: TipoCliente): string {
  return TIPOS_CLIENTE.find((x) => x.valor === t)?.label ?? t;
}

// ------------------------------------------------------------
// Provincias de Castilla-La Mancha
// ------------------------------------------------------------
export const PROVINCIAS_CLM = [
  "Ciudad Real",
  "Toledo",
  "Albacete",
  "Cuenca",
  "Guadalajara",
] as const;

// ------------------------------------------------------------
// Importes orientativos publicados en la web (combos de referencia)
// ------------------------------------------------------------
export const EJEMPLOS_COMBOS = [
  "Toro + Castillo = 450 €",
  "Castillo + Futbolín = 275 €",
];

// ------------------------------------------------------------
// Tesorería: métodos de pago y categorías de gasto
// ------------------------------------------------------------
export const METODOS_PAGO: { valor: MetodoPago; label: string }[] = [
  { valor: "efectivo", label: "Efectivo" },
  { valor: "transferencia", label: "Transferencia" },
  { valor: "tarjeta", label: "Tarjeta" },
  { valor: "bizum", label: "Bizum" },
];

export function labelMetodo(m: MetodoPago): string {
  return METODOS_PAGO.find((x) => x.valor === m)?.label ?? m;
}

export const CATEGORIAS_GASTO: { valor: CategoriaGasto; label: string }[] = [
  { valor: "combustible", label: "Combustible" },
  { valor: "reparaciones", label: "Reparaciones" },
  { valor: "material", label: "Material" },
  { valor: "publicidad", label: "Publicidad" },
  { valor: "impuestos", label: "Impuestos" },
  { valor: "personal", label: "Personal" },
  { valor: "otros", label: "Otros" },
];

export function labelCategoriaGasto(c: CategoriaGasto): string {
  return CATEGORIAS_GASTO.find((x) => x.valor === c)?.label ?? c;
}

export const TIPOS_CUENTA: { valor: TipoCuenta; label: string }[] = [
  { valor: "caja", label: "Caja" },
  { valor: "banco", label: "Banco" },
];

export function labelTipoCuenta(t: TipoCuenta): string {
  return TIPOS_CUENTA.find((x) => x.valor === t)?.label ?? t;
}

// ------------------------------------------------------------
// Facturación (Fase 3)
// ------------------------------------------------------------

/** Retención de IRPF estándar cuando el cliente es empresa/administración. */
export const IRPF_RETENCION_DEFECTO = 15;

export const ESTADOS_FACTURA: Record<
  EstadoFactura,
  { label: string; chip: string; punto: string; texto: string }
> = {
  proforma: {
    label: "Proforma",
    chip: "bg-sky-100 text-sky-800 ring-sky-200",
    punto: "bg-sky-500",
    texto: "text-sky-700",
  },
  emitida: {
    label: "Emitida",
    chip: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    punto: "bg-emerald-500",
    texto: "text-emerald-700",
  },
  anulada: {
    label: "Anulada",
    chip: "bg-rose-100 text-rose-800 ring-rose-200",
    punto: "bg-rose-500",
    texto: "text-rose-600",
  },
};

export function labelEstadoFactura(e: EstadoFactura): string {
  return ESTADOS_FACTURA[e]?.label ?? e;
}

/** Siguiente número correlativo para una serie y año: F2026-0001, F2026-0002… */
export function siguienteNumeroFactura(
  numeros: string[],
  serie: string,
  anio: number
): string {
  const base = `${serie}${anio}-`;
  const max = numeros.reduce((m, n) => {
    if (!String(n).startsWith(base)) return m;
    const suf = String(n).slice(base.length);
    const v = parseInt(suf, 10);
    return Number.isFinite(v) ? Math.max(m, v) : m;
  }, 0);
  return `${base}${String(max + 1).padStart(4, "0")}`;
}

// ------------------------------------------------------------
// Amortizaciones (Fase 4.2): tipos de bien de inversión y su
// porcentaje lineal máximo anual según las tablas oficiales.
// ------------------------------------------------------------
export const TIPOS_BIEN_INVERSION: {
  valor: TipoBienInversion;
  label: string;
  porcentaje: number;
}[] = [
  { valor: "instalaciones", label: "Instalaciones, mobiliario, enseres y resto de inmovilizado material", porcentaje: 10 },
  { valor: "maquinaria", label: "Maquinaria", porcentaje: 12 },
  { valor: "equipos_informaticos", label: "Equipos informáticos y programas informáticos", porcentaje: 26 },
  { valor: "utiles_herramientas", label: "Útiles y herramientas", porcentaje: 30 },
  { valor: "edificios", label: "Edificios y otras construcciones", porcentaje: 3 },
  { valor: "transporte", label: "Elementos de transporte", porcentaje: 16 },
  { valor: "ganado_vacuno", label: "Ganado vacuno, porcino, ovino y caprino", porcentaje: 16 },
  { valor: "frutales_citricos", label: "Frutales cítricos y viñedos", porcentaje: 4 },
  { valor: "ganado_equino", label: "Ganado equino y frutas no cítricos", porcentaje: 8 },
  { valor: "olivar", label: "Olivar", porcentaje: 2 },
];

/** Tipos de IVA aplicables a la adquisición de bienes de inversión. */
export const TIPOS_IVA_BIEN: number[] = [21, 10, 4];

export function labelTipoBien(t: TipoBienInversion): string {
  return TIPOS_BIEN_INVERSION.find((x) => x.valor === t)?.label ?? t;
}

export function porcentajeTipoBien(t: TipoBienInversion): number {
  return TIPOS_BIEN_INVERSION.find((x) => x.valor === t)?.porcentaje ?? 10;
}
