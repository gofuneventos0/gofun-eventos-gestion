import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { archivarAtraccion, archivarPack } from "@/lib/actions/catalogo";
import { getAtracciones, getPacks } from "@/lib/data";
import { euros } from "@/lib/format";
import { labelCategoria } from "@/lib/constantes";
import AtraccionForm from "@/components/atraccion-form";
import PackForm from "@/components/pack-form";
import BotonArchivar from "@/components/boton-archivar";
import { CLASE_BOTON_MARCA, CLASE_BOTON_SUAVE, EncabezadoPagina } from "@/components/ui";

export const metadata = { title: "Catálogo" };

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  const sp = await props.searchParams;
  const atraccionId = typeof sp.atraccion === "string" ? sp.atraccion : null;
  const packId = typeof sp.pack === "string" ? sp.pack : null;
  const nuevaAtraccion = sp.nuevaAtraccion === "1";
  const nuevoPack = sp.nuevoPack === "1";

  const [atracciones, packs] = await Promise.all([getAtracciones(false), getPacks()]);

  // ---------- Formularios ----------
  if (nuevaAtraccion || atraccionId) {
    const a = atraccionId ? (atracciones.find((x) => x.id === atraccionId) ?? null) : null;
    return (
      <>
        <EncabezadoPagina
          titulo={a ? "Editar atracción" : "Nueva atracción"}
          descripcion="Precios de referencia para calcular los eventos"
        />
        <div className="max-w-3xl">
          <AtraccionForm atraccion={a} />
          {a && (
            <div className="mt-4">
              <BotonArchivar id={a.id} accion={archivarAtraccion} etiqueta="Archivar atracción" />
            </div>
          )}
        </div>
      </>
    );
  }

  if (nuevoPack || packId) {
    const p = packId ? (packs.find((x) => x.id === packId) ?? null) : null;
    return (
      <>
        <EncabezadoPagina
          titulo={p ? "Editar pack" : "Nuevo pack"}
          descripcion="Combos con precio cerrado o a consultar"
        />
        <div className="max-w-3xl">
          <PackForm pack={p} />
          {p && (
            <div className="mt-4">
              <BotonArchivar id={p.id} accion={archivarPack} etiqueta="Archivar pack" />
            </div>
          )}
        </div>
      </>
    );
  }

  // ---------- Listado ----------
  const activas = atracciones.filter((a) => a.activa);

  return (
    <>
      <EncabezadoPagina
        titulo="Catálogo"
        descripcion={`${activas.length} atracciones y ${packs.length} packs disponibles`}
        acciones={
          <>
            <Link href="/catalogo?nuevaAtraccion=1" className={CLASE_BOTON_MARCA}>
              <Plus className="h-4 w-4" /> Nueva atracción
            </Link>
            <Link href="/catalogo?nuevoPack=1" className={CLASE_BOTON_SUAVE}>
              <Plus className="h-4 w-4" /> Nuevo pack
            </Link>
          </>
        }
      />

      {/* Atracciones */}
      <h2 className="mb-3 text-base font-bold text-tinta-950">Atracciones</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {activas.map((a) => (
          <div key={a.id} className="tarjeta flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-tinta-950">{a.nombre}</p>
                <p className="mt-0.5 text-xs text-tinta-600">{labelCategoria(a.categoria)}</p>
              </div>
              <Link
                href={`/catalogo?atraccion=${a.id}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-tinta-600 transition hover:bg-gray-50"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-3 text-lg font-extrabold text-tinta-950">
              {a.precio_base ? euros(a.precio_base) : "Incluida en packs"}
            </p>
            <p className="text-xs text-tinta-600">{a.duracion_base}</p>
            {a.descripcion && (
              <p className="mt-2 line-clamp-2 text-xs text-tinta-600">{a.descripcion}</p>
            )}
          </div>
        ))}
      </div>

      {/* Packs */}
      <h2 className="mb-3 mt-8 text-base font-bold text-tinta-950">Packs</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {packs.map((p) => (
          <div key={p.id} className="tarjeta flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-tinta-950">{p.nombre}</p>
              <Link
                href={`/catalogo?pack=${p.id}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-tinta-600 transition hover:bg-gray-50"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
            {p.descripcion && <p className="mt-1 text-xs text-tinta-600">{p.descripcion}</p>}
            <ul className="mt-3 space-y-1 text-sm text-tinta-950">
              {p.incluye.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-bold text-tinta-950">
              {p.precio_base ? euros(p.precio_base) : "Consultar"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
