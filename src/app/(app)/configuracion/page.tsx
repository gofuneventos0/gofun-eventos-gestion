import { getConfig } from "@/lib/data";
import ConfigForm from "@/components/config-form";
import { Aviso, EncabezadoPagina } from "@/components/ui";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const config = await getConfig();

  return (
    <>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Datos de la empresa, impuestos y tarifas de referencia"
      />
      {!config && (
        <div className="mb-4">
          <Aviso tono="error">
            No se encontró la fila de configuración. Ejecuta la migración inicial en Supabase.
          </Aviso>
        </div>
      )}
      <ConfigForm config={config} />
    </>
  );
}
