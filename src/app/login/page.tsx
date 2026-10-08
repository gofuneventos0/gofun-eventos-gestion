import { isSupabaseConfigured } from "@/lib/supabase/env";
import FormularioLogin from "./formulario";

export const metadata = { title: "Acceso" };

export default async function LoginPage(props: PageProps<"/login">) {
  const configurado = isSupabaseConfigured();
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

        {configurado ? (
          <FormularioLogin desde={desde} />
        ) : (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
            <p className="mb-3 font-semibold">Falta conectar Supabase</p>
            <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
              <li>
                Crea un proyecto en{" "}
                <a
                  className="font-medium text-marca-400 underline"
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  supabase.com
                </a>{" "}
                (plan gratuito).
              </li>
              <li>
                Copia <strong>Project URL</strong> y <strong>anon key</strong> en{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5">.env.local</code>.
              </li>
              <li>
                Ejecuta el SQL de <code className="rounded bg-black/40 px-1.5 py-0.5">supabase/migrations/</code> en
                el SQL Editor y crea un usuario en Authentication → Users.
              </li>
              <li>Reinicia el servidor.</li>
            </ol>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Go Fun Eventos · Almagro (Ciudad Real) · Acceso privado del equipo
        </p>
      </div>
    </main>
  );
}
