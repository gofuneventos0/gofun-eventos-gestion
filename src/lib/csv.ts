/**
 * Utilidades para exportar tablas a CSV compatible con Excel y LibreOffice:
 * separador «;», decimales con coma y BOM UTF-8 para que los acentos se vean bien.
 */

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  let s: string;
  if (typeof valor === "number") {
    s =
      Number.isInteger(valor)
        ? String(valor)
        : String(valor).replace(".", ",");
  } else {
    s = String(valor);
  }
  if (/[";\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Convierte las filas a un texto CSV (con BOM UTF-8 y fin de línea CRLF). */
export function construirCsv(filas: (string | number | null | undefined)[][]): string {
  return "\uFEFF" + filas.map((fila) => fila.map(celda).join(";")).join("\r\n");
}

/** Respuesta HTTP de descarga de un archivo CSV. */
export function descargarCsv(nombre: string, contenido: string): Response {
  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}