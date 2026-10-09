"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { crearFactura } from "@/lib/actions/facturas";
import { IRPF_RETENCION_DEFECTO, labelTipoCliente } from "@/lib/constantes";
import { euros } from "@/lib/format";
import { Aviso, Campo, CLASE_BOTON_MARCA, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";
import type { TipoCliente } from "@/lib/types";

export interface EventoOpcion {
  id: string;
  titulo: string;
  fecha: string;
  cliente: {
    nombre: string;
    tipo: TipoCliente;
    retiene_irpf: boolean;
  } | null;
  lineas: { descripcion: string; cantidad: number; precio_unitario: number }[];
}

export default function FacturaForm({
  eventos,
  ivaDefecto,
  irpfDefecto,
  serieFacturas,
  eventoDefecto,
}: {
  eventos: EventoOpcion[];
  ivaDefecto: number;
  irpfDefecto: number;
  serieFacturas: string;
  eventoDefecto?: string;
}) {
  const [estado, accion] = useActionState(crearFactura, null);
  const [eventoId, setEventoId] = useState(eventoDefecto ?? "");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<"proforma" | "emitida">("emitida");

  const evento = useMemo(
    () => eventos.find((e) => e.id === eventoId) ?? null,
    [eventos, eventoId]
  );

  const preview = useMemo(() => {
    if (!evento) return null;
    const base = evento.lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
    if (base <= 0) return { base, ivaImporte: 0, irpfTasa: 0, irpfImporte: 0, total: 0 };
    const irpfTasa = evento.cliente?.retiene_irpf
      ? irpfDefecto > 0
        ? irpfDefecto
        : IRPF_RETENCION_DEFECTO
      : 0;
    const ivaImporte = Number(((base * ivaDefecto) / 100).toFixed(2));
    const irpfImporte = Number(((base * irpfTasa) / 100).toFixed(2));
    return {
      base,
      ivaImporte,
      irpfTasa,
      irpfImporte,
      total: Number((base + ivaImporte - irpfImporte).toFixed(2)),
    };
  }, [evento, ivaDefecto, irpfDefecto]);

  const sinCliente = evento && !evento.cliente;
  const sinLineas = evento && preview?.base === 0;

  return (
    <form action={accion} className="space-y-6">
      {estado && <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>}

      <input type="hidden" name="evento_id" value={eventoId} />
      <input type="hidden" name="estado" value={tipo} />

      <section className="tarjeta space-y-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
          Datos de la factura
        </h2>

        <Campo label="Evento a facturar" ayuda="La factura se genera copiando las líneas del evento y los datos fiscales de su cliente.">
          <select
            name="evento_id_select"
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            className={CLASE_INPUT}
          >
            <option value="">— Elige un evento —</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo} · {e.fecha} · {e.cliente?.nombre ?? "sin cliente"}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Fecha de la factura">
            <input
              type="date"
              name="fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Tipo">
            <div className="flex gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm font-medium text-tinta-950">
                <input
                  type="radio"
                  name="tipo"
                  value="emitida"
                  checked={tipo === "emitida"}
                  onChange={() => setTipo("emitida")}
                />
                Emitida
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-tinta-950">
                <input
                  type="radio"
                  name="tipo"
                  value="proforma"
                  checked={tipo === "proforma"}
                  onChange={() => setTipo("proforma")}
                />
                Proforma
              </label>
            </div>
          </Campo>
        </div>
      </section>

      {evento && (
        <section className="tarjeta space-y-3 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
            Previsualización · serie {serieFacturas}
          </h2>

          {sinCliente && (
            <Aviso tono="error">
              Este evento no tiene cliente asignado. Añade un cliente antes de facturar.
            </Aviso>
          )}
          {sinLineas && (
            <Aviso tono="error">
              Este evento no tiene líneas con importe. Añade atracciones antes de facturar.
            </Aviso>
          )}

          {!sinCliente && !sinLineas && preview && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-tinta-950">{evento.cliente?.nombre}</span>
                <span className="text-xs text-tinta-600">
                  {evento.cliente ? labelTipoCliente(evento.cliente.tipo) : ""}
                  {evento.cliente?.retiene_irpf && " · retiene IRPF"}
                </span>
              </div>

              <dl className="space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-tinta-600">Base imponible</dt>
                  <dd className="font-medium text-tinta-950">{euros(preview.base)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-tinta-600">IVA ({ivaDefecto} %)</dt>
                  <dd className="font-medium text-tinta-950">{euros(preview.ivaImporte)}</dd>
                </div>
                {preview.irpfTasa > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-tinta-600">Retención IRPF ({preview.irpfTasa} %)</dt>
                    <dd className="font-medium text-rose-700">
                      −{euros(preview.irpfImporte)}
                    </dd>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <dt className="text-tinta-600">Retención IRPF</dt>
                    <dd className="font-medium text-tinta-600">No aplica</dd>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-tinta-950">Total a cobrar</dt>
                  <dd className="text-lg font-extrabold text-tinta-950">
                    {euros(preview.total)}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>
      )}

      <div className="flex justify-end">
        <BotonEnviar className={CLASE_BOTON_MARCA}>Crear factura</BotonEnviar>
      </div>
    </form>
  );
}