import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getClientes } from "@/lib/data";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { labelTipoCliente } from "@/lib/constantes";

/**
 * Exporta los clientes a CSV. Parámetro opcional: ?q=… (búsqueda por nombre).
 */
export async function GET(request: NextRequest) {
  const usuario = await getSessionUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || undefined;
  const clientes = await getClientes(q);

  const filas: (string | number | null | undefined)[][] = [
    [
      "Nombre",
      "Tipo",
      "CIF/NIF",
      "Teléfono",
      "Email",
      "Dirección",
      "Población",
      "Provincia",
      "CP",
      "Retiene IRPF",
      "Notas",
    ],
    ...clientes.map((c) => [
      c.nombre,
      labelTipoCliente(c.tipo),
      c.cif_nif ?? "",
      c.telefono ?? "",
      c.email ?? "",
      c.direccion ?? "",
      c.poblacion ?? "",
      c.provincia ?? "",
      c.cp ?? "",
      c.retiene_irpf ? "Sí" : "No",
      c.notas ?? "",
    ]),
  ];

  return descargarCsv("clientes", construirCsv(filas));
}