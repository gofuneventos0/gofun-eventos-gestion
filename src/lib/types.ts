// ------------------------------------------------------------
// Tipos del esquema de Supabase (Fase 0 + 1)
// Mantener en sincronía con supabase/migrations/*.sql
// ------------------------------------------------------------

export type EstadoEvento =
  | "borrador"
  | "confirmado"
  | "realizado"
  | "cobrado"
  | "cancelado";

export type TipoEvento =
  | "particular"
  | "cumpleaños"
  | "comunión"
  | "boda"
  | "verbena"
  | "ayuntamiento"
  | "colegio"
  | "empresa"
  | "otro";

export type CategoriaAtraccion =
  | "infantil"
  | "verano"
  | "deportes"
  | "adultos"
  | "servicios";

export type ZonaEvento = "almagro_30km" | "provincia_cr" | "clm";

export type DuracionEvento = "3-4 h" | "5 h" | "8 h";

export type TipoCliente = "particular" | "empresa" | "administracion";

export interface Atraccion {
  id: string;
  nombre: string;
  slug: string;
  categoria: CategoriaAtraccion;
  descripcion: string | null;
  precio_base: number | null;
  duracion_base: string;
  incluida_en_packs: boolean;
  orden: number;
  activa: boolean;
  creado_en: string;
}

export interface Pack {
  id: string;
  nombre: string;
  descripcion: string | null;
  incluye: string[];
  precio_base: number | null;
  orden: number;
  activo: boolean;
  creado_en: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: TipoCliente;
  cif_nif: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  cp: string | null;
  retiene_irpf: boolean;
  notas: string | null;
  borrado_en: string | null;
  creado_en: string;
}

export interface Evento {
  id: string;
  cliente_id: string | null;
  titulo: string;
  tipo: TipoEvento;
  estado: EstadoEvento;
  fecha: string; // 'YYYY-MM-DD'
  hora_salida: string | null; // 'HH:MM:SS'
  hora_montaje: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  zona: ZonaEvento;
  duracion_horas: DuracionEvento;
  importe_total: number;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface EventoLinea {
  id: string;
  evento_id: string;
  atraccion_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

// ------------------------------------------------------------
// Tesorería (Fase 2): cuentas, cobros y gastos
// ------------------------------------------------------------
export type TipoCuenta = "caja" | "banco";

export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "bizum";

export type CategoriaGasto =
  | "combustible"
  | "reparaciones"
  | "material"
  | "publicidad"
  | "impuestos"
  | "personal"
  | "otros";

export interface Cuenta {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  saldo_inicial: number;
  activa: boolean;
  creado_en: string;
}

export interface Cobro {
  id: string;
  cuenta_id: string;
  evento_id: string | null;
  cliente_id: string | null;
  concepto: string;
  fecha: string; // 'YYYY-MM-DD'
  importe: number;
  metodo: MetodoPago;
  notas: string | null;
  creado_en: string;
}

export interface Gasto {
  id: string;
  cuenta_id: string;
  categoria: CategoriaGasto;
  concepto: string;
  fecha: string;
  importe: number;
  proveedor: string | null;
  metodo: MetodoPago;
  factura_ref: string | null;
  notas: string | null;
  creado_en: string;
}

/** Fila unificada del libro de tesorería (cobro o gasto). */
export interface Movimiento {
  id: string;
  tipo: "cobro" | "gasto";
  fecha: string;
  concepto: string;
  cuenta_nombre: string;
  importe: number; // siempre positivo
  evento_id: string | null;
  evento_titulo: string | null;
  cliente_nombre: string | null;
  categoria: CategoriaGasto | null;
  metodo: MetodoPago;
  referencia: string | null; // factura del gasto
}

/** Saldo de una cuenta: histórico completo + entradas/salidas del período. */
export interface SaldoCuenta {
  cuenta: Cuenta;
  ingresosPeriodo: number;
  gastosPeriodo: number;
  saldoTotal: number; // saldo_inicial + todos los cobros − todos los gastos
}

export interface ResumenTesoreria {
  cuentas: SaldoCuenta[];
  movimientos: Movimiento[];
  totalIngresos: number;
  totalGastos: number;
}

export interface EmpresaConfig {
  id: number;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  iban: string | null;
  iva_defecto: number;
  irpf_defecto: number;
  serie_facturas: string;
  ultimo_numero: number;
  moneda: string;
  suplemento_5h: number;
  suplemento_8h: number;
  actualizado_en: string;
}

/** Evento con sus líneas y cliente ya resueltos (join de Supabase). */
export interface EventoCompleto extends Evento {
  cliente: Pick<Cliente, "id" | "nombre" | "tipo" | "retiene_irpf" | "telefono"> | null;
  evento_lineas: EventoLinea[];
}

// ------------------------------------------------------------
// Facturación (Fase 3): facturas e informes fiscales
// ------------------------------------------------------------
export type EstadoFactura = "proforma" | "emitida" | "anulada";

export interface Factura {
  id: string;
  numero: string;
  serie: string;
  fecha: string; // 'YYYY-MM-DD'
  cliente_id: string | null;
  evento_id: string | null;
  estado: EstadoFactura;
  base_imponible: number;
  iva: number; // tipo o porcentaje aplicado
  iva_importe: number;
  irpf: number; // porcentaje de retención aplicado (0 si el cliente no retiene)
  irpf_importe: number;
  total: number; // base + iva − irpf
  notas: string | null;
  creado_en: string;
}

export interface FacturaLinea {
  id: string;
  factura_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

/** Factura con cliente y evento resueltos (incluye datos fiscales del cliente). */
export interface FacturaCompleta extends Factura {
  cliente: Pick<
    Cliente,
    | "id"
    | "nombre"
    | "tipo"
    | "cif_nif"
    | "direccion"
    | "poblacion"
    | "provincia"
    | "cp"
    | "retiene_irpf"
  > | null;
  evento: Pick<Evento, "id" | "titulo" | "fecha"> | null;
  factura_lineas: FacturaLinea[];
}
