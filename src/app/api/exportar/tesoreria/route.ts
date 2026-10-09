import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getResumenTesoreria } from "@/lib/data";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { labelCategoriaGasto, labelMetodo } from "@/lib/constantes";

/**
 * Exporta los movimientos del mes a CSV (libro de tesorería).
 * Parámetro opcional: ?mes=YYYY-MM (por defecto el mes actual).
 */
export async function GET(request: NextRequest) {
  const usuario = await getSessionUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mesParam = request.nextUrl.searchParams.get("mes");
  const mes =
    mesParam && /^\d{4}-\d{2}$/.test(mesParam)
      ? mesParam
      : new Date().toISOString().slice(0, 7);

  const [anio, mesNum] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const ultimoDia = new Date(Date.UTC(anio, mesNum, 0)).getUTCDate();
  const hasta = `${mes}-${String(ultimoDia).padStart(2, "0")}`;

  const resumen = await getResumenTesoreria(desde, hasta);

  const filas: (string | number | null | undefined)[][] = [
    [
      "Fecha",
      "Tipo",
      "Concepto",
      "Categoría",
      "Cuenta",
      "Método de pago",
      "Evento",
      "Cliente",
      "Referencia",
      "Importe (€)",
    ],
    ...resumen.movimientos.map((m) => [
      m.fecha,
      m.tipo === "cobro" ? "Cobro" : "Gasto",
      m.concepto,
      m.categoria ? labelCategoriaGasto(m.categoria) : "",
      m.cuenta_nombre,
      labelMetodo(m.metodo),
      m.evento_titulo ?? "",
      m.cliente_nombre ?? "",
      m.referencia ?? "",
      m.tipo === "cobro" ? m.importe : -m.importe,
    ]),
    [],
    ["Totales del período"],
    ["Ingresos", "", "", "", "", "", "", "", "", resumen.totalIngresos],
    ["Gastos", "", "", "", "", "", "", "", "", -resumen.totalGastos],
    ["Neto", "", "", "", "", "", "", "", "", resumen.totalIngresos - resumen.totalGastos],
  ];

  return descargarCsv(`tesoreria-${mes}`, construirCsv(filas));
}