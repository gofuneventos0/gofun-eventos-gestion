import Link from "next/link";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { Download, HandCoins, Landmark, PlusCircle, Wallet } from "lucide-react";
import {
  getCobro,
  getCuentas,
  getEventos,
  getGasto,
  getResumenTesoreria,
} from "@/lib/data";
import { labelTipoCuenta } from "@/lib/constantes";
import { euros } from "@/lib/format";
import {
  CLASE_BOTON_MARCA,
  CLASE_BOTON_SUAVE,
  CLASE_INPUT,
  EncabezadoPagina,
  Tarjeta,
  Vacio,
} from "@/components/ui";
import TesoreriaForm from "@/components/tesoreria-form";
import MovimientoFila from "@/components/movimiento-fila";

export const metadata = { title: "Tesorería" };

export default async function TesoreriaPage(props: PageProps<"/tesoreria">) {
  const sp = await props.searchParams;
  const accion = sp.accion === "cobro" || sp.accion === "gasto" ? sp.accion : null;
  const editar = typeof sp.editar === "string" ? sp.editar : null;
  const eventoDefecto = typeof sp.evento === "string" ? sp.evento : null;

  // Mes seleccionado para el libro, por defecto el actual.
  const mesRaw =
    typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes)
      ? sp.mes
      : format(new Date(), "yyyy-MM");
  const [anio, mes] = mesRaw.split("-").map(Number);
  const desde = `${mesRaw}-01`;
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const hasta = `${mesRaw}-${String(ultimoDia).padStart(2, "0")}`;
  const etiquetaMes = format(new Date(Date.UTC(anio, mes - 1, 1)), "LLLL yyyy", { locale: es });

  const [cuentas, resumen, eventos] = await Promise.all([
    getCuentas(),
    getResumenTesoreria(desde, hasta),
    getEventos({ limite: 300 }),
  ]);

  const opcionesEventos = eventos
    .map((e) => ({ id: e.id, titulo: e.titulo, fecha: e.fecha }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  if (editar) {
    const [cobro, gasto] = await Promise.all([getCobro(editar), getGasto(editar)]);
    const tipo = cobro ? "cobro" : gasto ? "gasto" : null;
    if (!tipo) {
      return (
        <Tarjeta className="p-5">
          <p className="text-sm text-tinta-600">No se encontró ese movimiento.</p>
        </Tarjeta>
      );
    }
    return (
      <TesoreriaForm
        tipo={tipo}
        fila={cobro ?? gasto}
        cuentas={cuentas}
        eventos={opcionesEventos}
      />
    );
  }

  if (accion) {
    return (
      <TesoreriaForm
        tipo={accion}
        fila={null}
        cuentas={cuentas}
        eventos={opcionesEventos}
        eventoDefecto={eventoDefecto}
      />
    );
  }

  const neto = resumen.totalIngresos - resumen.totalGastos;

  return (
    <>
      <EncabezadoPagina
        titulo="Tesorería"
        descripcion="Caja y banco, cobros y gastos"
        acciones={
          <>
            <Link href="/tesoreria?accion=gasto" className={CLASE_BOTON_SUAVE}>
              <PlusCircle className="h-4 w-4" /> Gasto
            </Link>
            <Link href="/tesoreria?accion=cobro" className={CLASE_BOTON_MARCA}>
              <PlusCircle className="h-4 w-4" /> Cobro
            </Link>
          </>
        }
      />

      {/* Selector de mes */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form action="/tesoreria" method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="mes"
            defaultValue={mesRaw}
            className={`${CLASE_INPUT} w-auto`}
          />
          <button type="submit" className={CLASE_BOTON_SUAVE}>
            Ver mes
          </button>
        </form>
        <div className="flex items-center gap-3">
          <Link
            href={`/api/exportar/tesoreria?mes=${mesRaw}`}
            className={CLASE_BOTON_SUAVE}
            title="Descargar este mes en CSV"
          >
            <Download className="h-4 w-4" /> CSV
          </Link>
          <p className="text-sm font-medium capitalize text-tinta-600">{etiquetaMes}</p>
        </div>
      </div>

      {/* Resumen de cuentas */}
      {resumen.cuentas.length === 0 ? (
        <Vacio titulo="Sin cuentas configuradas" descripcion="Crea cuentas de caja y banco en la configuración." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumen.cuentas.map(({ cuenta, ingresosPeriodo, gastosPeriodo, saldoTotal }) => (
            <Tarjeta key={cuenta.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-tinta-600">{cuenta.nombre}</p>
                {cuenta.tipo === "banco" ? (
                  <Landmark className="h-4 w-4 text-tinta-600" />
                ) : (
                  <Wallet className="h-4 w-4 text-tinta-600" />
                )}
              </div>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-tinta-950">
                {euros(saldoTotal)}
              </p>
              <p className="text-xs text-tinta-600">
                Saldo actual · {labelTipoCuenta(cuenta.tipo)}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <span className="font-semibold text-emerald-700">
                  +{euros(ingresosPeriodo)}
                </span>
                <span className="font-semibold text-rose-700">−{euros(gastosPeriodo)}</span>
              </div>
            </Tarjeta>
          ))}

          {/* Totales del período */}
          <Tarjeta className="p-5 sm:col-span-2">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                  Ingresos
                </p>
                <p className="mt-1 text-lg font-extrabold text-emerald-700">
                  {euros(resumen.totalIngresos)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                  Gastos
                </p>
                <p className="mt-1 text-lg font-extrabold text-rose-700">
                  {euros(resumen.totalGastos)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                  {neto >= 0 ? "Saldo del mes" : "Déficit del mes"}
                </p>
                <p className="mt-1 text-lg font-extrabold text-tinta-950">{euros(neto)}</p>
              </div>
            </div>
          </Tarjeta>
        </div>
      )}

      {/* Libro del mes */}
      <Tarjeta className="mt-6 overflow-hidden">
        <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Movimientos del mes
        </h2>
        {resumen.movimientos.length === 0 ? (
          <div className="px-5 py-10">
            <Vacio
              titulo="Sin movimientos este mes"
              descripcion="Registra el primer cobro o gasto para empezar a llevar la tesorería."
              accion={
                <Link href="/tesoreria?accion=cobro" className={CLASE_BOTON_MARCA}>
                  <HandCoins className="h-4 w-4" /> Registrar cobro
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {resumen.movimientos.map((m) => (
              <MovimientoFila key={m.id} movimiento={m} />
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}