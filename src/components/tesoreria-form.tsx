"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Landmark, Wallet } from "lucide-react";
import { guardarCobro, guardarGasto } from "@/lib/actions/tesoreria";
import type { CategoriaGasto, Cobro, Cuenta, Gasto, MetodoPago } from "@/lib/types";
import { CATEGORIAS_GASTO, METODOS_PAGO } from "@/lib/constantes";
import { fechaCorta } from "@/lib/format";
import { Aviso, Campo, CLASE_BOTON, CLASE_BOTON_SUAVE, CLASE_INPUT, Tarjeta } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

interface EventoOpcion {
  id: string;
  titulo: string;
  fecha: string;
}

export default function TesoreriaForm({
  tipo,
  fila,
  cuentas,
  eventos,
  eventoDefecto,
}: {
  tipo: "cobro" | "gasto";
  fila?: Cobro | Gasto | null;
  cuentas: Cuenta[];
  eventos: EventoOpcion[];
  eventoDefecto?: string | null;
}) {
  const accion = tipo === "cobro" ? guardarCobro : guardarGasto;
  const [estado, enviar] = useActionState(accion, null);
  const [metodo, setMetodo] = useState<MetodoPago>(fila?.metodo ?? "efectivo");
  const [categoria, setCategoria] = useState<CategoriaGasto>(
    (fila as Gasto | undefined)?.categoria ?? "otros"
  );
  const [eventoSeleccionado, setEventoSeleccionado] = useState(
    fila && "evento_id" in fila ? (fila.evento_id ?? "") : (eventoDefecto ?? "")
  );

  return (
    <>
      <Link
        href="/tesoreria"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a tesorería
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-tinta-950">
        {fila ? "Editar" : tipo === "cobro" ? "Registrar cobro" : "Registrar gasto"}
      </h1>
      <p className="mt-1 text-sm text-tinta-600">
        {tipo === "cobro"
          ? "Entrada de dinero: señales, pagos a cuenta o pago completo del evento."
          : "Salida de dinero: combustible, material, impuestos y demás gastos."}
      </p>

      <Tarjeta className="mt-6 max-w-3xl p-5">
        {estado && !estado.ok && estado.mensaje && (
          <div className="mb-4">
            <Aviso tono="error">{estado.mensaje}</Aviso>
          </div>
        )}

        <form action={enviar} className="space-y-5">
          {fila && <input type="hidden" name="id" value={fila.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Cuenta">
              <div className="relative">
                {cuentas.find((c) => c.id === (fila?.cuenta_id ?? ""))?.tipo === "banco" ? (
                  <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                ) : (
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                )}
                <select
                  name="cuenta_id"
                  required
                  defaultValue={fila?.cuenta_id ?? cuentas[0]?.id ?? ""}
                  className={`${CLASE_INPUT} pl-9`}
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.tipo === "caja" ? "caja" : "banco"})
                    </option>
                  ))}
                </select>
              </div>
            </Campo>

            <Campo label="Fecha">
              <input
                type="date"
                name="fecha"
                required
                defaultValue={fila?.fecha ?? new Date().toISOString().slice(0, 10)}
                className={CLASE_INPUT}
              />
            </Campo>

            <Campo label="Importe (€)">
              <input
                type="number"
                name="importe"
                required
                min="0.01"
                step="0.01"
                defaultValue={fila ? Number(fila.importe) : ""}
                placeholder="0,00"
                className={CLASE_INPUT}
              />
            </Campo>

            <Campo label="Método de pago">
              <select
                name="metodo"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPago)}
                className={CLASE_INPUT}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Campo>

            {tipo === "gasto" && (
              <Campo label="Categoría">
                <select
                  name="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                  className={CLASE_INPUT}
                >
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            <Campo
              label="Concepto"
              className={tipo === "gasto" ? "sm:col-span-2" : ""}
            >
              <input
                type="text"
                name="concepto"
                required
                defaultValue={fila?.concepto ?? ""}
                placeholder={
                  tipo === "cobro" ? "p. ej. Señal para Verbena de San Julián" : "p. ej. Gasoil para el toro mecánico"
                }
                className={CLASE_INPUT}
              />
            </Campo>
          </div>

          {tipo === "cobro" && (
            <Campo
              label="Evento asociado (opcional)"
              ayuda="Si eliges un evento, el cobro se resta de su pendiente."
            >
              <select
                name="evento_id"
                value={eventoSeleccionado}
                onChange={(e) => setEventoSeleccionado(e.target.value)}
                className={CLASE_INPUT}
              >
                <option value="">— Sin evento —</option>
                {eventos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo} · {fechaCorta(e.fecha)}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          {tipo === "gasto" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Proveedor (opcional)">
                <input
                  type="text"
                  name="proveedor"
                  defaultValue={(fila as Gasto)?.proveedor ?? ""}
                  placeholder="p. ej. Estación de servicio"
                  className={CLASE_INPUT}
                />
              </Campo>
              <Campo label="Nº factura (opcional)">
                <input
                  type="text"
                  name="factura_ref"
                  defaultValue={(fila as Gasto)?.factura_ref ?? ""}
                  placeholder="p. ej. F2026-0154"
                  className={CLASE_INPUT}
                />
              </Campo>
            </div>
          )}

          <Campo label="Notas (opcional)">
            <textarea
              name="notas"
              defaultValue={fila?.notas ?? ""}
              rows={2}
              className={CLASE_INPUT}
            />
          </Campo>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <BotonEnviar className={CLASE_BOTON}>
              {fila ? "Guardar cambios" : tipo === "cobro" ? "Guardar cobro" : "Guardar gasto"}
            </BotonEnviar>
            <Link href="/tesoreria" className={CLASE_BOTON_SUAVE}>
              Cancelar
            </Link>
          </div>
        </form>
      </Tarjeta>
    </>
  );
}