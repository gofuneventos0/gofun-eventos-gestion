"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarPack } from "@/lib/actions/catalogo";
import type { Pack } from "@/lib/types";
import { Aviso, Campo, CLASE_BOTON, CLASE_BOTON_MARCA, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

export default function PackForm({ pack }: { pack?: Pack | null }) {
  const [estado, accion] = useActionState(guardarPack, null);

  return (
    <form action={accion} className="tarjeta space-y-4 p-5">
      {pack && <input type="hidden" name="id" value={pack.id} />}

      <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
        {pack ? "Editar pack" : "Nuevo pack"}
      </h2>

      {estado && <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre *" className="sm:col-span-2">
          <input
            name="nombre"
            required
            defaultValue={pack?.nombre ?? ""}
            placeholder="Pack Verano"
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Precio (opcional)" ayuda="Si lo dejas vacío se muestra como «Consultar».">
          <input
            type="number"
            name="precio_base"
            min={0}
            step={0.01}
            defaultValue={pack?.precio_base ?? ""}
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Orden">
          <input type="number" name="orden" defaultValue={pack?.orden ?? 99} className={CLASE_INPUT} />
        </Campo>

        <Campo label="Qué incluye" ayuda="Un elemento por línea." className="sm:col-span-2">
          <textarea
            name="incluye"
            rows={4}
            defaultValue={(pack?.incluye ?? []).join("\n")}
            placeholder={"🧼 Cañón de Espuma\n🏰 Deslizador Acuático"}
            className={CLASE_INPUT}
          />
        </Campo>

        <Campo label="Descripción" className="sm:col-span-2">
          <textarea
            name="descripcion"
            rows={2}
            defaultValue={pack?.descripcion ?? ""}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Link href="/catalogo" className={CLASE_BOTON}>
          Cancelar
        </Link>
        <BotonEnviar className={CLASE_BOTON_MARCA}>
          {pack ? "Guardar cambios" : "Crear pack"}
        </BotonEnviar>
      </div>
    </form>
  );
}
