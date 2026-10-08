"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { borrarCliente, guardarCliente } from "@/lib/actions/clientes";
import type { Cliente } from "@/lib/types";
import { PROVINCIAS_CLM, TIPOS_CLIENTE } from "@/lib/constantes";
import {
  Aviso,
  Campo,
  CLASE_BOTON,
  CLASE_BOTON_MARCA,
  CLASE_BOTON_SUAVE,
  CLASE_INPUT,
} from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

export default function ClienteForm({ cliente }: { cliente?: Cliente | null }) {
  const [estado, accion] = useActionState(guardarCliente, null);
  const router = useRouter();
  const [archivando, startArchive] = useTransition();
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const [tipo, setTipo] = useState(cliente?.tipo ?? "particular");
  const [retiene, setRetiene] = useState(cliente?.retiene_irpf ?? false);

  const meta = TIPOS_CLIENTE.find((t) => t.valor === tipo);

  function alCambiarTipo(nuevo: (typeof TIPOS_CLIENTE)[number]["valor"]) {
    setTipo(nuevo);
    const m = TIPOS_CLIENTE.find((t) => t.valor === nuevo);
    setRetiene(m?.retiene ?? false);
  }

  function archivar() {
    if (!cliente) return;
    setErrorArchivo(null);
    startArchive(async () => {
      const res = await borrarCliente(cliente.id);
      if (!res.ok) {
        setErrorArchivo(res.mensaje ?? "No se pudo archivar.");
        return;
      }
      router.push("/clientes");
      router.refresh();
    });
  }

  return (
    <form action={accion} className="tarjeta space-y-4 p-5">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
        {cliente ? "Editar cliente" : "Nuevo cliente"}
      </h2>

      {estado && (
        <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>
      )}
      {errorArchivo && <Aviso tono="error">{errorArchivo}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre o razón social *" className="sm:col-span-2">
          <input
            name="nombre"
            required
            defaultValue={cliente?.nombre ?? ""}
            placeholder="Ej. Ayuntamiento de Almagro / María López"
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Tipo">
          <select
            name="tipo"
            value={tipo}
            onChange={(e) =>
              alCambiarTipo(e.target.value as (typeof TIPOS_CLIENTE)[number]["valor"])
            }
            className={CLASE_INPUT}
          >
            {TIPOS_CLIENTE.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="CIF / NIF">
          <input name="cif_nif" defaultValue={cliente?.cif_nif ?? ""} className={CLASE_INPUT} />
        </Campo>

        <Campo label="Teléfono">
          <input
            name="telefono"
            inputMode="tel"
            defaultValue={cliente?.telefono ?? ""}
            placeholder="600 000 000"
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Correo electrónico">
          <input
            type="email"
            name="email"
            defaultValue={cliente?.email ?? ""}
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Dirección" className="sm:col-span-2">
          <input name="direccion" defaultValue={cliente?.direccion ?? ""} className={CLASE_INPUT} />
        </Campo>

        <Campo label="Población">
          <input name="poblacion" defaultValue={cliente?.poblacion ?? ""} className={CLASE_INPUT} />
        </Campo>

        <Campo label="Código postal">
          <input name="cp" defaultValue={cliente?.cp ?? ""} className={CLASE_INPUT} />
        </Campo>

        <Campo label="Provincia">
          <select
            name="provincia"
            defaultValue={cliente?.provincia ?? "Ciudad Real"}
            className={CLASE_INPUT}
          >
            {PROVINCIAS_CLM.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Notas" className="sm:col-span-2">
          <textarea
            name="notas"
            rows={2}
            defaultValue={cliente?.notas ?? ""}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
        <input
          type="checkbox"
          name="retiene_irpf"
          checked={retiene}
          onChange={(e) => setRetiene(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-marca-600 focus:ring-marca-500"
        />
        <span className="text-sm">
          <span className="font-medium text-tinta-950">Este cliente retiene IRPF (15%)</span>
          <span className="mt-0.5 block text-xs text-tinta-600">
            {meta?.ayuda}
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {cliente ? (
          <button
            type="button"
            onClick={archivar}
            disabled={archivando}
            className={`${CLASE_BOTON_SUAVE} !text-rose-600`}
          >
            {archivando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Archivar
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/clientes" className={CLASE_BOTON}>
            Cancelar
          </Link>
          <BotonEnviar className={CLASE_BOTON_MARCA}>
            {cliente ? "Guardar cambios" : "Crear cliente"}
          </BotonEnviar>
        </div>
      </div>
    </form>
  );
}
