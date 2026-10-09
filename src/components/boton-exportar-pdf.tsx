"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { construirPdfFactura } from "@/lib/pdf-factura";
import type { EmpresaConfig, FacturaCompleta } from "@/lib/types";
import { Aviso } from "@/components/ui";

export default function BotonExportarPdf({
  factura,
  config,
}: {
  factura: FacturaCompleta;
  config: EmpresaConfig | null;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setGenerando(true);
    setError(null);
    try {
      const bytes = await construirPdfFactura(factura, config);
      // Copia a un ArrayBuffer estándar (evita tipos Uint8Array por defecto)
      const copia = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(copia).set(bytes);
      const blob = new Blob([copia], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const prefijo = factura.estado === "proforma" ? "Proforma" : "Factura";
      a.href = url;
      a.download = `${prefijo}-${factura.numero}.pdf`;
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
        {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Exportar a PDF
      </button>
    </div>
  );
}