import { notFound } from "next/navigation";
import { getAtracciones, getConfig, getEvento } from "@/lib/data";
import EventoForm from "@/components/evento-form";
import { EncabezadoPagina } from "@/components/ui";

export const metadata = { title: "Editar evento" };

export default async function EditarEventoPage(props: PageProps<"/eventos/[id]/editar">) {
  const { id } = await props.params;

  const [evento, atracciones, config] = await Promise.all([
    getEvento(id),
    getAtracciones(),
    getConfig(),
  ]);

  if (!evento) notFound();

  return (
    <>
      <EncabezadoPagina titulo="Editar evento" descripcion={evento.titulo} />
      <EventoForm
        atracciones={atracciones}
        evento={evento}
        suplementos={{
          cinco: Number(config?.suplemento_5h ?? 25),
          ocho: Number(config?.suplemento_8h ?? 55),
        }}
      />
    </>
  );
}
