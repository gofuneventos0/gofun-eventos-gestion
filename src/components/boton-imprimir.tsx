"use client";

import { Printer } from "lucide-react";

/** Botón de impresión (window.print) para pantallas y "guardar como PDF". */
export default function BotonImprimir({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-tinta-950 transition hover:bg-gray-50"
      }
    >
      <Printer className="h-4 w-4" /> Imprimir / guardar como PDF
    </button>
  );
}