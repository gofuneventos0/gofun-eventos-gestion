"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { borrarCobro, borrarGasto } from "@/lib/actions/tesoreria";
import type { Movimiento } from "@/lib/types";
import { labelCategoriaGasto, labelMetodo } from "@/lib/constantes";
import { euros, fechaCorta } from "@/lib/format";

export default function MovimientoFila({ movimiento }: { movimiento: Movimiento }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function eliminar() {
    setConfirmando(false);
    startTransition(async () => {
      if (movimiento.tipo === "cobro") {
        await borrarCobro(movimiento.id, movimiento.evento_id ?? undefined);
      } else {
        await borrarGasto(movimiento.id);
      }
      router.refresh();
    });
  }

  const esCobro = movimiento.tipo === "cobro";
  const meta = [
    esCobro && (movimiento.evento_titulo ?? movimiento.cliente_nombre),
    !esCobro && movimiento.categoria ? labelCategoriaGasto(movimiento.categoria) : null,
    labelMetodo(movimiento.metodo),
    !esCobro && movimiento.referencia ? `Factura ${movimiento.referencia}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          esCobro ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
        }`}
      >
        {esCobro ? (
          <ArrowDownRight className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-tinta-950">{movimiento.concepto}</p>
        <p className="truncate text-xs text-tinta-600">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {fechaCorta(movimiento.fecha)}
          </span>
          {movimiento.cuenta_nombre !== "—" && ` · ${movimiento.cuenta_nombre}`}
          {meta && ` · ${meta}`}
        </p>
      </div>

      <p
        className={`shrink-0 text-sm font-bold ${
          esCobro ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        {esCobro ? "+" : "−"} {euros(movimiento.importe)}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/tesoreria?accion=${movimiento.tipo}&editar=${movimiento.id}`}
          className="rounded-lg p-1.5 text-tinta-600 transition hover:bg-gray-100 hover:text-tinta-950"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        {confirmando ? (
          <span className="flex items-center gap-1 text-xs">
            <button
              onClick={eliminar}
              disabled={pendiente}
              className="rounded-lg bg-rose-600 px-2 py-1 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {pendiente ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sí, borrar"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="rounded-lg px-1.5 py-1 font-medium text-tinta-600 hover:bg-gray-100"
            >
              No
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="rounded-lg p-1.5 text-tinta-600 transition hover:bg-rose-50 hover:text-rose-700"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}