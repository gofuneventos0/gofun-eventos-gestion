import { getAtracciones, getClientes, getConfig } from "@/lib/data";
import EventoForm from "@/components/evento-form";
import { EncabezadoPagina } from "@/components/ui";

export const metadata = { title: "Nuevo evento" };

export default async function NuevoEventoPage(props: PageProps<"/eventos/nuevo">) {
  const sp = await props.searchParams;
  const fecha = typeof sp.fecha === "string" ? sp.fecha : undefined;

  const [clientes, atracciones, config] = await Promise.all([
    getClientes(),
    getAtracciones(),
    getConfig(),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo evento"
        descripcion="Registra la reserva, el montaje y el importe contratado"
      />
      <EventoForm
        clientes={clientes}
        atracciones={atracciones}
        fechaInicial={fecha}
        suplementos={{
          cinco: Number(config?.suplemento_5h ?? 25),
          ocho: Number(config?.suplemento_8h ?? 55),
        }}
      />
    </>
  );
}
