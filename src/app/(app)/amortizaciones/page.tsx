import Link from "next/link";
import { Calculator, PlusCircle } from "lucide-react";
import { getBienesInversion } from "@/lib/data";
import { calcularTablaAmortizacion, pendienteEnAnio, resumenAnual } from "@/lib/amortizacion";
import { labelTipoBien } from "@/lib/constantes";
import { euros, fechaNumerica } from "@/lib/format";
import { CLASE_BOTON_MARCA, EncabezadoPagina, Tarjeta, Vacio } from "@/components/ui";
import type { BienInversion } from "@/lib/types";

export const metadata = { title: "Amortizaciones" };

function amortizadoHasta(b: BienInversion, anio: number): number {
  return calcularTablaAmortizacion(b)
    .filas.filter((f) => f.anio <= anio)
    .reduce((s, f) => s + f.amortiza, 0);
}

export default async function AmortizacionesPage() {
  const bienes = await getBienesInversion();
  const anioActual = new Date().getFullYear();

  const totalValor = bienes.reduce((s, b) => s + b.valor_sin_iva, 0);
  const amortizado = bienes.reduce((s, b) => s + amortizadoHasta(b, anioActual), 0);
  const porcentaje = totalValor > 0 ? Math.round((amortizado / totalValor) * 100) : 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Amortizaciones"
        descripcion="Bienes de inversión y sus tablas de amortización (según tablas oficiales)."
        acciones={
          <Link href="/amortizaciones/nuevo" className={CLASE_BOTON_MARCA}>
            <PlusCircle className="h-4 w-4" /> Nuevo bien
          </Link>
        }
      />

      {bienes.length === 0 ? (
        <Vacio
          titulo="Todavía no hay bienes de inversión"
          descripcion="Da de alta el primer bien con su factura y la app calculará su tabla de amortización automáticamente."
          accion={
            <Link href="/amortizaciones/nuevo" className={CLASE_BOTON_MARCA}>
              <PlusCircle className="h-4 w-4" /> Nuevo bien
            </Link>
          }
        />
      ) : (
        <>
          {/* Resumen global */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Tarjeta className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                Bienes de inversión
              </p>
              <p className="mt-1 text-lg font-extrabold text-tinta-950">
                {bienes.length} bien{bienes.length === 1 ? "" : "es"}
              </p>
              <p className="text-xs text-tinta-600">Valor total sin IVA {euros(totalValor)}</p>
            </Tarjeta>
            <Tarjeta className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                Amortizado hasta {anioActual}
              </p>
              <p className="mt-1 text-lg font-extrabold text-emerald-700">{euros(amortizado)}</p>
              <p className="text-xs text-tinta-600">{porcentaje} % del valor total</p>
            </Tarjeta>
            <Tarjeta className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">
                Pendiente a {anioActual}
              </p>
              <p className="mt-1 text-lg font-extrabold text-tinta-950">
                {euros(totalValor - amortizado)}
              </p>
              <p className="text-xs text-tinta-600">Por amortizar en ejercicios futuros</p>
            </Tarjeta>
          </div>

          {/* Resumen anual */}
          <Tarjeta className="mt-6 overflow-hidden">
            <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Amortización anual de todos los bienes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-tinta-600">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Año</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Amortización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumenAnual(bienes).map((r) => (
                    <tr key={r.anio}>
                      <td className="px-5 py-2.5 font-medium text-tinta-950">{r.anio}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-tinta-950">
                        {euros(r.amortiza)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          {/* Lista de bienes */}
          <Tarjeta className="mt-6 overflow-hidden">
            <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Bienes de inversión
            </h2>
            <ul className="divide-y divide-gray-100">
              {bienes.map((b) => {
                const pendiente = pendienteEnAnio(b, anioActual) > 0.005;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/amortizaciones/${b.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Calculator className="h-4 w-4 shrink-0 text-tinta-600" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-tinta-950">{b.descripcion}</p>
                          <p className="truncate text-xs text-tinta-600">
                            {fechaNumerica(b.fecha_adquisicion)} · {labelTipoBien(b.tipo_bien)} (
                            {b.porcentaje_max} %)
                            {b.numero_factura ? ` · Factura ${b.numero_factura}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            pendiente
                              ? "bg-sky-100 text-sky-800 ring-sky-200"
                              : "bg-emerald-100 text-emerald-800 ring-emerald-200"
                          }`}
                        >
                          {pendiente ? "Amortizando" : "Amortizado"}
                        </span>
                        <span className="font-bold text-tinta-950">{euros(b.valor_sin_iva)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        </>
      )}
    </>
  );
}