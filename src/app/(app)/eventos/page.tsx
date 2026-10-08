import Link from "next/link";
import { CalendarPlus, Search } from "lucide-react";
import { getEventos } from "@/lib/data";
import { euros, fechaCorta, hora } from "@/lib/format";
import { ESTADOS, ORDEN_ESTADOS, labelZona } from "@/lib/constantes";
import type { EstadoEvento } from "@/lib/types";
import {
  CLASE_BOTON_MARCA,
  CLASE_INPUT,
  EncabezadoPagina,
  EtiquetaEstado,
  Vacio,
} from "@/components/ui";

export const metadata = { title: "Eventos" };

function estadoValido(v: unknown): EstadoEvento | null {
  return typeof v === "string" && v in ESTADOS ? (v as EstadoEvento) : null;
}

export default async function EventosPage(props: PageProps<"/eventos">) {
  const sp = await props.searchParams;
  const estado = estadoValido(sp.estado);
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const eventos = await getEventos({
    estados: estado ? [estado] : undefined,
    limite: 300,
  });

  const filtrados = q
    ? eventos.filter((e) =>
        [e.titulo, e.poblacion, e.cliente?.nombre]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      )
    : eventos;

  const totalFiltrado = filtrados
    .filter((e) => e.estado !== "cancelado")
    .reduce((s, e) => s + Number(e.importe_total), 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Eventos"
        descripcion={`${filtrados.length} evento(s) · ${euros(totalFiltrado)} contratados`}
        acciones={
          <Link href="/eventos/nuevo" className={CLASE_BOTON_MARCA}>
            <CalendarPlus className="h-4 w-4" /> Nuevo evento
          </Link>
        }
      />

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/eventos"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !estado
                ? "bg-tinta-950 text-white"
                : "bg-white text-tinta-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Todos
          </Link>
          {ORDEN_ESTADOS.map((e) => (
            <Link
              key={e}
              href={`/eventos?estado=${e}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                estado === e
                  ? `${ESTADOS[e].chip} ring-1 ring-inset`
                  : "bg-white text-tinta-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {ESTADOS[e].label}
            </Link>
          ))}
        </div>

        <form className="relative sm:w-72" action="/eventos" method="get">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título, cliente o pueblo…"
            className={`${CLASE_INPUT} pl-9`}
          />
        </form>
      </div>

      {filtrados.length === 0 ? (
        <Vacio
          titulo="No hay eventos que coincidan"
          descripcion="Prueba a quitar filtros o crea un evento nuevo."
          accion={
            <Link href="/eventos/nuevo" className={CLASE_BOTON_MARCA}>
              <CalendarPlus className="h-4 w-4" /> Nuevo evento
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtrados.map((e) => (
            <li key={e.id}>
              <Link
                href={`/eventos/${e.id}`}
                className="tarjeta flex flex-col gap-3 p-4 transition hover:border-marca-500/50 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-gray-50 py-2">
                  <span className="text-[11px] font-semibold uppercase text-tinta-600">
                    {fechaCorta(e.fecha).split(" ")[2]}
                  </span>
                  <span className="text-xl font-extrabold leading-none text-tinta-950">
                    {fechaCorta(e.fecha).split(" ")[1]}
                  </span>
                  <span className="mt-0.5 text-[10px] text-tinta-600">
                    {new Date(e.fecha + "T00:00:00").getFullYear()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-tinta-950">{e.titulo}</p>
                    <EtiquetaEstado estado={e.estado} />
                  </div>
                  <p className="mt-0.5 text-sm text-tinta-600">
                    {e.cliente?.nombre ?? "Sin cliente"} ·{" "}
                    {[e.poblacion, e.provincia].filter(Boolean).join(", ") || labelZona(e.zona)}
                  </p>
                  <p className="mt-1 text-xs text-tinta-600">
                    {e.evento_lineas.length} atracción(es) · {e.duracion_horas}
                    {hora(e.hora_inicio) !== "—" && ` · inicio ${hora(e.hora_inicio)}`}
                  </p>
                </div>

                <p className="shrink-0 text-lg font-bold text-tinta-950 sm:text-right">
                  {euros(e.importe_total)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
