"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { guardarEvento } from "@/lib/actions/eventos";
import type { Atraccion, Cliente, DuracionEvento, EventoCompleto } from "@/lib/types";
import {
  CATEGORIAS,
  DURACIONES,
  EJEMPLOS_COMBOS,
  PROVINCIAS_CLM,
  TIPOS_EVENTO,
  ZONAS,
  labelCategoria,
} from "@/lib/constantes";
import { euros, hoyISO } from "@/lib/format";
import { Aviso, Campo, CLASE_BOTON, CLASE_BOTON_MARCA, CLASE_BOTON_SUAVE, CLASE_INPUT } from "@/components/ui";
import BotonEnviar from "@/components/boton-enviar";

interface Linea {
  clave: string;
  atraccion_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  manual: boolean;
}

function nuevaLinea(): Linea {
  return {
    clave: Math.random().toString(36).slice(2),
    atraccion_id: "",
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
    manual: false,
  };
}

export default function EventoForm({
  clientes,
  atracciones,
  evento,
  fechaInicial,
  suplementos,
}: {
  clientes: Cliente[];
  atracciones: Atraccion[];
  evento?: EventoCompleto | null;
  fechaInicial?: string;
  suplementos: { cinco: number; ocho: number };
}) {
  const [estado, accion] = useActionState(guardarEvento, null);

  const [duracion, setDuracion] = useState<DuracionEvento>(
    (evento?.duracion_horas as DuracionEvento) ?? "3-4 h"
  );
  const [lineas, setLineas] = useState<Linea[]>(
    evento?.evento_lineas?.length
      ? evento.evento_lineas.map((l, i) => ({
          clave: `inicial-${i}`,
          atraccion_id: l.atraccion_id ?? "",
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: Number(l.precio_unitario),
          manual: true,
        }))
      : [nuevaLinea()]
  );

  /** Precio sugerido = precio base + suplemento por duración. */
  function precioSugerido(atraccionId: string, dur: DuracionEvento): number {
    const a = atracciones.find((x) => x.id === atraccionId);
    if (!a?.precio_base) return 0;
    const extra = dur === "5 h" ? suplementos.cinco : dur === "8 h" ? suplementos.ocho : 0;
    return Number(a.precio_base) + extra;
  }

  function actualizarLinea(clave: string, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));
  }

  function alSeleccionarAtraccion(clave: string, atraccionId: string) {
    const a = atracciones.find((x) => x.id === atraccionId);
    actualizarLinea(clave, {
      atraccion_id: atraccionId,
      descripcion: a?.nombre ?? "",
      precio_unitario: precioSugerido(atraccionId, duracion),
      manual: false,
    });
  }

  function alCambiarDuracion(dur: DuracionEvento) {
    setDuracion(dur);
    // Recalcula sólo las líneas que no se han tocado a mano.
    setLineas((prev) =>
      prev.map((l) =>
        l.manual || !l.atraccion_id
          ? l
          : { ...l, precio_unitario: precioSugerido(l.atraccion_id, dur) }
      )
    );
  }

  const total = useMemo(
    () => lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0),
    [lineas]
  );

  const lineasParaEnviar = lineas
    .filter((l) => l.descripcion.trim().length)
    .map((l) => ({
      atraccion_id: l.atraccion_id || null,
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad) || 1,
      precio_unitario: Number(l.precio_unitario) || 0,
    }));

  return (
    <form action={accion} className="space-y-6">
      {evento && <input type="hidden" name="id" value={evento.id} />}
      <input type="hidden" name="lineas" value={JSON.stringify(lineasParaEnviar)} />

      {estado && !estado.ok && <Aviso tono="error">{estado.mensaje}</Aviso>}

      {/* ---------- Evento ---------- */}
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Datos del evento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Título *" className="sm:col-span-2">
            <input
              name="titulo"
              required
              defaultValue={evento?.titulo ?? ""}
              placeholder="Cumpleaños de Lucía en el parque"
              className={CLASE_INPUT}
            />
          </Campo>

          <Campo label="Cliente">
            <select name="cliente_id" defaultValue={evento?.cliente_id ?? ""} className={CLASE_INPUT}>
              <option value="">— Sin cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.poblacion ? ` · ${c.poblacion}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-tinta-600">
              ¿Cliente nuevo?{" "}
              <Link href="/clientes" className="font-medium text-marca-600 underline">
                Créalo en Clientes
              </Link>
            </span>
          </Campo>

          <Campo label="Tipo de evento">
            <select name="tipo" defaultValue={evento?.tipo ?? "particular"} className={CLASE_INPUT}>
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Fecha *">
            <input
              type="date"
              name="fecha"
              required
              defaultValue={evento?.fecha ?? fechaInicial ?? hoyISO()}
              className={CLASE_INPUT}
            />
          </Campo>

          <Campo label="Estado">
            <select name="estado" defaultValue={evento?.estado ?? "borrador"} className={CLASE_INPUT}>
              <option value="borrador">Borrador</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cobrado">Cobrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Campo>
        </div>
      </section>

      {/* ---------- Ubicación ---------- */}
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Ubicación e itinerario
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Dirección del montaje" className="sm:col-span-2">
            <input
              name="direccion"
              defaultValue={evento?.direccion ?? ""}
              placeholder="Calle, número, recinto…"
              className={CLASE_INPUT}
            />
          </Campo>

          <Campo label="Población">
            <input
              name="poblacion"
              defaultValue={evento?.poblacion ?? ""}
              placeholder="Almagro"
              className={CLASE_INPUT}
            />
          </Campo>

          <Campo label="Provincia">
            <select
              name="provincia"
              defaultValue={evento?.provincia ?? "Ciudad Real"}
              className={CLASE_INPUT}
            >
              {PROVINCIAS_CLM.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Zona de cobertura" className="sm:col-span-2">
            <select name="zona" defaultValue={evento?.zona ?? "almagro_30km"} className={CLASE_INPUT}>
              {ZONAS.map((z) => (
                <option key={z.valor} value={z.valor}>
                  {z.label} — {z.detalle}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </section>

      {/* ---------- Horario ---------- */}
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
          Horario del día
        </h2>
        <p className="mb-4 text-xs text-tinta-600">
          Salida del almacén → montaje en destino → inicio del evento → fin.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Salida">
            <input
              type="time"
              name="hora_salida"
              defaultValue={evento?.hora_salida?.slice(0, 5) ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Montaje">
            <input
              type="time"
              name="hora_montaje"
              defaultValue={evento?.hora_montaje?.slice(0, 5) ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Inicio">
            <input
              type="time"
              name="hora_inicio"
              defaultValue={evento?.hora_inicio?.slice(0, 5) ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Fin">
            <input
              type="time"
              name="hora_fin"
              defaultValue={evento?.hora_fin?.slice(0, 5) ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
        </div>
      </section>

      {/* ---------- Atracciones ---------- */}
      <section className="tarjeta p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
            Atracciones contratadas
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-tinta-600">Duración</label>
            <select
              name="duracion_horas"
              value={duracion}
              onChange={(e) => alCambiarDuracion(e.target.value as DuracionEvento)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
            >
              {DURACIONES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {lineas.map((l) => (
            <div key={l.clave} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="mb-1 block text-xs font-medium text-tinta-600">Atracción</label>
                  <select
                    value={l.atraccion_id}
                    onChange={(e) => alSeleccionarAtraccion(l.clave, e.target.value)}
                    className={CLASE_INPUT}
                  >
                    <option value="">— Personalizada —</option>
                    {CATEGORIAS.map((cat) => {
                      const items = atracciones.filter((a) => a.categoria === cat.valor);
                      if (!items.length) return null;
                      return (
                        <optgroup key={cat.valor} label={labelCategoria(cat.valor)}>
                          {items.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nombre}
                              {a.precio_base ? ` · ${euros(a.precio_base)}` : " · incluida en packs"}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="mb-1 block text-xs font-medium text-tinta-600">
                    Descripción
                  </label>
                  <input
                    value={l.descripcion}
                    onChange={(e) => actualizarLinea(l.clave, { descripcion: e.target.value })}
                    placeholder="Ej. Castillo + toro mecánico"
                    className={CLASE_INPUT}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-tinta-600">Cant.</label>
                  <input
                    type="number"
                    min={1}
                    value={l.cantidad}
                    onChange={(e) =>
                      actualizarLinea(l.clave, { cantidad: Number(e.target.value) })
                    }
                    className={CLASE_INPUT}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-tinta-600">Precio ud.</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.precio_unitario}
                    onChange={(e) =>
                      actualizarLinea(l.clave, {
                        precio_unitario: Number(e.target.value),
                        manual: true,
                      })
                    }
                    className={CLASE_INPUT}
                  />
                </div>

                <div className="flex items-end justify-between gap-2 sm:col-span-1">
                  <div className="flex-1 sm:hidden">
                    <span className="block text-xs font-medium text-tinta-600">Subtotal</span>
                    <span className="text-sm font-bold">
                      {euros(l.cantidad * l.precio_unitario)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLineas((prev) => prev.filter((x) => x.clave !== l.clave))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-rose-600 transition hover:bg-rose-50"
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="hidden items-end sm:col-span-12 sm:flex sm:justify-end">
                  <span className="text-sm text-tinta-600">
                    Subtotal:&nbsp;
                    <strong className="text-tinta-950">{euros(l.cantidad * l.precio_unitario)}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setLineas((prev) => [...prev, nuevaLinea()])}
            className={CLASE_BOTON_SUAVE}
          >
            <Plus className="h-4 w-4" /> Añadir atracción
          </button>
          <p className="text-sm text-tinta-600">
            Total:&nbsp;
            <span className="text-lg font-extrabold text-tinta-950">{euros(total)}</span>
          </p>
        </div>

        <p className="mt-3 text-xs text-tinta-600">
          Precios de referencia 3-4 h. Los suplementos por duración se aplican solos; puedes
          editarlos a mano. Ejemplos publicados: {EJEMPLOS_COMBOS.join(" · ")}.
        </p>
      </section>

      {/* ---------- Notas ---------- */}
      <section className="tarjeta p-5">
        <Campo label="Notas internas">
          <textarea
            name="notas"
            rows={3}
            defaultValue={evento?.notas ?? ""}
            placeholder="Detalles de montaje, contacto en destino, necesidades especiales…"
            className={CLASE_INPUT}
          />
        </Campo>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={evento ? `/eventos/${evento.id}` : "/eventos"} className={CLASE_BOTON}>
          Cancelar
        </Link>
        <BotonEnviar className={CLASE_BOTON_MARCA}>
          {evento ? "Guardar cambios" : "Crear evento"}
        </BotonEnviar>
      </div>
    </form>
  );
}
