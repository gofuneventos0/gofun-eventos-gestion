import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getEventos } from "@/lib/data";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { ESTADOS, labelZona } from "@/lib/constantes";
import type { EstadoEvento, TipoEvento } from "@/lib/types";

function capitalizada(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function estadoValido(v: string | null): EstadoEvento | undefined {
  return v && v in ESTADOS ? (v as EstadoEvento) : undefined;
}

/**
 * Exporta los eventos a CSV. Parámetros opcionales, igual que la página:
 * ?estado=… y ?q=… (filtra por título, pueblo o cliente).
 */
export async function GET(request: NextRequest) {
  const usuario = await getSessionUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const estado = estadoValido(request.nextUrl.searchParams.get("estado"));
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const eventos = await getEventos({ estados: estado ? [estado] : undefined, limite: 5000 });

  const filtrados = q
    ? eventos.filter((e) =>
        [e.titulo, e.poblacion, e.cliente?.nombre]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      )
    : eventos;

  const filas: (string | number | null | undefined)[][] = [
    [
      "Fecha",
      "Título",
      "Cliente",
      "Tipo de evento",
      "Estado",
      "Población / provincia",
      "Zona",
      "Duración",
      "Atracciones",
      "Importe (€)",
    ],
    ...filtrados.map((e) => [
      e.fecha,
      e.titulo,
      e.cliente?.nombre ?? "",
      capitalizada(e.tipo as TipoEvento),
      ESTADOS[e.estado].label,
      [e.poblacion, e.provincia].filter(Boolean).join(", "),
      labelZona(e.zona),
      e.duracion_horas,
      e.evento_lineas.length,
      e.importe_total,
    ]),
  ];

  return descargarCsv(`eventos`, construirCsv(filas));
}