import Link from "next/link";
import { Download, Plus, Search, UserPlus, Users } from "lucide-react";
import { getCliente, getClientes } from "@/lib/data";
import { iniciales } from "@/lib/format";
import { labelTipoCliente } from "@/lib/constantes";
import ClienteForm from "@/components/cliente-form";
import { CLASE_BOTON_MARCA, CLASE_BOTON_SUAVE, CLASE_INPUT, EncabezadoPagina, Vacio } from "@/components/ui";

export const metadata = { title: "Clientes" };

export default async function ClientesPage(props: PageProps<"/clientes">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const nuevo = sp.nuevo === "1";
  const editarId = typeof sp.editar === "string" ? sp.editar : null;

  const enFormulario = nuevo || Boolean(editarId);

  if (enFormulario) {
    const cliente = editarId ? await getCliente(editarId) : null;
    return (
      <>
        <EncabezadoPagina
          titulo={cliente ? "Editar cliente" : "Nuevo cliente"}
          descripcion="Datos de contacto y facturación"
        />
        <div className="max-w-3xl">
          <ClienteForm cliente={cliente} />
        </div>
      </>
    );
  }

  const clientes = await getClientes(q);

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion={`${clientes.length} contacto(s) en cartera`}
        acciones={
          <>
            <Link
              href={`/api/exportar/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className={CLASE_BOTON_SUAVE}
              title="Descargar cartera en CSV"
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Link>
            <Link href="/clientes?nuevo=1" className={CLASE_BOTON_MARCA}>
              <UserPlus className="h-4 w-4" /> Nuevo cliente
            </Link>
          </>
        }
      />

      <form className="relative mb-5 sm:w-80" action="/clientes" method="get">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o pueblo…"
          className={`${CLASE_INPUT} pl-9`}
        />
      </form>

      {clientes.length === 0 ? (
        <Vacio
          titulo={q ? "Sin resultados" : "Todavía no hay clientes"}
          descripcion="Guarda aquí a quien le alquilas las atracciones para reutilizarlo en cada evento."
          accion={
            <Link href="/clientes?nuevo=1" className={CLASE_BOTON_MARCA}>
              <Plus className="h-4 w-4" /> Añadir cliente
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes?editar=${c.id}`}
              className="tarjeta flex items-start gap-3 p-4 transition hover:border-marca-500/50 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tinta-950 text-sm font-bold text-white">
                {iniciales(c.nombre)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-tinta-950">{c.nombre}</p>
                <p className="mt-0.5 text-xs text-tinta-600">{labelTipoCliente(c.tipo)}</p>
                <p className="mt-1 truncate text-sm text-tinta-600">
                  {c.telefono ?? c.email ?? c.poblacion ?? "Sin contacto"}
                </p>
                {c.retiene_irpf && (
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Retiene IRPF 15%
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-tinta-600">
        <Users className="h-3.5 w-3.5" />
        Los clientes archivados se conservan para no perder el histórico de eventos.
      </p>
    </>
  );
}
