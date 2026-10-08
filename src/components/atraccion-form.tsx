"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarAtraccion } from "@/lib/actions/catalogo";
import type { Atraccion } from "@/lib/types";
import { CATEGORIAS } from "@/lib/constantes";
import { Aviso, Campo, CLASE_BOTON, CLASE_BOTON_MARCA, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

export default function AtraccionForm({ atraccion }: { atraccion?: Atraccion | null }) {
  const [estado, accion] = useActionState(guardarAtraccion, null);

  return (
    <form action={accion} className="tarjeta space-y-4 p-5">
      {atraccion && <input type="hidden" name="id" value={atraccion.id} />}

      <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
        {atraccion ? "Editar atracción" : "Nueva atracción"}
      </h2>

      {estado && <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre *" className="sm:col-span-2">
          <input
            name="nombre"
            required
            defaultValue={atraccion?.nombre ?? ""}
            placeholder="Ej. Castillo hinchable gigante"
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Categoría">
          <select
            name="categoria"
            defaultValue={atraccion?.categoria ?? "infantil"}
            className={CLASE_INPUT}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Precio base (3-4 h)" ayuda="Déjalo vacío si solo se ofrece dentro de packs.">
          <input
            type="number"
            name="precio_base"
            min={0}
            step={0.01}
            defaultValue={atraccion?.precio_base ?? ""}
            placeholder="150"
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Duración base">
          <input
            name="duracion_base"
            defaultValue={atraccion?.duracion_base ?? "3-4 h"}
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Orden en el catálogo">
          <input
            type="number"
            name="orden"
            defaultValue={atraccion?.orden ?? 99}
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Descripción" className="sm:col-span-2">
          <textarea
            name="descripcion"
            rows={2}
            defaultValue={atraccion?.descripcion ?? ""}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
        <input
          type="checkbox"
          name="incluida_en_packs"
          defaultChecked={atraccion?.incluida_en_packs ?? false}
          className="h-4 w-4 rounded border-gray-300 text-marca-600 focus:ring-marca-500"
        />
        <span className="text-sm text-tinta-950">
          Incluida en packs (equipo de música, zona de juegos…)
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Link href="/catalogo" className={CLASE_BOTON}>
          Cancelar
        </Link>
        <BotonEnviar className={CLASE_BOTON_MARCA}>
          {atraccion ? "Guardar cambios" : "Crear atracción"}
        </BotonEnviar>
      </div>
    </form>
  );
}
