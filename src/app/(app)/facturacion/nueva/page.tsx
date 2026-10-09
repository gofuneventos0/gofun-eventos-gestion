import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getConfig, getEventos } from "@/lib/data";
import FacturaForm, { type EventoOpcion } from "@/components/factura-form";
import { CLASE_BOTON_MARCA, Vacio } from "@/components/ui";

export const metadata = { title: "Nueva factura" };

export default async function NuevaFacturaPage(props: PageProps<"/facturacion/nueva">) {
  const sp = await props.searchParams;
  const eventoDefecto = typeof sp.evento === "string" ? sp.evento : undefined;

  const [config, eventos] = await Promise.all([getConfig(), getEventos({ limite: 500 })]);

  const opciones: EventoOpcion[] = eventos
    .filter((e) => e.cliente && e.evento_lineas.length > 0)
    .map((e) => ({
      id: e.id,
      titulo: e.titulo,
      fecha: e.fecha,
      cliente: e.cliente
        ? {
            nombre: e.cliente.nombre,
            tipo: e.cliente.tipo,
            retiene_irpf: e.cliente.retiene_irpf,
          }
        : null,
      lineas: e.evento_lineas
        .slice()
        .sort((a, b) => a.orden - b.orden)
        .map((l) => ({
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        })),
    }))
    .filter((e) => e.lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0) > 0)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const defecto =
    eventoDefecto && opciones.some((e) => e.id === eventoDefecto) ? eventoDefecto : undefined;

  return (
    <>
      <Link
        href="/facturacion"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a facturación
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-tinta-950">
        Nueva factura
      </h1>
      <p className="mb-6 text-sm text-tinta-600">
        Las facturas se generan desde los eventos: copian sus líneas y los datos fiscales del
        cliente, aplicando el IVA y la retención de IRPF correspondientes.
      </p>

      {opciones.length === 0 ? (
        <Vacio
          titulo="No hay eventos para facturar"
          descripcion="Necesitas un evento con cliente asignado y al menos una atracción con precio."
          accion={
            <Link href="/eventos" className={CLASE_BOTON_MARCA}>
              Ir a eventos
            </Link>
          }
        />
      ) : (
        <FacturaForm
          eventos={opciones}
          ivaDefecto={config?.iva_defecto || 21}
          irpfDefecto={config?.irpf_defecto || 15}
          serieFacturas={config?.serie_facturas?.trim() || "F"}
          eventoDefecto={defecto}
        />
      )}
    </>
  );
}