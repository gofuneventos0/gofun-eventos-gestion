"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Printer, Send, XCircle } from "lucide-react";
import { cambiarEstadoFactura } from "@/lib/actions/facturas";
import type { EstadoFactura } from "@/lib/types";
import { Aviso, CLASE_BOTON_SUAVE } from "@/components/ui";

export default function AccionesFactura({ id, estado }: { id: string; estado: EstadoFactura }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmandoAnulacion, setConfirmandoAnulacion] = useState(false);

  function cambiar(nuevo: EstadoFactura) {
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoFactura(id, nuevo);
      if (!res.ok) {
        setError(res.mensaje ?? "No se pudo actualizar la factura.");
        return;
      }
      if (nuevo === "anulada") setConfirmandoAnulacion(false);
      router.refresh();
    });
  }

  return (
    <div className="tarjeta p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
        Acciones
      </h2>

      {error && (
        <div className="mb-3">
          <Aviso tono="error">{error}</Aviso>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => window.print()}
          className={`${CLASE_BOTON_SUAVE} w-full`}
        >
          <Printer className="h-4 w-4" /> Imprimir / guardar PDF
        </button>

        {estado === "proforma" && (
          <button
            type="button"
            onClick={() => cambiar("emitida")}
            disabled={pendiente}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4" /> Marcar como emitida
          </button>
        )}

        {estado !== "anulada" &&
          (!confirmandoAnulacion ? (
            <button
              type="button"
              onClick={() => setConfirmandoAnulacion(true)}
              className={`${CLASE_BOTON_SUAVE} w-full !text-rose-600`}
            >
              <XCircle className="h-4 w-4" /> Anular factura
            </button>
          ) : (
            <div className="rounded-lg bg-rose-50 p-3">
              <p className="text-sm text-rose-900">
                ¿Anular esta factura? El número queda reservado y no se reutiliza.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => cambiar("anulada")}
                  disabled={pendiente}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {pendiente && <Loader2 className="h-4 w-4 animate-spin" />} Sí, anular
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoAnulacion(false)}
                  className={`${CLASE_BOTON_SUAVE} flex-1`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ))}
      </div>

      <p className="mt-4 text-xs text-tinta-600">
        Con la factura anulada podrás generar una nueva desde el evento con el siguiente número
        correlativo.
      </p>
    </div>
  );
}