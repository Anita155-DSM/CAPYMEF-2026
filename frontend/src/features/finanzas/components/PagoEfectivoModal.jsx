import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaBuilding,
  FaCalendarDay,
  FaCircleCheck,
  FaIdCard,
  FaMoneyBillWave,
  FaReceipt,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { registrarPagoEfectivo } from "@/services/finanzasServices";
import { formatearMonto, nombreCuota } from "../utils/cuotas";

const METODOS_PAGO = [
  { valor: "Efectivo", texto: "Efectivo (en sede)" },
  { valor: "Transferencia", texto: "Transferencia bancaria" },
  { valor: "Débito", texto: "Tarjeta de débito" },
  { valor: "Otro", texto: "Otro medio" },
];

const campoInputClase =
  "w-full rounded-xl border border-slate-200 bg-surface/60 px-3.5 py-2.5 text-sm font-medium text-navy placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15";

const etiquetaCampoClase =
  "mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500";

/** Confirma el cobro manual / en efectivo de una cuota. */
export default function PagoEfectivoModal({ cuota, onRegistrado, onClose }) {
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [nroComprobante, setNroComprobante] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useBloquearScroll();

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !guardando) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [guardando, onClose]);

  const cerrar = () => !guardando && onClose();

  const confirmar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const resultado = await registrarPagoEfectivo(cuota, {
      metodoPago,
      nroComprobante,
      observaciones,
    });
    setGuardando(false);

    if (!resultado.exito) {
      return setError(resultado.mensaje || "No se pudo registrar el pago.");
    }
    toast.success("Pago registrado e impactado correctamente.");
    onRegistrado(cuota.id);
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-pago-efectivo"
      onClick={cerrar}
      className="animacion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 font-socio backdrop-blur-xs sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animacion-modal relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white text-navy shadow-2xl"
      >
        {/* Cabecera estilo Socio */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary">
                <FaMoneyBillWave className="text-[11px]" /> Registro de cobro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                {cuota.estado || "Pendiente"}
              </span>
            </div>
            <h2
              id="titulo-modal-pago-efectivo"
              className="mt-2.5 text-xl font-semibold leading-snug text-navy sm:text-2xl"
            >
              Registrar pago de cuota
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Confirmá el cobro para emitir el comprobante oficial y notificar al socio.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-navy disabled:opacity-50"
          >
            <FaXmark />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <form onSubmit={confirmar} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            {/* Tarjeta de resumen de la cuota */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-surface p-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-2xs">
                  <FaBuilding />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Socio
                  </p>
                  <p className="mt-0.5 wrap-break-word text-sm font-semibold text-navy">
                    {cuota.socio?.razonSocial ?? "Socio eliminado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-2xs">
                  <FaIdCard />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    CUIT
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-navy tabular-nums">
                    {cuota.socio?.cuit || "No especificado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-2xs">
                  <FaCalendarDay />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Período
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">
                    {nombreCuota(cuota.mes_anio)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-2xs">
                  <FaMoneyBillWave />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Monto a abonar
                  </p>
                  <p className="mt-0.5 text-base font-bold text-navy tabular-nums">
                    {formatearMonto(cuota.monto)}
                  </p>
                </div>
              </div>
            </div>

            {/* Campos de cobro */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={etiquetaCampoClase}>
                  <FaMoneyBillWave className="text-primary" /> Medio de pago
                </span>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className={`${campoInputClase} cursor-pointer`}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.texto}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={etiquetaCampoClase}>
                  <FaReceipt className="text-primary" /> N.º de recibo / operación (opcional)
                </span>
                <input
                  type="text"
                  maxLength={100}
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="Ej: Recibo #0042 o ID bancario"
                  className={campoInputClase}
                />
              </label>
            </div>

            <label className="block">
              <span className={etiquetaCampoClase}>Observaciones (opcional)</span>
              <textarea
                rows={3}
                maxLength={255}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Abonado por caja en la sede central, recibió Tesorería."
                className={`${campoInputClase} resize-none`}
              />
            </label>

            <div className="rounded-xl border border-primary/15 bg-surface-blue/60 px-4 py-3 text-xs leading-relaxed text-slate-600">
              La cuota pasará inmediatamente al estado <strong className="text-navy">Pagada</strong>,
              se enviará el comprobante PDF por correo al socio y quedará disponible para su descarga.
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 sm:text-sm">
                {error}
              </p>
            )}
          </div>

          {/* Pie de acciones */}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-surface/60 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={cerrar}
              disabled={guardando}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy disabled:opacity-50 sm:text-sm"
            >
              <FaCircleCheck />
              {guardando ? "Registrando..." : "Confirmar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
