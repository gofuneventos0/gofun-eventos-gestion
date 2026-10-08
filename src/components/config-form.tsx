"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "@/lib/actions/configuracion";
import type { EmpresaConfig } from "@/lib/types";
import { PROVINCIAS_CLM } from "@/lib/constantes";
import { Aviso, Campo, CLASE_BOTON_MARCA, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

export default function ConfigForm({ config }: { config: EmpresaConfig | null }) {
  const [estado, accion] = useActionState(guardarConfiguracion, null);

  return (
    <form action={accion} className="space-y-6">
      {estado && <Aviso tono={estado.ok ? "ok" : "error"}>{estado.mensaje}</Aviso>}

      <section className="tarjeta p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Datos fiscales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Razón social" className="sm:col-span-2">
            <input name="nombre" defaultValue={config?.nombre ?? "Go Fun Eventos"} className={CLASE_INPUT} />
          </Campo>
          <Campo label="CIF">
            <input name="cif" defaultValue={config?.cif ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="Teléfono">
            <input name="telefono" defaultValue={config?.telefono ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="Correo">
            <input type="email" name="email" defaultValue={config?.email ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="IBAN">
            <input name="iban" defaultValue={config?.iban ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="Dirección" className="sm:col-span-2">
            <input name="direccion" defaultValue={config?.direccion ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="Población">
            <input name="poblacion" defaultValue={config?.poblacion ?? ""} className={CLASE_INPUT} />
          </Campo>
          <Campo label="Provincia">
            <select name="provincia" defaultValue={config?.provincia ?? "Ciudad Real"} className={CLASE_INPUT}>
              {PROVINCIAS_CLM.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </section>

      <section className="tarjeta p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Impuestos y facturación
        </h2>
        <p className="mb-4 text-xs text-tinta-600">
          Como S.L. emites con IVA y sin retención propia. La retención de IRPF se aplica sólo
          cuando el cliente es empresa o administración (se configura en cada cliente).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="IVA por defecto (%)">
            <input
              type="number"
              name="iva_defecto"
              step={0.01}
              defaultValue={config?.iva_defecto ?? 21}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="IRPF por defecto (%)">
            <input
              type="number"
              name="irpf_defecto"
              step={0.01}
              defaultValue={config?.irpf_defecto ?? 0}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Serie de facturas">
            <input
              name="serie_facturas"
              defaultValue={config?.serie_facturas ?? "F"}
              className={CLASE_INPUT}
            />
          </Campo>
        </div>
      </section>

      <section className="tarjeta p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Suplementos por duración
        </h2>
        <p className="mb-4 text-xs text-tinta-600">
          Se suman automáticamente al precio base de cada atracción al elegir 5 h u 8 h.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Suplemento 5 h (€)">
            <input
              type="number"
              name="suplemento_5h"
              step={0.01}
              defaultValue={config?.suplemento_5h ?? 25}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Suplemento 8 h (€)">
            <input
              type="number"
              name="suplemento_8h"
              step={0.01}
              defaultValue={config?.suplemento_8h ?? 55}
              className={CLASE_INPUT}
            />
          </Campo>
        </div>
      </section>

      <div className="flex justify-end">
        <BotonEnviar className={CLASE_BOTON_MARCA}>Guardar configuración</BotonEnviar>
      </div>
    </form>
  );
}
