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
