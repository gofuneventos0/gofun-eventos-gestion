import Link from "next/link";
import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { getEventosRango } from "@/lib/data";
import { euros, fechaLarga, hoyISO, hora } from "@/lib/format";
import { labelZona } from "@/lib/constantes";
import Calendario, { tituloMes } from "@/components/calendario";
import { CLASE_BOTON_MARCA, CLASE_BOTON_SUAVE, EncabezadoPagina, EtiquetaEstado, Tarjeta } from "@/components/ui";

export const metadata = { title: "Calendario" };

function mesValido(valor: unknown): string | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}$/.test(valor)) return null;
  return valor;
}

function diaValido(valor: unknown): string | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  return valor;
}

export default async function CalendarioPage(props: PageProps<"/calendario">) {
  const sp = await props.searchParams;
  const hoy = hoyISO();

  const mesParam = mesValido(sp.mes) ?? hoy.slice(0, 7);
  const mesISO = `${mesParam}-01`;
  const dia = diaValido(sp.dia) ?? (mesParam === hoy.slice(0, 7) ? hoy : mesISO);

  const inicioMes = startOfMonth(new Date(mesISO + "T00:00:00"));
  const finMes = endOfMonth(inicioMes);
  // Ampliamos a la rejilla completa para ver los eventos de días vecinos.
  const desde = format(startOfWeek(inicioMes, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const hasta = format(endOfWeek(finMes, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const eventos = await getEventosRango(desde, hasta);
  const delDia = eventos.filter((e) => e.fecha === dia);

  const mesAnterior = format(addMonths(inicioMes, -1), "yyyy-MM");
  const mesSiguiente = format(addMonths(inicioMes, 1), "yyyy-MM");

  return (
    <>
      <EncabezadoPagina
        titulo="Calendario"
        descripcion="Vista mensual de montajes y eventos"
        acciones={
          <Link href={`/eventos/nuevo?fecha=${dia}`} className={CLASE_BOTON_MARCA}>
            <CalendarPlus className="h-4 w-4" /> Nuevo evento
          </Link>
        }
      />

      {/* Navegación de mes */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendario?mes=${mesAnterior}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-tinta-950 transition hover:bg-gray-50"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/calendario?mes=${mesSiguiente}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-tinta-950 transition hover:bg-gray-50"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href={`/calendario?dia=${hoy}`} className={CLASE_BOTON_SUAVE}>
            Hoy
          </Link>
        </div>
        <h2 className="text-lg font-bold text-tinta-950">{tituloMes(inicioMes)}</h2>
      </div>

      <Calendario mes={mesISO} diaSeleccionado={dia} eventos={eventos} />

      {/* Detalle del día seleccionado */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-tinta-950">{fechaLarga(dia)}</h2>
          <span className="text-sm text-tinta-600">
            {delDia.length} {delDia.length === 1 ? "evento" : "eventos"}
          </span>
        </div>

        {delDia.length === 0 ? (
          <Tarjeta className="flex flex-col items-center px-6 py-10 text-center">
            <p className="text-sm text-tinta-600">No hay eventos este día.</p>
            <Link
              href={`/eventos/nuevo?fecha=${dia}`}
              className="mt-3 text-sm font-semibold text-marca-600 hover:text-marca-500"
            >
              + Crear un evento este día
            </Link>
          </Tarjeta>
        ) : (
          <ul className="space-y-3">
            {delDia.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.id}`}
                  className="tarjeta block p-4 transition hover:border-marca-500/50 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-tinta-950">{e.titulo}</p>
                        <EtiquetaEstado estado={e.estado} />
                      </div>
                      <p className="mt-1 text-sm text-tinta-600">
                        {e.cliente?.nombre ?? "Sin cliente"} ·{" "}
                        {[e.poblacion, e.provincia].filter(Boolean).join(", ") || labelZona(e.zona)}
                      </p>
                      {e.direccion && (
                        <p className="mt-0.5 text-xs text-tinta-600">{e.direccion}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-tinta-950">{euros(e.importe_total)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-gray-100 pt-3 text-xs text-tinta-600">
                    <span>Salida: <strong className="text-tinta-950">{hora(e.hora_salida)}</strong></span>
                    <span>Montaje: <strong className="text-tinta-950">{hora(e.hora_montaje)}</strong></span>
                    <span>Inicio: <strong className="text-tinta-950">{hora(e.hora_inicio)}</strong></span>
                    <span>Fin: <strong className="text-tinta-950">{hora(e.hora_fin)}</strong></span>
                    <span>Duración: <strong className="text-tinta-950">{e.duracion_horas}</strong></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
