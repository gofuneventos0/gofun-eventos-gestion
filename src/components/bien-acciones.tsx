"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { borrarBien } from "@/lib/actions/amortizaciones";
import { Aviso } from "@/components/ui";

export default function AccionesBien({ id }: { id: string }) {
  const router = useRouter();
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  async function eliminar() {
    setPendiente(true);
    setError(null);
    const res = await borrarBien(id);
    if (!res.ok) {
      setError(res.mensaje ?? "No se pudo borrar el bien.");
      setPendiente(false);
      return;
    }
    router.replace("/amortizaciones");
    router.refresh();
  }

  return (
    <div className="tarjeta flex flex-col gap-3 p-5 print:hidden">
      <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">Acciones</h2>
      {error && <Aviso tono="error">{error}</Aviso>}

      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> Borrar bien
        </button>
      ) : (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
          <p className="mb-2 font-medium text-rose-900">
            ¿Seguro? Se perderá el registro del bien y su tabla.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={eliminar}
              disabled={pendiente}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Sí, borrar
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={pendiente}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-tinta-950 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-tinta-600">
        Consejo: si un bien ya no está en uso puedes dejarlo en el registro; borrarlo elimina el
        histórico de su amortización.
      </p>
    </div>
  );
}