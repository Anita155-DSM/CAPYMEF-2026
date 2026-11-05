import {
  FaCreditCard,
  FaDownload,
  FaFileInvoiceDollar,
  FaRegCalendarCheck,
} from "react-icons/fa6";
import { useAccionesCuota } from "../../hooks/useAccionesCuota";
import { formatearFechaCuota, formatearMonto, formatearPeriodo } from "../../utils/cuotas";
import AvisoCuotasNoDisponibles from "./AvisoCuotasNoDisponibles";
import ModalPagoCuotaLazy from "./ModalPagoCuotaLazy";

function etiquetaEstado(cuota) {
  if (cuota.estado === "pagada")
    return { texto: "Pagada", clase: "bg-emerald-100 text-emerald-800 border border-emerald-200/80" };
  if (cuota.estado === "vencida")
    return {
      texto: `Venció el ${formatearFechaCuota(cuota.fecha_vencimiento)}`,
      clase: "bg-red-100 text-red-800 border border-red-200/80",
    };
  return {
    texto: `Vence el ${formatearFechaCuota(cuota.fecha_vencimiento)}`,
    clase: "bg-amber-100 text-amber-800 border border-amber-200/80",
  };
}

/** Cuota actual del socio. `cuotas` y `errorCuotas` vienen del layout (useMisCuotas). */
export default function TarjetaCuota({ cuota, cuotas, errorCuotas }) {
  const { procesando, pagar, descargar, cuotaAPagar, cerrarPago } = useAccionesCuota();

  let contenido;
  if (cuotas === undefined) {
    contenido = (
      <div className="flex flex-1 items-center justify-center rounded-xl bg-surface p-5 text-sm text-slate-500">
        Cargando tu cuota actual...
      </div>
    );
  } else if (cuotas === null) {
    contenido = <AvisoCuotasNoDisponibles />;
  } else if (errorCuotas) {
    contenido = (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorCuotas}
      </p>
    );
  } else if (!cuota) {
    contenido = (
      <div className="flex flex-1 items-center gap-3.5 rounded-xl border border-primary/15 bg-surface-blue/60 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-primary shadow-2xs">
          <FaRegCalendarCheck />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">Sin cuotas pendientes</p>
          <p className="mt-0.5 text-xs text-slate-600">
            No tenés cuotas generadas por el momento. Se emiten el día 1 de cada mes.
          </p>
        </div>
      </div>
    );
  } else {
    const pagada = cuota.estado === "pagada";
    const estado = etiquetaEstado(cuota);
    contenido = (
      <div className="flex flex-1 flex-row items-center justify-between gap-3 rounded-none border border-primary/15 bg-linear-to-br from-surface via-white to-surface-blue/60 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
            Período {formatearPeriodo(cuota.mes_anio)}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-navy tabular-nums sm:text-3xl xl:text-4xl">
            {formatearMonto(cuota.monto)}
          </p>
          <span
            className={`mt-2.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${estado.clase}`}
          >
            {estado.texto}
          </span>
        </div>
        <div className="shrink-0">
          {pagada ? (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => descargar(cuota)}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy shadow-2xs transition-colors hover:border-primary/30 hover:bg-surface-blue hover:text-primary disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              {procesando ? "Descargando..." : "Comprobante"} <FaDownload />
            </button>
          ) : (
            <button
              type="button"
              disabled={Boolean(procesando)}
              onClick={() => pagar(cuota)}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Pagar cuota <FaCreditCard />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
            <FaFileInvoiceDollar />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
            Cuota actual
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-400">Vencimiento día 10</span>
      </div>

      <div className="flex flex-1 flex-col">{contenido}</div>

      {cuotaAPagar && <ModalPagoCuotaLazy cuota={cuotaAPagar} onClose={cerrarPago} />}
    </section>
  );
}
