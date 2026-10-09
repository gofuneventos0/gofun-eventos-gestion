import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  HandCoins,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlusCircle,
  Receipt,
  User,
} from "lucide-react";
import { getCobrosEvento, getEvento, getFacturaEvento } from "@/lib/data";
import { euros, fechaCorta, fechaLarga, hora } from "@/lib/format";
import { ESTADOS_FACTURA, labelTipoCliente, labelZona } from "@/lib/constantes";
import { CLASE_BOTON_MARCA, CLASE_BOTON_SUAVE, EtiquetaEstado, Tarjeta } from "@/components/ui";
import AccionesEvento from "@/components/acciones-evento";

export const metadata = { title: "Detalle del evento" };

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-tinta-600">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-medium text-tinta-950">{valor ?? "—"}</dd>
    </div>
  );
}

export default async function EventoPage(props: PageProps<"/eventos/[id]">) {
  const { id } = await props.params;
  const evento = await getEvento(id);
  if (!evento) notFound();

  const totalLineas = evento.evento_lineas
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .reduce((s, l) => s + l.cantidad * Number(l.precio_unitario), 0);

  const importeRef = Number(evento.importe_total) > 0 ? Number(evento.importe_total) : totalLineas;

  const [cobros, factura] = await Promise.all([getCobrosEvento(id), getFacturaEvento(id)]);
  const cobrado = cobros.reduce((s, c) => s + c.importe, 0);
  const pendiente = Math.max(0, importeRef - cobrado);
  const pctCobrado = importeRef > 0 ? Math.min(100, Math.round((cobrado / importeRef) * 100)) : 0;

  return (
    <>
      <Link
        href="/eventos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a eventos
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-tinta-950">
              {evento.titulo}
            </h1>
            <EtiquetaEstado estado={evento.estado} />
          </div>
          <p className="mt-1 text-sm capitalize text-tinta-600">
            {fechaLarga(evento.fecha)} · {evento.tipo}
          </p>
        </div>
        <Link href={`/eventos/${evento.id}/editar`} className={CLASE_BOTON_SUAVE}>
          <Pencil className="h-4 w-4" /> Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Montaje y horario */}
          <Tarjeta className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Montaje y horario
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato
                etiqueta="Dirección"
                valor={
                  evento.direccion ? (
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tinta-600" />
                      {evento.direccion}
                    </span>
                  ) : (
                    "Sin dirección"
                  )
                }
              />
              <Dato
                etiqueta="Población"
                valor={
                  [evento.poblacion, evento.provincia].filter(Boolean).join(", ") || "—"
                }
              />
              <Dato etiqueta="Zona" valor={labelZona(evento.zona)} />
              <Dato etiqueta="Duración" valor={evento.duracion_horas} />
              <Dato etiqueta="Salida del almacén" valor={hora(evento.hora_salida)} />
              <Dato etiqueta="Montaje" valor={hora(evento.hora_montaje)} />
              <Dato etiqueta="Inicio" valor={hora(evento.hora_inicio)} />
              <Dato etiqueta="Fin" valor={hora(evento.hora_fin)} />
            </dl>
          </Tarjeta>

          {/* Atracciones */}
          <Tarjeta className="overflow-hidden">
            <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Atracciones contratadas
            </h2>
            {evento.evento_lineas.length === 0 ? (
              <p className="px-5 py-6 text-sm text-tinta-600">
                No hay atracciones añadidas a este evento.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-tinta-600">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">Atracción</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Cant.</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Precio</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {evento.evento_lineas
                      .slice()
                      .sort((a, b) => a.orden - b.orden)
                      .map((l) => (
                        <tr key={l.id}>
                          <td className="px-5 py-3 font-medium text-tinta-950">{l.descripcion}</td>
                          <td className="px-3 py-3 text-center text-tinta-600">{l.cantidad}</td>
                          <td className="px-3 py-3 text-right text-tinta-600">
                            {euros(l.precio_unitario)}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-tinta-950">
                            {euros(l.cantidad * Number(l.precio_unitario))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-right font-semibold text-tinta-600">
                        Total
                      </td>
                      <td className="px-5 py-3 text-right text-lg font-extrabold text-tinta-950">
                        {euros(totalLineas)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Tarjeta>

          {evento.notas && (
            <Tarjeta className="p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-tinta-600">
                Notas internas
              </h2>
              <p className="whitespace-pre-line text-sm text-tinta-950">{evento.notas}</p>
            </Tarjeta>
          )}
        </div>

        <div className="space-y-6">
          {/* Cliente */}
          <Tarjeta className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Cliente
            </h2>
            {evento.cliente ? (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 font-semibold text-tinta-950">
                  <User className="h-4 w-4 text-tinta-600" />
                  {evento.cliente.nombre}
                </p>
                <p className="text-xs text-tinta-600">
                  {labelTipoCliente(evento.cliente.tipo)}
                  {evento.cliente.retiene_irpf && " · retiene 15% IRPF"}
                </p>
                {evento.cliente.telefono && (
                  <p className="flex items-center gap-2 text-tinta-950">
                    <Phone className="h-4 w-4 text-tinta-600" />
                    <a href={`tel:${evento.cliente.telefono}`} className="hover:underline">
                      {evento.cliente.telefono}
                    </a>
                  </p>
                )}
                <Link
                  href={`/clientes?q=${encodeURIComponent(evento.cliente.nombre)}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-marca-600 hover:text-marca-500"
                >
                  <Mail className="h-3.5 w-3.5" /> Ver ficha del cliente
                </Link>
              </div>
            ) : (
              <p className="text-sm text-tinta-600">
                Este evento no tiene cliente asignado todavía.
              </p>
            )}
          </Tarjeta>

          <AccionesEvento id={evento.id} estado={evento.estado} />

          {/* Facturación */}
          <Tarjeta className="p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Facturación
            </h2>
            {factura ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-tinta-950">{factura.numero}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ESTADOS_FACTURA[factura.estado].chip}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ESTADOS_FACTURA[factura.estado].punto}`}
                    />
                    {ESTADOS_FACTURA[factura.estado].label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-tinta-600">
                  {fechaCorta(factura.fecha)} · {euros(factura.total)}
                </p>
                <Link
                  href={`/facturacion/${factura.id}`}
                  className={`${CLASE_BOTON_SUAVE} mt-3 w-full`}
                >
                  <Receipt className="h-4 w-4" /> Ver factura
                </Link>
              </>
            ) : !evento.cliente ? (
              <>
                <p className="text-sm text-tinta-600">
                  Añade un cliente al evento para poder facturarlo.
                </p>
                <Link
                  href={`/eventos/${evento.id}/editar`}
                  className={`${CLASE_BOTON_SUAVE} mt-3 w-full`}
                >
                  <Pencil className="h-4 w-4" /> Editar evento
                </Link>
              </>
            ) : totalLineas === 0 ? (
              <>
                <p className="text-sm text-tinta-600">
                  Añade atracciones con precio para poder generar la factura.
                </p>
                <Link
                  href={`/eventos/${evento.id}/editar`}
                  className={`${CLASE_BOTON_SUAVE} mt-3 w-full`}
                >
                  <Pencil className="h-4 w-4" /> Editar evento
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-tinta-600">
                  Genera la factura con IVA {`${evento.cliente.retiene_irpf ? "y retención de IRPF" : "sin retención"}`} según
                  el cliente.
                </p>
                <Link
                  href={`/facturacion/nueva?evento=${evento.id}`}
                  className={`${CLASE_BOTON_MARCA} mt-3 w-full`}
                >
                  <PlusCircle className="h-4 w-4" /> Generar factura
                </Link>
              </>
            )}
          </Tarjeta>

          {/* Cobros */}
          <Tarjeta className="p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tinta-600">
              Cobros del evento
            </h2>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-tinta-600">Total</span>
              <span className="text-lg font-extrabold text-tinta-950">{euros(importeRef)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm text-tinta-600">Cobrado</span>
              <span className="text-sm font-bold text-emerald-700">{euros(cobrado)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm text-tinta-600">Pendiente</span>
              <span
                className={`text-sm font-bold ${
                  pendiente > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {euros(pendiente)}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  pendiente > 0 ? "bg-marca-500" : "bg-emerald-500"
                }`}
                style={{ width: `${pctCobrado}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-tinta-600">{pctCobrado}% cobrado</p>

            <Link
              href={`/tesoreria?accion=cobro&evento=${evento.id}`}
              className={`${CLASE_BOTON_SUAVE} mt-3 w-full`}
            >
              <HandCoins className="h-4 w-4" /> Registrar cobro
            </Link>

            {cobros.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {cobros.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-tinta-600">
                      {fechaCorta(c.fecha)} · {c.concepto}
                    </span>
                    <span className="shrink-0 font-semibold text-emerald-700">
                      {euros(c.importe)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
