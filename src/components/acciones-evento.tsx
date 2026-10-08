"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { borrarEvento, cambiarEstadoEvento } from "@/lib/actions/eventos";
import { ESTADOS, ORDEN_ESTADOS } from "@/lib/constantes";
import type { EstadoEvento } from "@/lib/types";
import { Aviso, CLASE_BOTON_SUAVE, CLASE_INPUT } from "@/components/ui";

export default function AccionesEvento({
  id,
  estado,
}: {
  id: string;
  estado: EstadoEvento;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  function cambiar(nuevo: EstadoEvento) {
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoEvento(id, nuevo);
      if (!res.ok) setError(res.mensaje ?? "No se pudo cambiar el estado.");
      else router.refresh();
    });
  }

  function eliminar() {
    setError(null);
    startTransition(async () => {
      const res = await borrarEvento(id);
      if (!res.ok) {
        setError(res.mensaje ?? "No se pudo eliminar.");
        return;
      }
      router.push("/eventos");
      router.refresh();
    });
  }

  return (
    <div className="tarjeta p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
        Estado y acciones
      </h2>

      {error && <div className="mb-3"><Aviso tono="error">{error}</Aviso></div>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta-950">Estado del evento</span>
        <select
          value={estado}
          disabled={pendiente}
          onChange={(e) => cambiar(e.target.value as EstadoEvento)}
          className={CLASE_INPUT}
        >
          {ORDEN_ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADOS[e].label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-xs text-tinta-600">
        Flujo recomendado: borrador → confirmado → realizado → cobrado.
      </p>

      <div className="mt-5 border-t border-gray-100 pt-4">
        {!confirmando ? (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className={`${CLASE_BOTON_SUAVE} w-full !text-rose-600`}
          >
            <Trash2 className="h-4 w-4" /> Eliminar evento
          </button>
        ) : (
          <div className="rounded-lg bg-rose-50 p-3">
            <p className="text-sm text-rose-900">¿Eliminar este evento definitivamente?</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={eliminar}
                disabled={pendiente}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {pendiente && <Loader2 className="h-4 w-4 animate-spin" />} Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className={`${CLASE_BOTON_SUAVE} flex-1`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
