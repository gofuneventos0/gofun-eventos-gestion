import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ESTADOS } from "@/lib/constantes";
import { hora as fmtHora } from "@/lib/format";
import type { EventoCompleto } from "@/lib/types";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Calendario({
  mes,
  diaSeleccionado,
  eventos,
}: {
  /** Primer día del mes visible, en ISO (yyyy-MM-dd) */
  mes: string;
  diaSeleccionado: string;
  eventos: EventoCompleto[];
}) {
  const fechaMes = new Date(mes + "T00:00:00");
  const inicio = startOfMonth(fechaMes);
  const fin = endOfMonth(fechaMes);
  const desde = startOfWeek(inicio, { weekStartsOn: 1 });
  const hasta = endOfWeek(fin, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: desde, end: hasta });

  const porDia = new Map<string, EventoCompleto[]>();
  for (const e of eventos) {
    const lista = porDia.get(e.fecha) ?? [];
    lista.push(e);
    porDia.set(e.fecha, lista);
  }

  const mesParam = format(inicio, "yyyy-MM");

  return (
    <div className="tarjeta overflow-hidden">
      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-tinta-600"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Rejilla del mes */}
      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const iso = format(dia, "yyyy-MM-dd");
          const delMes = isSameMonth(dia, fechaMes);
          const hoy = isToday(dia);
          const seleccionado = iso === diaSeleccionado;
          const lista = porDia.get(iso) ?? [];
          const visibles = lista.slice(0, 3);
          const resto = lista.length - visibles.length;

          return (
            <Link
              key={iso}
              href={`/calendario?mes=${mesParam}&dia=${iso}`}
              className={`min-h-[86px] border-b border-r border-gray-100 p-1.5 transition sm:min-h-[104px] ${
                delMes ? "bg-white hover:bg-lime-50/60" : "bg-gray-50/70"
              } ${seleccionado ? "ring-2 ring-inset ring-marca-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    hoy
                      ? "bg-tinta-950 text-white"
                      : delMes
                        ? "text-tinta-950"
                        : "text-gray-400"
                  }`}
                >
                  {format(dia, "d")}
                </span>
                {lista.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-tinta-600">
                    {lista.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                {visibles.map((e) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-1 truncate rounded px-1 py-[3px] text-[10.5px] font-medium leading-tight sm:text-[11px] ${
                      e.estado === "cancelado"
                        ? "text-gray-400 line-through"
                        : "text-tinta-950"
                    }`}
                    title={e.titulo}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${ESTADOS[e.estado].punto}`}
                    />
                    <span className="truncate">
                      {e.hora_inicio ? `${fmtHora(e.hora_inicio)} ` : ""}
                      {e.titulo}
                    </span>
                  </div>
                ))}
                {resto > 0 && (
                  <p className="pl-1 text-[10.5px] font-semibold text-marca-600">+{resto} más</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
        {Object.entries(ESTADOS).map(([clave, meta]) => (
          <span key={clave} className="flex items-center gap-1.5 text-[11px] text-tinta-600">
            <span className={`h-2 w-2 rounded-full ${meta.punto}`} />
            {meta.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Utilidad compartida: nombre del mes en español, capitalizado. */
export function tituloMes(fecha: Date): string {
  const s = format(fecha, "MMMM yyyy", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
