"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Botón de envío con estado pendiente, para formularios que usan Server Actions.
 */
export default function BotonEnviar({
  children,
  className,
  pendienteTexto = "Guardando…",
}: {
  children: React.ReactNode;
  className?: string;
  pendienteTexto?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendienteTexto : children}
    </button>
  );
}
