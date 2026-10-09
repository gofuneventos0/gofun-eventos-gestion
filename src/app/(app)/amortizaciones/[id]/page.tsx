import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getBienInversion } from "@/lib/data";
import { calcularTablaAmortizacion } from "@/lib/amortizacion";
import { labelTipoBien } from "@/lib/constantes";
import { euros, fechaNumerica } from "@/lib/format";
import TablaAmortizacion from "@/components/tabla-amortizacion";
import BotonPdfAmortizacion from "@/components/boton-pdf-amortizacion";
import BotonImprimir from "@/components/boton-imprimir";
import AccionesBien from "@/components/bien-acciones";
import { CLASE_BOTON_SUAVE, Tarjeta } from "@/components/ui";

export const metadata = { title: "Amortización del bien" };

export default async function BienPage(props: PageProps<"/amortizaciones/[id]">) {
  const { id } = await props.params;
  const bien = await getBienInversion(id);
  if (!bien) notFound();

  const tabla = calcularTablaAmortizacion(bien);
  const fecha = fechaNumerica(bien.fecha_adquisicion);

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/amortizaciones"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a amortizaciones
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row print:block">
        {/* Tabla y datos */}
        <div className="min-w-0 flex-1">
          <div className="mb-6 print:hidden">
            <h1 className="text-2xl font-extrabold tracking-tight text-tinta-950">
              {bien.descripcion}
            </h1>
            <p className="mt-1 text-sm text-tinta-600">
              {labelTipoBien(bien.tipo_bien)} · {bien.porcentaje_max} % máximo anual
              {bien.numero_factura ? ` · Factura ${bien.numero_factura}` : ""} · Adquisición {fecha}
            </p>
          </div>

          <TablaAmortizacion bien={bien} tabla={tabla} />

          {bien.observaciones && (
            <Tarjeta className="mt-4 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-tinta-600">
                Observaciones
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-tinta-950">
                {bien.observaciones}
              </p>
            </Tarjeta>
          )}

          {/* Datos de compra */}
          <Tarjeta className="mt-4 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-tinta-600">
              Datos de la adquisición
            </p>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-tinta-600">
                  Valor sin IVA
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-tinta-950">
                  {euros(bien.valor_sin_iva)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-tinta-600">IVA</dt>
                <dd className="mt-0.5 text-sm font-semibold text-tinta-950">
                  {bien.tipo_iva} % · {euros(bien.iva_importe)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-tinta-600">
                  Total factura
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-tinta-950">
                  {euros(bien.valor_sin_iva + bien.iva_importe)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-tinta-600">
                  Nº factura
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-tinta-950">
                  {bien.numero_factura ?? "—"}
                </dd>
              </div>
            </dl>
          </Tarjeta>
        </div>

        {/* Columna de acciones */}
        <div className="w-full shrink-0 space-y-4 lg:w-72">
          <Tarjeta className="flex flex-col gap-3 p-5 print:hidden">
            <h2 className="text-sm font-bold uppercase tracking-wide text-tinta-600">
              Documento y gestión
            </h2>
            <BotonPdfAmortizacion bien={bien} tabla={tabla} />
            <Link href={`/amortizaciones/${bien.id}/editar`} className={CLASE_BOTON_SUAVE}>
              <Pencil className="h-4 w-4" /> Editar bien
            </Link>
            <BotonImprimir />
          </Tarjeta>
          <AccionesBien id={bien.id} />
        </div>
      </div>
    </>
  );
}