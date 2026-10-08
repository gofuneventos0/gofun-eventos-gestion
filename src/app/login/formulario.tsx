"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { acceder } from "@/lib/actions/auth";
import { useFormStatus } from "react-dom";

function BotonEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-marca-500 px-4 py-2.5 font-semibold text-tinta-950 transition hover:bg-marca-400 disabled:opacity-60"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-tinta-950/30 border-t-tinta-950" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function FormularioLogin({ desde }: { desde: string }) {
  const [estado, accion] = useActionState(acceder, null);

  return (
    <form action={accion} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <input type="hidden" name="desde" value={desde} />

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Usuario</span>
        <input
          type="text"
          name="email"
          required
          autoComplete="username"
          defaultValue="admin"
          placeholder="admin"
          className="w-full rounded-lg border border-white/10 bg-tinta-950/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/30"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          defaultValue="admin"
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-tinta-950/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/30"
        />
      </label>

      {estado?.ok === false && (
        <p className="mb-4 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          {estado.mensaje}
        </p>
      )}

      <BotonEntrar />
    </form>
  );
}