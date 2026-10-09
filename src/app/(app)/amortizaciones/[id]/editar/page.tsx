import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBienInversion } from "@/lib/data";
import BienForm from "@/components/bien-form";
import { Tarjeta } from "@/components/ui";

export const metadata = { title: "Editar bien de inversión" };

export default async function EditarBienPage(props: PageProps<"/amortizaciones/[id]/editar">) {
  const { id } = await props.params;
  const bien = await getBienInversion(id);
  if (!bien) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/amortizaciones/${bien.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al bien
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-tinta-950">Editar bien</h1>
      <p className="mb-6 text-sm text-tinta-600">
        {bien.descripcion} · {bien.porcentaje_max} % máximo anual
      </p>

      <Tarjeta className="max-w-3xl p-5 sm:p-6">
        <BienForm bien={bien} />
      </Tarjeta>
    </>
  );
}