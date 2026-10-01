import { FaCreditCard, FaDownload } from "react-icons/fa6";
import { formatearFecha, formatearMonto, formatearPeriodo } from "../../../services/socioServices";
import useAccionesCuota from "../Hooks/useAccionesCuota";

export function AvisoCuotasNoDisponibles() {
  return (
    <p className="text-sm text-gray-600">
      Todavía no podemos mostrar tus cuotas desde el panel. Para consultar tu estado de cuenta escribinos a{" "}
      <a href="mailto:info@capymef.ar" className="font-bold text-[#0875b1] hover:underline">info@capymef.ar</a>.
    </p>
  );
}

export default function TarjetaCuota({ cuota, cuotas, errorCuotas }) {
  const { procesando, pagar, descargar } = useAccionesCuota();

  let contenido;
  if (cuotas === undefined) {
    contenido = <p className="text-sm text-gray-600">Cargando tu cuota...</p>;
  } else if (cuotas === null) {
    contenido = <AvisoCuotasNoDisponibles />;
  } else if (errorCuotas) {
    contenido = <p className="text-sm text-red-700">{errorCuotas}</p>;
  } else if (!cuota) {
    contenido = <p className="text-sm text-gray-600">No tenés cuotas generadas por el momento.</p>;
  } else {
    const pagada = cuota.estado === "pagada";
    contenido = (
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium uppercase text-gray-600">Cuota de {formatearPeriodo(cuota.mes_anio)}</p>
          <p className="mt-1 text-4xl font-bold text-[#151515]">{formatearMonto(cuota.monto)}</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cuota.estado === "vencida" ? "bg-[#f7b4a2] text-[#9b3418]" : pagada ? "bg-[#61d5a5] text-[#247c5c]" : "bg-gray-300 text-gray-600"}`}>
            {pagada ? "Pagada" : cuota.estado === "vencida" ? `Venció el ${formatearFecha(cuota.fecha_vencimiento)}` : `Vence el ${formatearFecha(cuota.fecha_vencimiento)} ◷`}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {pagada && (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => descargar(cuota)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-[#f5f9fc] px-3 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
            >
              {procesando === `comprobante-${cuota.id}` ? "Descargando..." : "Descargar comprobante"} <FaDownload />
            </button>
          )}
          {!pagada && (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => pagar(cuota)}
              className="inline-flex items-center gap-2 bg-[#2693bf] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b789f] disabled:opacity-60"
            >
              {procesando === `pagar-${cuota.id}` ? "Redirigiendo..." : "Pagar cuota"} <FaCreditCard />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      {contenido}
    </section>
  );
}
