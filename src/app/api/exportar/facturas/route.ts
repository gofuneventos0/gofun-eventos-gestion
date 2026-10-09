import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getFacturas } from "@/lib/data";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { labelEstadoFactura, labelTipoCliente } from "@/lib/constantes";
import type { FacturaCompleta } from "@/lib/types";

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

/**
 * Exporta el informe fiscal a CSV: solo facturas emitidas del período.
 * Parámetros opcionales, igual que la página: ?periodo=YYYY y ?trimestre=1..4.
 */
export async function GET(request: NextRequest) {
  const usuario = await getSessionUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const anioRaw = Number(request.nextUrl.searchParams.get("periodo"));
  const anio =
    Number.isInteger(anioRaw) && anioRaw >= 2000 && anioRaw <= 2100
      ? anioRaw
      : new Date().getFullYear();
  const trimestreRaw = Number(request.nextUrl.searchParams.get("trimestre"));
  const trimestre =
    Number.isInteger(trimestreRaw) && trimestreRaw >= 1 && trimestreRaw <= 4
      ? trimestreRaw
      : 0;

  const rango = rangoTrimestre(anio, trimestre);
  const facturasAnio = await getFacturas(`${anio}-01-01`, `${anio}-12-31`);

  const delPeriodo =
    trimestre === 0
      ? facturasAnio
      : facturasAnio.filter((f) => f.fecha >= rango.desde && f.fecha <= rango.hasta);
  const emitidas = delPeriodo.filter((f) => f.estado === "emitida");
  const t = totales(emitidas);

  const filas: (string | number | null | undefined)[][] = [
    [
      "Número",
      "Fecha",
      "Cliente",
      "Tipo de cliente",
      "CIF/NIF",
      "Evento",
      "Base imponible (€)",
      "IVA (%)",
      "Cuota IVA (€)",
      "IRPF (%)",
      "Retención IRPF (€)",
      "Total (€)",
      "Estado",
    ],
    ...emitidas.map((f) => [
      f.numero,
      f.fecha,
      f.cliente?.nombre ?? "",
      f.cliente ? labelTipoCliente(f.cliente.tipo) : "",
      f.cliente?.cif_nif ?? "",
      f.evento?.titulo ?? "",
      f.base_imponible,
      f.iva,
      f.iva_importe,
      f.irpf,
      f.irpf_importe,
      f.total,
      labelEstadoFactura(f.estado),
    ]),
    [],
    ["TOTALES", "", "", "", "", "", t.base, "", t.iva, "", t.irpf, t.total, `${t.n} facturas`],
  ];

  const sufijoTrimestre = trimestre === 0 ? "" : `-t${trimestre}`;
  return descargarCsv(`informe-fiscal-${anio}${sufijoTrimestre}`, construirCsv(filas));
}