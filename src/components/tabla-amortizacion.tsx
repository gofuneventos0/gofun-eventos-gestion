import { labelTipoBien } from "@/lib/constantes";
import { euros, fechaNumerica } from "@/lib/format";
import type { BienInversion, TablaAmortizacion } from "@/lib/types";

/**
 * Tabla de amortización de un bien, con la distribución anual
 * AÑO | % | AMORTIZA | ACUMULADO | PENDIENTE y fila de totales.
 */
export default function TablaAmortizacion({
  bien,
  tabla,
}: {
  bien: BienInversion;
  tabla: TablaAmortizacion;
}) {
  const totalAmortiza = tabla.filas.reduce((s, f) => s + f.amortiza, 0);
  const totalPct = tabla.filas.reduce((s, f) => s + f.porcentaje, 0);
  const amortizada = totalAmortiza >= bien.valor_sin_iva - 0.005;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Datos del bien */}
      <div className="grid gap-x-6 gap-y-2 border-b border-gray-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tinta-600">Adquisición</p>
          <p className="text-sm font-semibold text-tinta-950">{fechaNumerica(bien.fecha_adquisicion)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tinta-600">Valor sin IVA</p>
          <p className="text-sm font-semibold text-tinta-950">{euros(bien.valor_sin_iva)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tinta-600">Tipo de bien</p>
          <p className="text-sm font-semibold text-tinta-950">{labelTipoBien(bien.tipo_bien)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tinta-600">
            % máx. anual · días 1er año
          </p>
          <p className="text-sm font-semibold text-tinta-950">
            {bien.porcentaje_max} % · {tabla.dias_restantes} días
          </p>
        </div>
      </div>

      {/* Tabla */}
      {tabla.filas.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-tinta-600">
          No hay tabla de amortización (revisa el valor de adquisición del bien).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-tinta-600">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Año</th>
                <th className="px-3 py-2.5 text-right font-semibold">%</th>
                <th className="px-3 py-2.5 text-right font-semibold">Amortiza</th>
                <th className="px-3 py-2.5 text-right font-semibold">Acumulado</th>
                <th className="px-5 py-2.5 text-right font-semibold">Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tabla.filas.map((f) => (
                <tr key={f.anio}>
                  <td className="px-5 py-2 font-medium text-tinta-950">{f.anio}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-tinta-600">
                    {f.porcentaje.toLocaleString("es-ES", { maximumFractionDigits: 2 })} %
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-tinta-950">
                    {euros(f.amortiza)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-tinta-950">
                    {euros(f.acumulado)}
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums text-tinta-950">
                    {euros(f.pendiente)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold text-tinta-950">
                <td className="px-5 py-2.5">TOTAL</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {totalPct.toLocaleString("es-ES", { maximumFractionDigits: 2 })} %
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{euros(totalAmortiza)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{euros(totalAmortiza)}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{euros(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {amortizada && (
        <p className="border-t border-gray-100 px-5 py-3 text-xs font-medium text-emerald-700">
          ✓ Bien totalmente amortizado.
        </p>
      )}
    </div>
  );
}