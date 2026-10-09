import Link from "next/link";
import { Download, FileText, PlusCircle } from "lucide-react";
import { getFacturas } from "@/lib/data";
import { ESTADOS_FACTURA } from "@/lib/constantes";
import { euros, fechaCorta } from "@/lib/format";
import {
  CLASE_BOTON_MARCA,
  CLASE_BOTON_SUAVE,
  CLASE_INPUT,
  EncabezadoPagina,
  Tarjeta,
  Vacio,
} from "@/components/ui";
import type { EstadoFactura, FacturaCompleta } from "@/lib/types";

export const metadata = { title: "Facturación" };

function EtiquetaFactura({ estado }: { estado: EstadoFactura }) {
  const meta = ESTADOS_FACTURA[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.punto}`} />
      {meta.label}
    </span>
  );
}

function rangoTrimestre(anio: number, t: number): { desde: string; hasta: string } {
  if (t === 0) return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
  const mIni = (t - 1) * 3 + 1;
  const mFin = mIni + 2;
  const ultimo = new Date(Date.UTC(anio, mFin, 0)).getUTCDate();
  return {
    desde: `${anio}-${String(mIni).padStart(2, "0")}-01`,
    hasta: `${anio}-${String(mFin).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`,
  };
}

function totales(lista: FacturaCompleta[]) {
  return lista.reduce(
    (acc, f) => ({
      base: acc.base + f.base_imponible,
      iva: acc.iva + f.iva_importe,
      irpf: acc.irpf + f.irpf_importe,
      total: acc.total + f.total,
      n: acc.n + 1,
    }),
    { base: 0, iva: 0, irpf: 0, total: 0, n: 0 }
  );
}

const TRIMESTRES = [
  { valor: "0", label: "Todo el año" },
  { valor: "1", label: "1er trimestre" },
  { valor: "2", label: "2º trimestre" },
  { valor: "3", label: "3er trimestre" },
  { valor: "4", label: "4º trimestre" },
];

export default async function FacturacionPage(props: PageProps<"/facturacion">) {
  const sp = await props.searchParams;

  const anioRaw = Number(sp.periodo);
  const anio =
    Number.isInteger(anioRaw) && anioRaw >= 2000 && anioRaw <= 2100
      ? anioRaw
      : new Date().getFullYear();
  const trimestreRaw = Number(sp.trimestre);
  const trimestre = Number.isInteger(trimestreRaw) && trimestreRaw >= 1 && trimestreRaw <= 4 ? trimestreRaw : 0;

  const rango = rangoTrimestre(anio, trimestre);
  const facturasAnio = await getFacturas(`${anio}-01-01`, `${anio}-12-31`);

  const delPeriodo =
    trimestre === 0
      ? facturasAnio
      : facturasAnio.filter((f) => f.fecha >= rango.desde && f.fecha <= rango.hasta);
  const emitidasPeriodo = delPeriodo.filter((f) => f.estado === "emitida");
  const t = totales(emitidasPeriodo);

  const etiquetaPeriodo =
    trimestre === 0
      ? `Año ${anio}`
      : `${["1er", "2º", "3er", "4º"][trimestre - 1]} trimestre de ${anio}`;

  return (
    <>
      <EncabezadoPagina
        titulo="Facturación"
        descripcion="Facturas con IVA y retención de IRPF, e informes fiscales"
        acciones={
          <Link href="/facturacion/nueva" className={CLASE_BOTON_MARCA}>
            <PlusCircle className="h-4 w-4" /> Nueva factura
          </Link>
        }
      />

      {/* Selector de período */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form action="/facturacion" method="get" className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            name="periodo"
            min={2000}
            max={2100}
            defaultValue={anio}
            className={`${CLASE_INPUT} w-28`}
          />
          <select name="trimestre" defaultValue={String(trimestre)} className={`${CLASE_INPUT} w-auto`}>
            {TRIMESTRES.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
          <button type="submit" className={CLASE_BOTON_SUAVE}>
            Ver período
          </button>
        </form>
        <div className="flex items-center gap-3">
          <Link
            href={`/api/exportar/facturas?periodo=${anio}&trimestre=${trimestre}`}
            className={CLASE_BOTON_SUAVE}
            title="Descargar informe fiscal en CSV"
          >
            <Download className="h-4 w-4" /> Exportar informe
          </Link>
          <p className="text-sm font-medium capitalize text-tinta-600">{etiquetaPeriodo}</p>
        </div>
      </div>

      {/* Informe del período */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">Base imponible</p>
          <p className="mt-1 text-lg font-extrabold text-tinta-950">{euros(t.base)}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">Cuota IVA</p>
          <p className="mt-1 text-lg font-extrabold text-tinta-950">{euros(t.iva)}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">Retención IRPF</p>
          <p className="mt-1 text-lg font-extrabold text-rose-700">{euros(t.irpf)}</p>
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-600">Total facturado</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-700">{euros(t.total)}</p>
          <p className="text-xs text-tinta-600">{t.n} factura{t.n === 1 ? "" : "s"} emitida{t.n === 1 ? "" : "s"}</p>
        </Tarjeta>
      </div>
      <p className="mt-2 text-xs text-tinta-600">
        Informe fiscal de facturas <strong>emitidas</strong>: las proforma no computan y las anuladas se
        excluyen.
      </p>

      {/* Desglose trimestral del año */}
      <Tarjeta className="mt-6 overflow-hidden">
        <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Desglose trimestral {anio}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-tinta-600">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Período</th>
                <th className="px-3 py-2.5 text-right font-semibold">Facturas</th>
                <th className="px-3 py-2.5 text-right font-semibold">Base</th>
                <th className="px-3 py-2.5 text-right font-semibold">IVA</th>
                <th className="px-3 py-2.5 text-right font-semibold">IRPF</th>
                <th className="px-5 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((tNum) => {
                const rango = rangoTrimestre(anio, tNum);
                const delT = facturasAnio.filter(
                  (f) => f.estado === "emitida" && f.fecha >= rango.desde && f.fecha <= rango.hasta
                );
                const tt = totales(delT);
                return (
                  <tr key={tNum}>
                    <td className="px-5 py-3 font-medium text-tinta-950">
                      {["1er", "2º", "3er", "4º"][tNum - 1]} trimestre
                    </td>
                    <td className="px-3 py-3 text-right text-tinta-600">{tt.n}</td>
                    <td className="px-3 py-3 text-right text-tinta-950">{euros(tt.base)}</td>
                    <td className="px-3 py-3 text-right text-tinta-950">{euros(tt.iva)}</td>
                    <td className="px-3 py-3 text-right text-rose-700">{euros(tt.irpf)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-tinta-950">{euros(tt.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      {/* Listado */}
      <Tarjeta className="mt-6 overflow-hidden">
        <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Facturas {trimestre === 0 ? `de ${anio}` : etiquetaPeriodo.toLowerCase()}
        </h2>
        {delPeriodo.length === 0 ? (
          <div className="px-5 py-10">
            <Vacio
              titulo="Sin facturas en este período"
              descripcion="Genera una factura desde cualquier evento con cliente y atracciones."
              accion={
                <Link href="/facturacion/nueva" className={CLASE_BOTON_MARCA}>
                  <FileText className="h-4 w-4" /> Nueva factura
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {delPeriodo.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/facturacion/${f.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-tinta-600" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-tinta-950">{f.numero}</p>
                      <p className="truncate text-xs text-tinta-600">
                        {fechaCorta(f.fecha)} · {f.cliente?.nombre ?? "sin cliente"}
                        {f.evento ? ` · ${f.evento.titulo}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <EtiquetaFactura estado={f.estado} />
                    <span className="font-bold text-tinta-950">{euros(f.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}