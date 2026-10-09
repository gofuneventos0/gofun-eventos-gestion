import type {
  AnioAmortizacion,
  BienInversion,
  FilaAmortizacion,
  TablaAmortizacion,
} from "@/lib/types";

/**
 * Cálculo de las tablas de amortización de bienes de inversión.
 *
 * Reproduce las fórmulas de la hoja "PlantillasTablasAmortización" del libro
 * oficial (Libro Registro de Bienes de Inversión + Tablas de Amortización):
 *   - Primer año: porcentaje prorrateado por los días restantes del año
 *     desde la fecha de adquisición →  (% máx / 365) × días.
 *   - Años siguientes: el porcentaje lineal máximo del tipo de bien.
 *   - Último año: absorbe el resto (100 − Σ anteriores), amortizando
 *     exactamente lo que queda pendiente para dejar el bien a cero.
 *
 * Funciones puras: se usan tanto en el servidor (páginas) como en el
 * navegador (previsualización en el formulario) sin tocar la BD.
 */

function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Días restantes del año desde la fecha de adquisición hasta el 31 de
 * diciembre, INCLUIDO el día de compra. P. ej. comprado el 1 de enero → 365
 * (366 en bisiesto) → el primer año aplica el 100 % del porcentaje.
 */
export function diasRestantesAnio(fechaISO: string): number {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d));
  const fin = new Date(Date.UTC(y, 11, 31));
  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
  return Math.max(1, dias);
}

export function calcularTablaAmortizacion(
  bien: Pick<BienInversion, "fecha_adquisicion" | "valor_sin_iva" | "porcentaje_max">
): TablaAmortizacion {
  const valor = redondear(Number(bien.valor_sin_iva) || 0);
  const pctMax = Number(bien.porcentaje_max) || 0;
  const anioPrimero = Number(String(bien.fecha_adquisicion).slice(0, 4));
  const dias = diasRestantesAnio(bien.fecha_adquisicion);

  if (valor <= 0 || pctMax <= 0) {
    return { dias_restantes: dias, filas: [] };
  }

  const pctPrimero = redondear((pctMax / 365) * dias);
  const filas: FilaAmortizacion[] = [];

  let acumulado = 0;
  let pendiente = valor;
  let pctUtilizado = 0;
  let anio = anioPrimero;

  // Cota de seguridad: 80 años bastan para cualquier bien (máx. 2 %).
  for (let n = 0; n < 80; n++) {
    const restante = redondear(100 - pctUtilizado);

    // Año final: se ajusta el porcentaje y se amortiza exactamente lo pendiente.
    if (restante <= 0.005 || pendiente <= 0.005) break;

    const pctTeorico = n === 0 ? pctPrimero : pctMax;
    if (pctTeorico >= restante - 0.005) {
      acumulado = redondear(acumulado + pendiente);
      filas.push({
        anio,
        porcentaje: restante,
        amortiza: pendiente,
        acumulado,
        pendiente: 0,
      });
      break;
    }

    const amortiza = redondear((valor * pctTeorico) / 100);
    acumulado = redondear(acumulado + amortiza);
    pendiente = redondear(valor - acumulado);
    filas.push({ anio, porcentaje: pctTeorico, amortiza, acumulado, pendiente });
    pctUtilizado = redondear(pctUtilizado + pctTeorico);
    anio += 1;
  }

  return { dias_restantes: dias, filas };
}

/** Suma de la amortización anual de todos los bienes (resumen). */
export function resumenAnual(bienes: BienInversion[]): AnioAmortizacion[] {
  const porAnio = new Map<number, number>();
  for (const b of bienes) {
    for (const fila of calcularTablaAmortizacion(b).filas) {
      porAnio.set(fila.anio, (porAnio.get(fila.anio) ?? 0) + fila.amortiza);
    }
  }
  return [...porAnio.entries()]
    .map(([anio, amortiza]) => ({ anio, amortiza: redondear(amortiza) }))
    .sort((a, b) => a.anio - b.anio);
}

/** Total del valor de adquisición pendiente de amortizar a 31 de diciembre del año dado. */
export function pendienteEnAnio(bien: BienInversion, anio: number): number {
  const tabla = calcularTablaAmortizacion(bien);
  const fila = [...tabla.filas].reverse().find((f) => f.anio <= anio);
  return fila ? redondear(fila.pendiente) : redondear((Number(bien.valor_sin_iva) || 0));
}