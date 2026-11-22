import { Suspense } from "react";
import Shell from "@/components/shell";
import CorreoSesion from "@/components/correo-sesion";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Shell
      correo={
        <Suspense
          fallback={<span className="text-xs text-slate-500">Sesión activa</span>}
        >
          <CorreoSesion />
        </Suspense>
      }
    >
      {children}
    </Shell>
  );
}
