"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PartyPopper,
  Settings,
  Users,
  X,
} from "lucide-react";
import { salirSesion } from "@/lib/actions/auth";

const NAV = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/eventos", label: "Eventos", icon: PartyPopper },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/catalogo", label: "Catálogo", icon: Package },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Shell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  async function salir() {
    await salirSesion();
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const activo = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              activo
                ? "bg-marca-500/15 text-marca-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const marca = (
    <Link href="/panel" className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-marca-500 text-sm font-black text-tinta-950">
        GF
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">Go Fun</span>
        <span className="block text-[11px] font-medium uppercase tracking-wider text-marca-400">
          Gestión
        </span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col bg-tinta-950 lg:flex">
        {marca}
        {nav}
        <div className="border-t border-white/5 p-4">
          <p className="truncate text-xs text-slate-500">{email ?? "Sesión activa"}</p>
          <button
            onClick={salir}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-tinta-950 px-4 py-3 lg:hidden">
        <Link href="/panel" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-500 text-xs font-black text-tinta-950">
            GF
          </span>
          <span className="text-sm font-bold text-white">Go Fun Gestión</span>
        </Link>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          aria-label="Abrir menú"
        >
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-20 bg-tinta-950/95 pt-14 lg:hidden">
          <div className="flex h-full flex-col">
            {nav}
            <div className="border-t border-white/5 p-4">
              <button
                onClick={salir}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
