import Link from "next/link";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarPlus, Coins, PartyPopper, TrendingUp, Wallet } from "lucide-react";
import { getConteoEstados, getEventosRango, getProximosEventos } from "@/lib/data";
import { euros, eurosCorto, fechaCorta, hora, hoyISO, relativo } from "@/lib/format";
import { ESTADOS, ORDEN_ESTADOS, labelZona } from "@/lib/constantes";
import {
  CLASE_BOTON,
  CLASE_BOTON_MARCA,
  CLASE_BOTON_SUAVE,
  EncabezadoPagina,
  EtiquetaEstado,
  Tarjeta,
  Vacio,
} from "@/components/ui";

export const metadata = { title: "Panel" };

function KPI({
  titulo,
  valor,
  detalle,
  icono: Icono,
  tono,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: React.ComponentType<{ className?: string }>;
  tono: string;
}) {
  return (
    <Tarjeta className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-tinta-600">{titulo}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tono}`}>
          <Icono className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-tinta-950">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-tinta-600">{detalle}</p>}
    </Tarjeta>
  );
}

export default async function PanelPage() {
  const hoy = hoyISO();
  const inicio = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const fin = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const mes = format(new Date(), "MMMM yyyy", { locale: es });

  const [eventosMes, proximos, conteo] = await Promise.all([
    getEventosRango(inicio, fin),
    getProximosEventos(6, hoy),
    getConteoEstados(inicio, fin),
  ]);

  const activos = eventosMes.filter((e) => e.estado !== "cancelado");
  const contratado = activos.reduce((s, e) => s + Number(e.importe_total), 0);
  const cobrado = activos
    .filter((e) => e.estado === "cobrado")
    .reduce((s, e) => s + Number(e.importe_total), 0);
  const pendiente = activos
    .filter((e) => e.estado === "realizado")
    .reduce((s, e) => s + Number(e.importe_total), 0);
  const previsto = activos
    .filter((e) => e.estado === "confirmado")
    .reduce((s, e) => s + Number(e.importe_total), 0);

  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <>
      <EncabezadoPagina
        titulo="Panel"
        descripcion={`Resumen de ${mesCapitalizado}`}
        acciones={
          <>
            <Link href="/eventos/nuevo" className={CLASE_BOTON_MARCA}>
              <CalendarPlus className="h-4 w-4" /> Nuevo evento
            </Link>
            <Link href="/calendario" className={CLASE_BOTON_SUAVE}>
              Ver calendario
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          titulo="Eventos del mes"
          valor={String(activos.length)}
          detalle={`${conteo.cancelado} cancelado(s)`}
          icono={PartyPopper}
          tono="bg-lime-100 text-lime-700"
        />
        <KPI
          titulo="Importe contratado"
          valor={eurosCorto(contratado)}
          detalle="Eventos no cancelados del mes"
          icono={TrendingUp}
          tono="bg-sky-100 text-sky-700"
        />
        <KPI
          titulo="Cobrado"
          valor={eurosCorto(cobrado)}
          detalle="Eventos marcados como cobrados"
          icono={Coins}
          tono="bg-emerald-100 text-emerald-700"
        />
        <KPI
          titulo="Pendiente de cobro"
          valor={eurosCorto(pendiente)}
          detalle={`Previsto sin ejecutar: ${eurosCorto(previsto)}`}
          icono={Wallet}
          tono="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Próximos eventos */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-tinta-950">Próximos eventos</h2>
            <Link
              href="/eventos"
              className="inline-flex items-center gap-1 text-sm font-medium text-marca-600 hover:text-marca-500"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {proximos.length === 0 ? (
            <Vacio
              titulo="No hay eventos próximos"
              descripcion="Cuando registres una reserva aparecerá aquí y en el calendario."
              accion={
                <Link href="/eventos/nuevo" className={CLASE_BOTON}>
                  Crear el primer evento
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {proximos.map((e) => {
                const rel = relativo(e.fecha);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/eventos/${e.id}`}
                      className="tarjeta flex items-center gap-4 p-4 transition hover:border-marca-500/50 hover:shadow-md"
                    >
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-gray-50 py-2">
                        <span className="text-[11px] font-semibold uppercase text-tinta-600">
                          {fechaCorta(e.fecha).split(" ")[2]}
                        </span>
                        <span className="text-xl font-extrabold leading-none text-tinta-950">
                          {fechaCorta(e.fecha).split(" ")[1]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-tinta-950">{e.titulo}</p>
                          {rel && (
                            <span className="rounded-full bg-marca-500/15 px-2 py-0.5 text-[11px] font-semibold text-marca-600">
                              {rel}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-tinta-600">
                          {e.cliente?.nombre ?? "Sin cliente"} · {e.poblacion ?? labelZona(e.zona)}
                        </p>
                        <p className="mt-1 text-xs text-tinta-600">
                          {hora(e.hora_montaje) !== "—"
                            ? `Montaje ${hora(e.hora_montaje)} · `
                            : ""}
                          {hora(e.hora_inicio) !== "—" ? `Inicio ${hora(e.hora_inicio)}` : "Sin horario"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-tinta-950">{euros(e.importe_total)}</p>
                        <div className="mt-1">
                          <EtiquetaEstado estado={e.estado} />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Estado del mes */}
        <section>
          <h2 className="mb-3 text-base font-bold text-tinta-950">Estado de los eventos del mes</h2>
          <Tarjeta className="divide-y divide-gray-100">
            {ORDEN_ESTADOS.map((estado) => (
              <div key={estado} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ESTADOS[estado].punto}`} />
                  <span className="text-sm text-tinta-950">{ESTADOS[estado].label}</span>
                </div>
                <span className="text-sm font-bold text-tinta-950">{conteo[estado]}</span>
              </div>
            ))}
          </Tarjeta>

          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4">
            <p className="text-sm font-semibold text-tinta-950">Siguientes fases</p>
            <p className="mt-1 text-xs leading-relaxed text-tinta-600">
              Tesorería (caja y banco), facturación con IVA/IRPF y gastos llegarán en las fases 2 y 3.
              Aquí verás el beneficio real del trimestre.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
