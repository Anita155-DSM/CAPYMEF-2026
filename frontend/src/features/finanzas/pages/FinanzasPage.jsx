import { useState } from "react";
import { FaCoins, FaHourglassHalf } from "react-icons/fa6";
import { toast } from "sonner";
import Paginacion from "@/shared/ui/Paginacion";
import { descargarComprobanteAdmin } from "@/services/finanzasServices";
import FiltrosCuotas from "../components/FiltrosCuotas";
import PagoEfectivoModal from "../components/PagoEfectivoModal";
import PagosSinConfirmarModal from "../components/PagosSinConfirmarModal";
import TablaCuotasAdmin from "../components/TablaCuotasAdmin";
import TarifasYPeriodoModal from "../components/TarifasYPeriodoModal";
import { useCuotasAdmin } from "../hooks/useCuotasAdmin";
import { useFiltrosCuotas } from "../hooks/useFiltrosCuotas";
import { formatearMonto } from "../utils/cuotas";

export default function FinanzasPage() {
  const { cuotas, pagosSinConfirmar, cargando, error, marcarPagada, recargar } = useCuotasAdmin();
  const {
    filtros,
    cambiar,
    limpiar,
    opcionesPeriodo,
    resumen,
    filtradas,
    visibles,
    pagina,
    totalPaginas,
    setPagina,
  } = useFiltrosCuotas(cuotas);

  const [descargandoId, setDescargandoId] = useState(null);
  const [cuotaEfectivo, setCuotaEfectivo] = useState(null);
  const [modalTarifasAbierto, setModalTarifasAbierto] = useState(false);
  const [modalTesoreriaAbierto, setModalTesoreriaAbierto] = useState(false);

  const descargar = async (cuota) => {
    setDescargandoId(cuota.id);
    const resultado = await descargarComprobanteAdmin(cuota);
    setDescargandoId(null);
    if (!resultado.exito) toast.error(resultado.mensaje || "No se pudo descargar el comprobante.");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Encabezado institucional unificado */}
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-primary/4"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Administración · Finanzas
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Historial de pagos y cuotas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Seguimiento de cobros mensuales, comprobantes, conciliación de Tesorería y valores por categoría.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-primary/20 bg-white/90 px-3.5 py-2 text-xs font-semibold text-navy shadow-2xs sm:text-sm">
              Mostrando: <strong className="text-primary tabular-nums">{filtradas.length}</strong> de{" "}
              <strong className="tabular-nums">{cuotas.length}</strong>
            </span>

            {pagosSinConfirmar.length > 0 && (
              <button
                type="button"
                onClick={() => setModalTesoreriaAbierto(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100 sm:text-sm"
              >
                <FaHourglassHalf />
                Por confirmar ({pagosSinConfirmar.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setModalTarifasAbierto(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy sm:text-sm"
            >
              <FaCoins /> Tarifas y período
            </button>
          </div>
        </div>
      </header>

      {cargando ? (
        <div className="flex flex-col items-center justify-center rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="relative h-11 w-11">
            <div className="absolute inset-0 rounded-full border-3 border-surface-blue" />
            <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
          <p className="mt-4 text-sm font-semibold text-navy">
            Cargando historial de finanzas y cuotas...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Obteniendo el estado de cobros y comprobantes emitidos.
          </p>
        </div>
      ) : (
        <>
          <FiltrosCuotas
            filtros={filtros}
            cambiar={cambiar}
            limpiar={limpiar}
            opcionesPeriodo={opcionesPeriodo}
          />

          {/* Pastillas rápidas de estado y resumen financiero del filtro */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "todos", etiqueta: `Todas (${resumen.total})` },
                { id: "pagada", etiqueta: `Pagadas (${resumen.pagadas})` },
                { id: "pendiente", etiqueta: `Pendientes (${resumen.pendientes})` },
                { id: "vencida", etiqueta: `Vencidas (${resumen.vencidas})` },
              ].map((item) => {
                const activo = filtros.estado === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => cambiar("estado")(item.id)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      activo
                        ? "bg-sidebar text-white shadow-2xs"
                        : "border border-slate-200/90 bg-white text-slate-600 hover:border-primary/30 hover:text-navy"
                    }`}
                  >
                    {item.etiqueta}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Cobrado: <strong className="tabular-nums">{formatearMonto(resumen.montoRecaudado)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-800">
                Por cobrar: <strong className="tabular-nums">{formatearMonto(resumen.montoPendiente)}</strong>
              </span>
            </div>
          </div>

          {error ? (
            <p className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : (
            <>
              <TablaCuotasAdmin
                cuotas={visibles}
                descargandoId={descargandoId}
                onDescargar={descargar}
                onPagarEfectivo={setCuotaEfectivo}
                mensajeVacio={
                  cuotas.length === 0
                    ? "Todavía no hay cuotas generadas"
                    : "No se encontraron cuotas con los filtros aplicados"
                }
              />

              <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </>
          )}
        </>
      )}

      {cuotaEfectivo && (
        <PagoEfectivoModal
          cuota={cuotaEfectivo}
          onRegistrado={marcarPagada}
          onClose={() => setCuotaEfectivo(null)}
        />
      )}

      {modalTarifasAbierto && (
        <TarifasYPeriodoModal
          onClose={() => setModalTarifasAbierto(false)}
          onCambioCuotas={() => recargar(true)}
        />
      )}

      {modalTesoreriaAbierto && (
        <PagosSinConfirmarModal
          pagos={pagosSinConfirmar}
          onClose={() => setModalTesoreriaAbierto(false)}
          onConfirmados={() => recargar(true)}
        />
      )}
    </div>
  );
}
