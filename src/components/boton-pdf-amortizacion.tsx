"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { construirPdfAmortizacion } from "@/lib/pdf-amortizacion";
import { Aviso } from "@/components/ui";
import type { BienInversion, TablaAmortizacion } from "@/lib/types";

export default function BotonPdfAmortizacion({
  bien,
  tabla,
}: {
  bien: BienInversion;
  tabla: TablaAmortizacion;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setGenerando(true);
    setError(null);
    try {
      const bytes = await construirPdfAmortizacion(bien, tabla);
      const copia = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(copia).set(bytes);
      const blob = new Blob([copia], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Amortizacion-${bien.numero_factura ? bien.numero_factura.replace(/[^\w.-]+/g, "-") : bien.descripcion
        .slice(0, 40)
        .replace(/[^\w]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se ha podido generar el PDF. Inténtalo de nuevo.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3">
          <Aviso tono="error">{error}</Aviso>
        </div>
      )}
      <button
        type="button"
        onClick={exportar}
        disabled={generando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tinta-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-tinta-800 disabled:opacity-60"
      >
        {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Exportar a PDF
      </button>
    </div>
  );
}