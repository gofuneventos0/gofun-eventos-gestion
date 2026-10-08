"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Loader2 } from "lucide-react";
import { CLASE_BOTON_SUAVE } from "@/components/ui";

/**
 * Botón de archivado (borrado lógico) que invoca una Server Action.
 * Recibe la acción como prop desde un Server Component.
 */
export default function BotonArchivar({
  id,
  accion,
  etiqueta = "Archivar",
  alArchivar = "/catalogo",
}: {
  id: string;
  accion: (id: string) => Promise<{ ok: boolean; mensaje?: string }>;
  etiqueta?: string;
  alArchivar?: string;
}) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ejecutar() {
    setError(null);
    start(async () => {
      const res = await accion(id);
      if (!res.ok) {
        setError(res.mensaje ?? "No se pudo archivar.");
        return;
      }
      router.push(alArchivar);
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={ejecutar}
        disabled={pendiente}
        className={`${CLASE_BOTON_SUAVE} !text-rose-600`}
      >
        {pendiente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
        {etiqueta}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
