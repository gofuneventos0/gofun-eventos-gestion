import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { BienInversion, TablaAmortizacion } from "@/lib/types";
import { labelTipoBien } from "@/lib/constantes";

/**
 * PDF de la tabla de amortización de un bien de inversión, con el mismo
 * estilo limpio del modelo oficial de Go Fun Eventos (A4, cabecera,
 * bloque de datos del bien y tabla AÑO | % | AMORTIZA | ACUMULADO | PENDIENTE
 * con fila de totales).
 */

const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 40;
const DERECHA = ANCHO - MARGEN;

/** '2026-10-08' → '08/10/2026' */
function fechaNumerica(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function numero(n: number): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dinero(n: number): string {
  return `${numero(n)} €`;
}

function envolverTexto(texto: string, font: PDFFont, size: number, maxW: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of texto.split("\n")) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    let actual = "";
    for (const pal of palabras) {
      const prueba = actual ? `${actual} ${pal}` : pal;
      if (!actual || font.widthOfTextAtSize(prueba, size) <= maxW) {
        actual = prueba;
      } else {
        lineas.push(actual);
        actual = pal;
      }
    }
    if (actual) lineas.push(actual);
  }
  return lineas.length > 0 ? lineas : [""];
}

export async function construirPdfAmortizacion(
  bien: BienInversion,
  tabla: TablaAmortizacion
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([ANCHO, ALTO]);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const negro = rgb(0.12, 0.12, 0.12);
  const gris = rgb(0.45, 0.45, 0.45);
  const grisClaro = rgb(0.93, 0.93, 0.93);
  const linea = rgb(0.85, 0.85, 0.85);

  const dibujar = (txt: string, x: number, y: number, size: number, f = normal, color = negro) =>
    page.drawText(txt, { x, y, size, font: f, color });
  const dibujarDer = (txt: string, right: number, y: number, size: number, f = normal, color = negro) =>
    page.drawText(txt, { x: right - f.widthOfTextAtSize(txt, size), y, size, font: f, color });

  // ---------------------------------------------------------- Cabecera
  let y = ALTO - 55;
  page.drawText("TABLA DE AMORTIZACIÓN", {
    x: MARGEN,
    y: y - 20,
    size: 22,
    font: negrita,
    color: negro,
  });
  dibujarDer(`% máx. anual   ${bien.porcentaje_max} %`, DERECHA, y, 10, negrita);
  dibujarDer(`Fecha adquisición   ${fechaNumerica(bien.fecha_adquisicion)}`, DERECHA, y - 16, 10);
  dibujarDer(`Días 1er año   ${tabla.dias_restantes}`, DERECHA, y - 32, 10);

  // ---------------------------------------------------------- Bloque del bien
  y = ALTO - 150;
  dibujar(bien.descripcion || "Bien de inversión", MARGEN, y, 11, negrita);
  const subtitulo = [
    bien.numero_factura ? `Nº factura: ${bien.numero_factura}` : null,
    `Tipo: ${labelTipoBien(bien.tipo_bien)}`,
    `IVA (${bien.tipo_iva} %): ${dinero(bien.iva_importe)}`,
  ]
    .filter(Boolean)
    .join("   ·   ");
  dibujar(subtitulo, MARGEN, y - 18, 9.5, normal, gris);
  page.drawLine({
    start: { x: MARGEN - 8, y: y - 32 },
    end: { x: DERECHA + 8, y: y - 32 },
    thickness: 0.8,
    color: gris,
  });

  // ---------------------------------------------------------- Tabla
  const fPctDer = 205;
  const fAmoDer = 325;
  const fAcuDer = 445;
  y = ALTO - 210;
  const altoFila = 22;

  page.drawRectangle({
    x: MARGEN - 8,
    y: y - altoFila,
    width: DERECHA - MARGEN + 16,
    height: altoFila,
    color: grisClaro,
  });
  dibujar("AÑO", MARGEN, y - 15, 8.5, negrita);
  dibujarDer("POCENTAJE", fPctDer, y - 15, 8.5, negrita);
  dibujarDer("AMORTIZA", fAmoDer, y - 15, 8.5, negrita);
  dibujarDer("ACUMULADO", fAcuDer, y - 15, 8.5, negrita);
  dibujarDer("PENDIENTE", DERECHA, y - 15, 8.5, negrita);
  y -= altoFila;

  for (const fila of tabla.filas) {
    dibujar(String(fila.anio), MARGEN, y - 14, 9.5);
    dibujarDer(`${numero(fila.porcentaje)} %`, fPctDer, y - 14, 9.5);
    dibujarDer(dinero(fila.amortiza), fAmoDer, y - 14, 9.5);
    dibujarDer(dinero(fila.acumulado), fAcuDer, y - 14, 9.5);
    dibujarDer(dinero(fila.pendiente), DERECHA, y - 14, 9.5);
    page.drawLine({
      start: { x: MARGEN - 8, y: y - altoFila },
      end: { x: DERECHA + 8, y: y - altoFila },
      thickness: 0.6,
      color: linea,
    });
    y -= altoFila;
  }

  // Totales
  const totalAmortiza = tabla.filas.reduce((s, f) => s + f.amortiza, 0);
  const totalPct = tabla.filas.reduce((s, f) => s + f.porcentaje, 0);
  dibujar("TOTAL", MARGEN, y - 6, 10, negrita);
  dibujarDer(`${numero(totalPct)} %`, fPctDer, y - 6, 10, negrita);
  dibujarDer(dinero(totalAmortiza), fAmoDer, y - 6, 10, negrita);
  dibujarDer(dinero(totalAmortiza), fAcuDer, y - 6, 10, negrita);
  dibujarDer("0,00 €", DERECHA, y - 6, 10, negrita);
  y -= 28;

  // Observaciones
  if (bien.observaciones) {
    dibujar("Observaciones:", MARGEN, y, 9.5, negrita, gris);
    const o = envolverTexto(bien.observaciones, normal, 9.5, DERECHA - MARGEN);
    let oy = y - 15;
    for (const ln of o) {
      dibujar(ln, MARGEN + 20, oy, 9.5, normal, gris);
      oy -= 13;
    }
  }

  // ---------------------------------------------------------- Pie
  const pieY = 60;
  dibujar(
    "Amortización lineal · Primer año prorrateado por días restantes desde la fecha de adquisición.",
    MARGEN,
    pieY,
    8.5,
    normal,
    gris
  );
  dibujar("Porcentajes según tablas oficiales de amortización de bienes de inversión.", MARGEN, pieY - 13, 8.5, normal, gris);

  return doc.save();
}