import {
  PDFDocument,
  PDFFont,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import type { EmpresaConfig, FacturaCompleta } from "@/lib/types";

/**
 * Generación del PDF de factura/proforma con el estilo del modelo oficial
 * de Go Fun Eventos (A4, cabecera FACTURA/PROFORMA, bloques emisor/cliente,
 * tabla de líneas, totales y pie con datos de pago).
 *
 * Se ejecuta en cliente (pdf-lib no toca el servidor): el PDF se construye
 * con los datos ya cargados por la página y se descarga directamente.
 */

const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 40;
const DERECHA = ANCHO - MARGEN;

/** '2026-10-08' → '08/10/2026' */
function fechaNumerica(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Suma días a una fecha ISO y la devuelve en formato 'dd/mm/yyyy'. */
function vencimiento(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d + dias);
  return `${String(f.getDate()).padStart(2, "0")}/${String(
    f.getMonth() + 1
  ).padStart(2, "0")}/${f.getFullYear()}`;
}

/** 1234.5 → '1.234,50' (es-ES) */
function numero(n: number): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 1234.5 → '1.234,50 €' */
function dinero(n: number): string {
  return `${numero(n)} €`;
}

/** Divide un texto en líneas que caben en maxW (respetando saltos de línea). */
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

export async function construirPdfFactura(
  factura: FacturaCompleta,
  config: EmpresaConfig | null
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([ANCHO, ALTO]);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const negro = rgb(0.12, 0.12, 0.12);
  const gris = rgb(0.45, 0.45, 0.45);
  const grisClaro = rgb(0.93, 0.93, 0.93);
  const linea = rgb(0.85, 0.85, 0.85);
  const rojo = rgb(0.8, 0.2, 0.2);

  const dibujar = (txt: string, x: number, y: number, size: number, f = normal, color = negro) =>
    page.drawText(txt, { x, y, size, font: f, color });

  const dibujarDer = (txt: string, right: number, y: number, size: number, f = normal, color = negro) =>
    page.drawText(txt, { x: right - f.widthOfTextAtSize(txt, size), y, size, font: f, color });

  const empresa = config?.nombre?.trim() || "Go Fun Eventos";
  const proforma = factura.estado === "proforma";
  const anulada = factura.estado === "anulada";

  // ------------------------------------------------------------
  // Cabecera: título y bloque de metadatos (fecha, número, vencimiento)
  // ------------------------------------------------------------
  let y = ALTO - 55;
  page.drawText(proforma ? "PROFORMA" : "FACTURA", {
    x: MARGEN,
    y: y - 20,
    size: 26,
    font: negrita,
    color: negro,
  });
  dibujarDer(`Nº de factura   ${factura.numero}`, DERECHA, y, 10, negrita);
  dibujarDer(`Fecha   ${fechaNumerica(factura.fecha)}`, DERECHA, y - 16, 10);
  dibujarDer(`Vencimiento   ${vencimiento(factura.fecha, 30)}`, DERECHA, y - 32, 10);

  if (anulada) {
    page.drawText("ANULADA", {
      x: DERECHA - negrita.widthOfTextAtSize("ANULADA", 10),
      y: y - 50,
      size: 10,
      font: negrita,
      color: rojo,
    });
  }

  // ------------------------------------------------------------
  // Bloques emisor (izquierda) y cliente (derecha)
  // ------------------------------------------------------------
  y = ALTO - 150;
  const mitad = (DERECHA - MARGEN) / 2 - 8;

  // Emisor
  dibujar(empresa, MARGEN, y, 11, negrita);
  let yy = y - 17;
  if (config?.cif) dibujar(`C.I.F./N.I.F.: ${config.cif}`, MARGEN, yy, 9.5, normal, gris);
  if (config?.direccion) {
    yy -= 15;
    dibujar(config.direccion, MARGEN, yy, 9.5, normal, gris);
  }
  const poblacion = [config?.poblacion, config?.provincia].filter(Boolean).join(", ");
  if (poblacion) {
    yy -= 15;
    dibujar(poblacion, MARGEN, yy, 9.5, normal, gris);
  }
  if (config?.telefono) {
    yy -= 15;
    dibujar(`Tel: ${config.telefono}`, MARGEN, yy, 9.5, normal, gris);
  }
  if (config?.email) {
    yy -= 15;
    dibujar(config.email, MARGEN, yy, 9.5, normal, gris);
  }

  // Cliente
  const xC = MARGEN + mitad + 16;
  dibujar("--- Datos del Cliente ---", xC, y, 9.5, negrita, gris);
  if (factura.cliente) {
    let cy = y - 17;
    dibujar(factura.cliente.nombre, xC, cy, 11, negrita);
    if (factura.cliente.cif_nif) {
      cy -= 17;
      dibujar(`C.I.F./N.I.F.: ${factura.cliente.cif_nif}`, xC, cy, 9.5, normal, gris);
    }
    if (factura.cliente.direccion) {
      cy -= 15;
      dibujar(factura.cliente.direccion, xC, cy, 9.5, normal, gris);
    }
    const ciudad = [factura.cliente.poblacion, factura.cliente.provincia, factura.cliente.cp]
      .filter(Boolean)
      .join(", ");
    if (ciudad) {
      cy -= 15;
      dibujar(ciudad, xC, cy, 9.5, normal, gris);
    }
  } else {
    dibujar("Sin cliente", xC, y - 17, 9.5, normal, gris);
  }

  // ------------------------------------------------------------
  // Tabla de líneas
  // ------------------------------------------------------------
  const cantDer = 88;
  const codDer = 138;
  const precioDer = 408;
  y = ALTO - 300;
  const altoFila = 22;

  // Cabecera
  page.drawRectangle({ x: MARGEN - 8, y: y - altoFila, width: DERECHA - MARGEN + 16, height: altoFila, color: grisClaro });
  dibujar("Cant", cantDer - 8, y - 15, 8.5, negrita);
  dibujar("Código", codDer - 8, y - 15, 8.5, negrita);
  dibujar("Descripción", codDer + 10, y - 15, 8.5, negrita);
  dibujarDer("Precio (SIN IVA)", precioDer, y - 15, 8.5, negrita);
  dibujarDer("Importe", DERECHA, y - 15, 8.5, negrita);
  y -= altoFila;

  const descMaxW = precioDer - 22 - (codDer + 6);
  const lineas = factura.factura_lineas.slice().sort((a, b) => a.orden - b.orden);

  for (const [i, l] of lineas.entries()) {
    const desc = envolverTexto(l.descripcion, normal, 9.5, descMaxW);
    const nLineas = Math.max(desc.length, 1);
    const alto = nLineas * 13 + 8;
    const base = y - 9;

    desc.forEach((ln, j) => dibujar(ln, codDer + 6, base - j * 13, 9.5));
    dibujar(String(l.cantidad), cantDer - 10, base, 9.5);
    dibujar(String(i + 1).padStart(3, "0"), codDer - 10, base, 9.5);
    dibujarDer(dinero(l.precio_unitario), precioDer, base, 9.5);
    dibujarDer(dinero(l.cantidad * l.precio_unitario), DERECHA, base, 9.5, negrita);

    page.drawLine({ start: { x: MARGEN - 8, y: y - alto }, end: { x: DERECHA + 8, y: y - alto }, thickness: 0.6, color: linea });
    y -= alto;
  }

  page.drawLine({ start: { x: MARGEN - 8, y: y + 4 }, end: { x: DERECHA + 8, y: y + 4 }, thickness: 0.8, color: gris });

  // ------------------------------------------------------------
  // Totales (bloque derecho)
  // ------------------------------------------------------------
  const totalesIzq = 335;
  y -= 30;
  const fila = 20;

  dibujar("Subtotal", totalesIzq, y, 10);
  dibujarDer(dinero(factura.base_imponible), DERECHA, y, 10);
  y -= fila;

  dibujar(`IVA (${factura.iva} %)`, totalesIzq, y, 10);
  dibujarDer(dinero(factura.iva_importe), DERECHA, y, 10);
  y -= fila;

  if (factura.irpf > 0) {
    dibujar(`Retención IRPF (${factura.irpf} %)`, totalesIzq, y, 10);
    dibujarDer(`-${dinero(factura.irpf_importe)}`, DERECHA, y, 10, normal, rojo);
    y -= fila;
  }

  page.drawLine({ start: { x: totalesIzq, y }, end: { x: DERECHA, y }, thickness: 0.8, color: gris });
  y -= 16;
  dibujar("TOTAL", totalesIzq, y, 11, negrita);
  dibujarDer(dinero(factura.total), DERECHA, y, 12, negrita);
  y -= 30;
  dibujar("Saldo a pagar", totalesIzq, y, 10, negrita);
  dibujarDer(dinero(factura.total), DERECHA, y, 12, negrita);

  // ------------------------------------------------------------
  // Pie: condiciones de pago
  // ------------------------------------------------------------
  const pieY = 78;
  dibujar("Forma de pago: Transferencia bancaria a 30 días fecha factura", MARGEN, pieY, 9.5, normal, gris);
  if (config?.iban) dibujar(`IBAN: ${config.iban}`, MARGEN, pieY - 15, 9.5, normal, gris);
  dibujar(`Titular: ${empresa}`, MARGEN, pieY - 30, 9.5, normal, gris);
  dibujar("Todos los artículos son en concepto de Alquiler", MARGEN, pieY - 45, 9.5, normal, gris);

  // ------------------------------------------------------------
  // Sello de anulada
  // ------------------------------------------------------------
  if (anulada) {
    page.drawText("ANULADA", {
      x: ANCHO / 2 - 130,
      y: ALTO / 2 - 20,
      size: 64,
      font: negrita,
      color: rojo,
      opacity: 0.25,
      rotate: degrees(-40),
    });
  }

  return doc.save();
}