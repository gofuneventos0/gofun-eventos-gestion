import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getConfig, getFactura } from "@/lib/data";
import { ESTADOS_FACTURA, labelTipoCliente } from "@/lib/constantes";
import { euros, fechaLarga, fechaNumerica } from "@/lib/format";
import AccionesFactura from "@/components/factura-acciones";

export const metadata = { title: "Factura" };

function Dato(props: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-tinta-600">{props.etiqueta}</dt>
      <dd className="mt-0.5 text-xs text-tinta-950">{props.valor ?? "—"}</dd>
    </div>
  );
}

export default async function FacturaPage(props: PageProps<"/facturacion/[id]">) {
  const { id } = await props.params;
  const [factura, config] = await Promise.all([getFactura(id), getConfig()]);
  if (!factura) notFound();

  const lineas = factura.factura_lineas.slice().sort((a, b) => a.orden - b.orden);
  const esAnulada = factura.estado === "anulada";
  const dirEmpresa = [config?.direccion, config?.poblacion, config?.provincia]
    .filter(Boolean)
    .join(", ");
  const dirCliente = [
    factura.cliente?.direccion,
    factura.cliente?.poblacion,
    factura.cliente?.provincia,
    factura.cliente?.cp,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/facturacion"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a facturación
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Hoja de factura */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
            {esAnulada && (
              <div className="bg-rose-600 px-6 py-2 text-center text-sm font-bold uppercase tracking-widest text-white">
                Anulada
              </div>
            )}
            <div className="p-6 sm:p-8">
              {/* Cabecera: empresa y factura */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
                <div className="space-y-0.5">
                  <p className="text-lg font-extrabold text-tinta-950">
                    {config?.nombre ?? "Go Fun Eventos"}
                  </p>
                  {config?.cif && <p className="text-xs text-tinta-600">CIF/NIF: {config.cif}</p>}
                  {dirEmpresa && <p className="text-xs text-tinta-600">{dirEmpresa}</p>}
                  {config?.telefono && <p className="text-xs text-tinta-600">Tel: {config.telefono}</p>}
                  {config?.email && <p className="text-xs text-tinta-600">{config.email}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tracking-tight text-tinta-950">FACTURA</p>
                  <p className="mt-1 text-sm font-bold text-marca-600">{factura.numero}</p>
                  <p className="text-xs text-tinta-600">Fecha: {fechaNumerica(factura.fecha)}</p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ESTADOS_FACTURA[factura.estado].chip}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ESTADOS_FACTURA[factura.estado].punto}`}
                    />
                    {ESTADOS_FACTURA[factura.estado].label}
                  </span>
                </div>
              </div>

              {/* Cliente y evento */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-tinta-600">
                    Facturado a
                  </p>
                  {factura.cliente ? (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-sm font-semibold text-tinta-950">{factura.cliente.nombre}</p>
                      {factura.cliente.cif_nif && (
                        <p className="text-xs text-tinta-600">
                          CIF/NIF: {factura.cliente.cif_nif}
                        </p>
                      )}
                      <p className="text-xs text-tinta-600">{labelTipoCliente(factura.cliente.tipo)}</p>
                      {factura.cliente.direccion && (
                        <p className="text-xs text-tinta-600">{factura.cliente.direccion}</p>
                      )}
                      {dirCliente && <p className="text-xs text-tinta-600">{dirCliente}</p>}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm text-tinta-600">Sin cliente</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-tinta-600">Evento</p>
                  {factura.evento ? (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-sm font-semibold text-tinta-950">{factura.evento.titulo}</p>
                      <p className="text-xs text-tinta-600">{fechaLarga(factura.evento.fecha)}</p>
                      <Link
                        href={`/eventos/${factura.evento.id}`}
                        className="inline-block text-xs font-semibold text-marca-600 hover:text-marca-500"
                      >
                        Ver evento
                      </Link>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm text-tinta-600">—</p>
                  )}
                </div>
              </div>

              {/* Líneas */}
              <div className="mt-6 overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-tinta-600">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Descripción</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Cant.</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Precio</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineas.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 font-medium text-tinta-950">{l.descripcion}</td>
                        <td className="px-3 py-3 text-center text-tinta-600">{l.cantidad}</td>
                        <td className="px-3 py-3 text-right text-tinta-600">{euros(l.precio_unitario)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-tinta-950">
                          {euros(l.cantidad * l.precio_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-tinta-600">Base imponible</span>
                  <span className="font-medium text-tinta-950">{euros(factura.base_imponible)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-tinta-600">IVA ({factura.iva} %)</span>
                  <span className="font-medium text-tinta-950">{euros(factura.iva_importe)}</span>
                </div>
                {factura.irpf > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-tinta-600">Retención IRPF ({factura.irpf} %)</span>
                    <span className="font-medium text-rose-700">−{euros(factura.irpf_importe)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="font-extrabold text-tinta-950">TOTAL</span>
                  <span className="text-lg font-extrabold text-tinta-950">{euros(factura.total)}</span>
                </div>
              </div>

              {factura.notas && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <Dato etiqueta="Notas" valor={<span className="whitespace-pre-line">{factura.notas}</span>} />
                </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-tinta-600">
                {config?.iban && <p>{config.nombre ?? "Go Fun Eventos"} · IBAN {config.iban}</p>}
                <p className="mt-1">Gracias por confiar en {config?.nombre ?? "Go Fun Eventos"}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones (no aparecen al imprimir) */}
        <div className="w-full shrink-0 lg:w-72 print:hidden">
          <AccionesFactura id={factura.id} estado={factura.estado} />
        </div>
      </div>
    </>
  );
}