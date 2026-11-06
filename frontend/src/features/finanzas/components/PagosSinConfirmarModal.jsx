import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCheck,
  FaCheckDouble,
  FaCircleCheck,
  FaHourglassHalf,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { confirmarPagosAdmin } from "@/services/finanzasServices";
import { formatearFechaCorta, formatearMonto } from "../utils/cuotas";

export default function PagosSinConfirmarModal({
  pagos = [],
  onClose,
  onConfirmados,
}) {
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [confirmandoTodos, setConfirmandoTodos] = useState(false);

  useBloquearScroll();

  const bloqueado = Boolean(confirmandoId || confirmandoTodos);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !bloqueado) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [bloqueado, onClose]);

  const confirmarUno = async (pagoId) => {
    setConfirmandoId(pagoId);
    const res = await confirmarPagosAdmin([pagoId]);
    setConfirmandoId(null);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo confirmar el pago.");
      return;
    }

    toast.success("Pago verificado y confirmado por Tesorería.");
    onConfirmados?.();
  };

  const confirmarTodos = async () => {
    const ids = pagos.map((p) => p.id);
    if (ids.length === 0) return;

    setConfirmandoTodos(true);
    const res = await confirmarPagosAdmin(ids);
    setConfirmandoTodos(false);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudieron confirmar los pagos.");
      return;
    }

    toast.success(res.mensaje || "Todos los pagos fueron confirmados por Tesorería.");
    onConfirmados?.();
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-pagos-tesoreria"
      onClick={() => !bloqueado && onClose()}
      className="animacion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 font-socio backdrop-blur-xs sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animacion-modal relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-navy shadow-2xl"
      >
        {/* Cabecera estilo Socio */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <FaHourglassHalf className="text-[11px]" /> Tesorería · Conciliación
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-blue px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
                {pagos.length} {pagos.length === 1 ? "pendiente" : "pendientes"}
              </span>
            </div>
            <h2
              id="titulo-modal-pagos-tesoreria"
              className="mt-2.5 text-xl font-semibold leading-snug text-navy sm:text-2xl"
            >
              Pagos pendientes de confirmación
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Verificá los cobros manuales o por pasarela contra caja o extracto bancario para darlos por conciliados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => !bloqueado && onClose()}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-navy disabled:opacity-50"
          >
            <FaXmark />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-12 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-600">
                <FaCircleCheck />
              </span>
              <p className="text-base font-semibold text-navy">Todo conciliado al día</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                No quedan pagos pendientes de verificación por Tesorería.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pagos.map((pago) => {
                const fecha = formatearFechaCorta(pago.fechaPago);
                const confirmandoEste = confirmandoId === pago.id;

                return (
                  <li
                    key={pago.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-surface/60 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-navy">
                          {pago.socio?.razonSocial || "Socio"}
                        </p>
                        {pago.socio?.cuit && (
                          <span className="text-xs text-slate-400">
                            · CUIT {pago.socio.cuit}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="font-semibold text-navy tabular-nums">
                          {formatearMonto(pago.montoAbonado)}
                        </span>
                        <span>· Medio: {pago.metodoPago || "Efectivo"}</span>
                        {fecha && <span>· Fecha: {fecha}</span>}
                        {pago.nroComprobante && (
                          <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Comp: {pago.nroComprobante}
                          </span>
                        )}
                      </div>

                      {pago.observaciones && (
                        <p className="text-[11px] text-slate-500">
                          Obs: {pago.observaciones}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={() => confirmarUno(pago.id)}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <FaCheck />
                      {confirmandoEste ? "Confirmando..." : "Confirmar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-surface/60 px-5 py-4 sm:px-7">
          <p className="text-xs text-slate-500">
            Al confirmar, el socio recibe la notificación de verificación de Tesorería.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => !bloqueado && onClose()}
              disabled={bloqueado}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
            >
              Cerrar
            </button>
            {pagos.length > 0 && (
              <button
                type="button"
                onClick={confirmarTodos}
                disabled={bloqueado}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy disabled:opacity-50 sm:text-sm"
              >
                <FaCheckDouble />
                {confirmandoTodos
                  ? "Confirmando todos..."
                  : `Confirmar todos (${pagos.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

