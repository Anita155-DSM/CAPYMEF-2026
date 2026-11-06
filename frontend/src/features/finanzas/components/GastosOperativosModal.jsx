import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaArrowUpRightFromSquare,
  FaPlus,
  FaReceipt,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { urlImagen } from "@/shared/utils/imagenes";
import {
  eliminarGastoAdmin,
  obtenerGastosAdmin,
  registrarGastoAdmin,
} from "@/services/finanzasServices";
import { formatearFechaCorta, formatearMonto } from "../utils/cuotas";

const MEDIOS_PAGO_GASTO = ["Transferencia", "Efectivo", "Tarjeta", "Cheque"];

const campoInputClase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-navy placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm";

export default function GastosOperativosModal({ onClose }) {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const hoyIso = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoyIso);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("Transferencia");
  const [comprobante, setComprobante] = useState(null);

  useBloquearScroll();

  const bloqueado = guardando || eliminando;

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !bloqueado && !gastoAEliminar) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [bloqueado, gastoAEliminar, onClose]);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await obtenerGastosAdmin();
    if (res.exito && Array.isArray(res.data)) {
      setGastos(res.data);
    } else {
      toast.error(res.mensaje || "No se pudo cargar el historial de egresos.");
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalEgresos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

  const registrar = async (e) => {
    e.preventDefault();
    if (!concepto.trim() || !monto || Number(monto) <= 0) {
      toast.error("Completá el concepto y un monto válido mayor a 0.");
      return;
    }

    const fd = new FormData();
    fd.append("fecha", fecha);
    fd.append("concepto", concepto.trim());
    fd.append("monto", String(monto));
    fd.append("medio_pago", medioPago);
    if (comprobante) fd.append("comprobante", comprobante);

    setGuardando(true);
    const res = await registrarGastoAdmin(fd);
    setGuardando(false);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo registrar el egreso.");
      return;
    }

    toast.success("Egreso operativo registrado correctamente.");
    setConcepto("");
    setMonto("");
    setComprobante(null);
    cargar();
  };

  const confirmarEliminacion = async () => {
    if (!gastoAEliminar) return;
    setEliminando(true);
    const res = await eliminarGastoAdmin(gastoAEliminar.id);
    setEliminando(false);
    setGastoAEliminar(null);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo eliminar el gasto.");
      return;
    }

    toast.success("Egreso eliminado del registro.");
    cargar();
  };

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-gastos"
        onClick={() => !bloqueado && onClose()}
        className="animacion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 font-socio backdrop-blur-xs sm:p-5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="animacion-modal relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-navy shadow-2xl"
        >
          {/* Cabecera estilo Socio */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary">
                  <FaReceipt className="text-[11px]" /> Finanzas · Egresos
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                  Total registrado: {formatearMonto(totalEgresos)}
                </span>
              </div>
              <h2
                id="titulo-modal-gastos"
                className="mt-2.5 text-xl font-semibold leading-snug text-navy sm:text-2xl"
              >
                Gastos operativos de la Cámara
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Registrá y consultá facturas, servicios o egresos operativos con su comprobante respaldatorio.
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
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
            {/* Formulario de nuevo gasto */}
            <form
              onSubmit={registrar}
              className="space-y-4 rounded-xl border border-slate-200/80 bg-surface/60 p-4 sm:p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-navy">
                Registrar nuevo egreso
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Factura REFSA Luz / Insumos"
                    className={campoInputClase}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="Ej: 25400"
                    className={campoInputClase}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={campoInputClase}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Medio de pago
                  </label>
                  <select
                    value={medioPago}
                    onChange={(e) => setMedioPago(e.target.value)}
                    className={`${campoInputClase} cursor-pointer`}
                  >
                    {MEDIOS_PAGO_GASTO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Ticket / Factura (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-2.5 file:cursor-pointer file:rounded-lg file:border-0 file:bg-surface-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/15"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={bloqueado}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy disabled:opacity-50 sm:w-auto sm:text-sm"
                  >
                    <FaPlus />
                    {guardando ? "Registrando..." : "Cargar egreso"}
                  </button>
                </div>
              </div>
            </form>

            {/* Historial de gastos */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Historial de egresos ({gastos.length})
              </p>

              {cargando ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-10 text-center">
                  <div className="relative h-9 w-9">
                    <div className="absolute inset-0 rounded-full border-3 border-surface-blue" />
                    <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-navy">Cargando egresos...</p>
                </div>
              ) : gastos.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-surface py-10 text-center text-xs text-slate-500">
                  Todavía no hay gastos operativos registrados.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {gastos.map((g) => {
                    const linkComp = urlImagen(g.url_comprobante);
                    return (
                      <li
                        key={g.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="wrap-break-word text-sm font-semibold text-navy">
                            {g.concepto}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatearFechaCorta(g.fecha) || g.fecha}</span>
                            <span>·</span>
                            <span>{g.medio_pago || "Transferencia"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-sm font-bold text-navy tabular-nums">
                            {formatearMonto(g.monto)}
                          </span>

                          {linkComp && (
                            <a
                              href={linkComp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-surface-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                            >
                              Ticket <FaArrowUpRightFromSquare className="text-[10px]" />
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={bloqueado}
                            onClick={() => setGastoAEliminar(g)}
                            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-red-200 bg-red-50 text-xs text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                            title="Eliminar egreso"
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Pie */}
          <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-surface/60 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={() => !bloqueado && onClose()}
              disabled={bloqueado}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(gastoAEliminar)}
        icono={FaTrashCan}
        titulo="¿Eliminar registro de egreso?"
        mensaje={
          gastoAEliminar
            ? `Se dará de baja el egreso "${gastoAEliminar.concepto}" por ${formatearMonto(gastoAEliminar.monto)}.`
            : ""
        }
        textoConfirmar={eliminando ? "Eliminando..." : "Eliminar"}
        onCancelar={() => setGastoAEliminar(null)}
        onConfirmar={confirmarEliminacion}
      />
    </>,
    document.body
  );
}

