"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FormularioLogin({ desde }: { desde: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : error.message
        );
        setCargando(false);
        return;
      }

      router.replace(desde.startsWith("/") ? desde : "/panel");
      router.refresh();
    } catch {
      setError("No se pudo conectar con Supabase. Revisa .env.local.");
      setCargando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Correo</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="gofuneventos0@gmail.com"
          className="w-full rounded-lg border border-white/10 bg-tinta-950/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/30"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-tinta-950/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/30"
        />
      </label>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-marca-500 px-4 py-2.5 font-semibold text-tinta-950 transition hover:bg-marca-400 disabled:opacity-60"
      >
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
