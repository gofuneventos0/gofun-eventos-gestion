import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BienForm from "@/components/bien-form";
import { Tarjeta } from "@/components/ui";

export const metadata = { title: "Nuevo bien de inversión" };

export default function NuevoBienPage() {
  return (
    <>
      <div className="mb-4">
        <Link
          href="/amortizaciones"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-600 hover:text-tinta-950"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a amortizaciones
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-tinta-950">
        Nuevo bien de inversión
      </h1>
      <p className="mb-6 text-sm text-tinta-600">
        Introduce los datos del bien según su factura de compra; la app calculará la tabla de
        amortización automáticamente.
      </p>

      <Tarjeta className="max-w-3xl p-5 sm:p-6">
        <BienForm />
      </Tarjeta>
    </>
  );
}