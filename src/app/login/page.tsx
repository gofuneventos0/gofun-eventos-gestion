import { esModoLocal } from "@/lib/supabase/env";
import FormularioLogin from "./formulario";

export const metadata = { title: "Acceso" };

export default async function LoginPage(props: PageProps<"/login">) {
  const local = esModoLocal();
  const sp = await props.searchParams;
  const desde = typeof sp.desde === "string" ? sp.desde : "/panel";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-tinta-950 px-4 py-10">
      {/* Resplandor con la identidad de Go Fun */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,#84cc16_0%,transparent_60%)] opacity-40"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-500 text-2xl font-black text-tinta-950 shadow-lg shadow-lime-500/20">
            GF
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Go Fun <span className="text-marca-400">Gestión</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Calendario de eventos y gestión económica del equipo
          </p>
        </div>

        <FormularioLogin desde={desde} />

        {local && (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-marca-400">Modo local</span> · usuario{" "}
            <code className="rounded bg-black/40 px-1 py-0.5">admin</code> y contraseña{" "}
            <code className="rounded bg-black/40 px-1 py-0.5">admin</code>. Cuando añadas las
            credenciales de Supabase en <code className="rounded bg-black/40 px-1 py-0.5">.env.local</code>{" "}
            y reinicies, el equipo entrará con su propia cuenta (ver README).
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Go Fun Eventos · Almagro (Ciudad Real) · Acceso privado del equipo
        </p>
      </div>
    </main>
  );
}