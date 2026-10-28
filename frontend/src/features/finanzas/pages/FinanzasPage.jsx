import { useState } from "react";
import { toast } from "sonner";
import Loading from "@/shared/ui/Loading";
import Paginacion from "@/shared/ui/Paginacion";
import { descargarComprobanteAdmin } from "@/services/finanzasServices";
import FiltrosCuotas from "../components/FiltrosCuotas";
import TablaCuotasAdmin from "../components/TablaCuotasAdmin";
import { useCuotasAdmin } from "../hooks/useCuotasAdmin";
import { useFiltrosCuotas } from "../hooks/useFiltrosCuotas";

export default function FinanzasPage() {
  const { cuotas, cargando, error } = useCuotasAdmin();
  const { filtros, cambiar, limpiar, opcionesPeriodo, filtradas, visibles, pagina, totalPaginas, setPagina } =
    useFiltrosCuotas(cuotas);
  const [descargandoId, setDescargandoId] = useState(null);

  const descargar = async (cuota) => {
    setDescargandoId(cuota.id);
    const resultado = await descargarComprobanteAdmin(cuota);
    setDescargandoId(null);
    if (!resultado.exito) toast.error(resultado.mensaje || "No se pudo descargar el comprobante.");
  };

  if (cargando) return <div className="p-10"><Loading /></div>;

  return (
    <div className="px-3 pt-4 pb-6 sm:px-4 sm:pt-0 w-full font-sans relative">
      <FiltrosCuotas filtros={filtros} cambiar={cambiar} limpiar={limpiar} opcionesPeriodo={opcionesPeriodo} />

      {error ? (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">{error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-2">
            Mostrando <strong>{filtradas.length}</strong> de <strong>{cuotas.length}</strong> cuotas
          </p>

          <TablaCuotasAdmin
            cuotas={visibles}
            descargandoId={descargandoId}
            onDescargar={descargar}
            mensajeVacio={
              cuotas.length === 0
                ? "Todavía no hay cuotas generadas."
                : "No se encontraron cuotas con los filtros aplicados."
            }
          />

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}
    </div>
  );
}
