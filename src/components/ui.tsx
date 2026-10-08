import type { EstadoEvento } from "@/lib/types";
import { ESTADOS } from "@/lib/constantes";

export const CLASE_INPUT =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-tinta-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/25";

export const CLASE_BOTON =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-tinta-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-tinta-800 disabled:opacity-60";

export const CLASE_BOTON_MARCA =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-marca-500 px-4 py-2 text-sm font-semibold text-tinta-950 transition hover:bg-marca-400 disabled:opacity-60";

export const CLASE_BOTON_SUAVE =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-tinta-950 transition hover:bg-gray-50 disabled:opacity-60";

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-tinta-950">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-tinta-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function Campo({
  label,
  children,
  ayuda,
  className,
}: {
  label: string;
  children: React.ReactNode;
  ayuda?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-tinta-950">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tinta-600">{ayuda}</span>}
    </label>
  );
}

export function EtiquetaEstado({ estado }: { estado: EstadoEvento }) {
  const meta = ESTADOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.punto}`} />
      {meta.label}
    </span>
  );
}

export function Tarjeta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`tarjeta ${className ?? ""}`}>{children}</div>;
}

export function Vacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-base font-semibold text-tinta-950">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-md text-sm text-tinta-600">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Aviso({
  tono = "info",
  children,
}: {
  tono?: "info" | "error" | "ok";
  children: React.ReactNode;
}) {
  const estilos = {
    info: "bg-sky-50 text-sky-900 ring-sky-200",
    error: "bg-rose-50 text-rose-900 ring-rose-200",
    ok: "bg-lime-50 text-lime-900 ring-lime-200",
  }[tono];

  return (
    <p className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${estilos}`}>{children}</p>
  );
}
