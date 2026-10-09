"use client";

import { useActionState, useState } from "react";
import { calcularTablaAmortizacion } from "@/lib/amortizacion";
import { actualizarBien, crearBien } from "@/lib/actions/amortizaciones";
import { labelTipoBien, TIPOS_BIEN_INVERSION, TIPOS_IVA_BIEN } from "@/lib/constantes";
import { Aviso, Campo, CLASE_BOTON_MARCA, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";
import TablaAmortizacion from "@/components/tabla-amortizacion";
import type { BienInversion } from "@/lib/types";

export default function BienForm({ bien }: { bien?: BienInversion | null }) {
  const esEdicion = Boolean(bien);
  const [estado, accion] = useActionState(esEdicion ? actualizarBien : crearBien, null);

  const [descripcion, setDescripcion] = useState(bien?.descripcion ?? "");
  const [numeroFactura, setNumeroFactura] = useState(bien?.numero_factura ?? "");
  const [fecha, setFecha] = useState(bien?.fecha_adquisicion ?? new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState(bien ? String(bien.valor_sin_iva) : "");
  const [tipoIva, setTipoIva] = useState(bien?.tipo_iva ?? 21);
  const [tipoBien, setTipoBien] = useState(bien?.tipo_bien ?? "instalaciones");
  const [observaciones, setObservaciones] = useState(bien?.observaciones ?? "");

  const tipo = TIPOS_BIEN_INVERSION.find((t) => t.valor === tipoBien) ?? TIPOS_BIEN_INVERSION[0];
  const valorNum = Number(valor.replace(",", "."));
  const preview =
    Number.isFinite(valorNum) && valorNum > 0 && fecha
      ? calcularTablaAmortizacion({
          fecha_adquisicion: fecha,
          valor_sin_iva: valorNum,
          porcentaje_max: tipo.porcentaje,
        })
      : null;

  const ivaImporte = Number.isFinite(valorNum)
    ? ((valorNum * tipoIva) / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

  return (
    <form action={accion} className="space-y-6">
      {estado && <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>}
      {bien && <input type="hidden" name="id" value={bien.id} />}

      <section className="tarjeta space-y-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">Datos del bien</h2>

        <Campo
          label="Descripción del bien"
          ayuda="Según lo expuesto en el concepto de la factura de compra."
        >
          <input
            type="text"
            name="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            placeholder="P. ej. Castillos hinchables (2 unidades)"
            className={CLASE_INPUT}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nº de factura">
            <input
              type="text"
              name="numero_factura"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              placeholder="P. ej. F-Compras 2026-0001"
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Fecha de adquisición">
            <input
              type="date"
              name="fecha_adquisicion"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className={CLASE_INPUT}
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Valor sin IVA (base amortizable)">
            <input
              type="text"
              inputMode="decimal"
              name="valor_sin_iva"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              placeholder="0,00"
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label={`IVA aplicado (importe: ${ivaImporte} €)`}>
            <select
              name="tipo_iva"
              value={tipoIva}
              onChange={(e) => setTipoIva(Number(e.target.value))}
              className={CLASE_INPUT}
            >
              {TIPOS_IVA_BIEN.map((t) => (
                <option key={t} value={t}>
                  {t} %
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo
          label="Tipo de bien de inversión"
          ayuda={`Porcentaje lineal máximo anual: ${tipo.porcentaje} % (según tablas oficiales).`}
        >
          <select
            name="tipo_bien"
            value={tipoBien}
            onChange={(e) => setTipoBien(e.target.value as typeof tipoBien)}
            className={CLASE_INPUT}
          >
            {TIPOS_BIEN_INVERSION.map((t) => (
              <option key={t.valor} value={t.valor}>
                {labelTipoBien(t.valor)} — {t.porcentaje} %
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Observaciones">
          <textarea
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className={CLASE_INPUT}
          />
        </Campo>
      </section>

      {preview && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
            Tabla de amortización prevista
          </h2>
          <TablaAmortizacion
            bien={{
              id: bien?.id ?? "preview",
              descripcion: descripcion || "Bien",
              numero_factura: numeroFactura || null,
              fecha_adquisicion: fecha,
              valor_sin_iva: valorNum,
              tipo_iva: tipoIva,
              iva_importe: (valorNum * tipoIva) / 100,
              tipo_bien: tipoBien,
              porcentaje_max: tipo.porcentaje,
              observaciones: observaciones || null,
              creado_en: "",
              actualizado_en: "",
            }}
            tabla={preview}
          />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <BotonEnviar className={CLASE_BOTON_MARCA}>
          {esEdicion ? "Guardar cambios" : "Dar de alta el bien"}
        </BotonEnviar>
      </div>
    </form>
  );
}