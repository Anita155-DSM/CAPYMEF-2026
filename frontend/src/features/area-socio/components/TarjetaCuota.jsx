import { FaCreditCard, FaDownload } from "react-icons/fa6";
import { useAccionesCuota } from "../hooks/useAccionesCuota";
import { formatearFechaCuota, formatearMonto, formatearPeriodo } from "../utils/cuotas";
import AvisoCuotasNoDisponibles from "./AvisoCuotasNoDisponibles";
import ModalPagoCuotaLazy from "./ModalPagoCuotaLazy";

function etiquetaEstado(cuota) {
  if (cuota.estado === "pagada") return { texto: "Pagada", clase: "bg-[#61d5a5] text-[#247c5c]" };
  if (cuota.estado === "vencida") return { texto: `Venció el ${formatearFechaCuota(cuota.fecha_vencimiento)}`, clase: "bg-[#f7b4a2] text-[#9b3418]" };
  return { texto: `Vence el ${formatearFechaCuota(cuota.fecha_vencimiento)} ◷`, clase: "bg-gray-300 text-gray-600" };
}

/** Cuota actual del socio. `cuotas` y `errorCuotas` vienen del layout (useMisCuotas). */
export default function TarjetaCuota({ cuota, cuotas, errorCuotas }) {
  const { procesando, pagar, descargar, cuotaAPagar, cerrarPago } = useAccionesCuota();

  let contenido;
  if (cuotas === undefined) contenido = <p className="text-sm text-gray-600">Cargando tu cuota...</p>;
  else if (cuotas === null) contenido = <AvisoCuotasNoDisponibles />;
  else if (errorCuotas) contenido = <p className="text-sm text-red-700">{errorCuotas}</p>;
  else if (!cuota) contenido = <p className="text-sm text-gray-600">No tenés cuotas generadas por el momento.</p>;
  else {
    const pagada = cuota.estado === "pagada";
    const estado = etiquetaEstado(cuota);
    contenido = (
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium uppercase text-gray-600">Cuota de {formatearPeriodo(cuota.mes_anio)}</p>
          <p className="mt-1 text-4xl font-bold text-[#151515]">{formatearMonto(cuota.monto)}</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {pagada ? (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => descargar(cuota)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-[#f5f9fc] px-3 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
            >
              {procesando ? "Descargando..." : "Descargar comprobante"} <FaDownload />
            </button>
          ) : (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => pagar(cuota)}
              className="inline-flex items-center gap-2 bg-[#2693bf] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b789f] disabled:opacity-60"
            >
              Pagar cuota <FaCreditCard />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      {contenido}
      {cuotaAPagar && <ModalPagoCuotaLazy cuota={cuotaAPagar} onClose={cerrarPago} />}
    </section>
  );
}
