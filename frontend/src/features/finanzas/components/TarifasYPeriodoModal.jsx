import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaBell,
  FaCalendarPlus,
  FaCircleInfo,
  FaClockRotateLeft,
  FaCoins,
  FaFloppyDisk,
  FaGears,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import {
  actualizarTarifaAdmin,
  enviarRecordatoriosAdmin,
  generarCuotasManualAdmin,
  marcarCuotasVencidasAdmin,
  obtenerTarifasAdmin,
} from "@/services/finanzasServices";
import { formatearMonto } from "../utils/cuotas";

export default function TarifasYPeriodoModal({ onClose, onCambioCuotas }) {
  const [montoActual, setMontoActual] = useState(0);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ejecutandoProceso, setEjecutandoProceso] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorMonto, setErrorMonto] = useState("");

  useBloquearScroll();

  const bloqueado = Boolean(guardando || ejecutandoProceso);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !bloqueado) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [bloqueado, onClose]);

  useEffect(() => {
    let activo = true;
    obtenerTarifasAdmin().then((res) => {
      if (!activo) return;
      if (res.exito && Array.isArray(res.data)) {
        const tarifaActivo = res.data.find(
          (t) => String(t.categoria).toLowerCase() === "activo"
        );
        const valor = Number(tarifaActivo?.monto) || 0;
        setMontoActual(valor);
        setNuevoMonto(valor > 0 ? String(valor) : "");
      } else {
        setErrorCarga(res.mensaje || "No se pudo cargar la tarifa vigente.");
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const actualizarCuota = async (e) => {
    e.preventDefault();
    setErrorMonto("");
    setGuardando(true);

    const res = await actualizarTarifaAdmin("activo", nuevoMonto);
    setGuardando(false);

    if (!res.exito) {
      const msg =
        (Array.isArray(res.errores) && res.errores[0]?.mensaje) ||
        res.mensaje ||
        "No se pudo actualizar el monto de la cuota.";
      setErrorMonto(msg);
      toast.error(msg);
      return;
    }

    const actualizado = Number(res.data?.monto ?? nuevoMonto) || 0;
    setMontoActual(actualizado);
    setNuevoMonto(String(actualizado));
    toast.success(
      res.mensaje ||
        "Cuota mensual actualizada. Se aplicará a las cuotas que se generen a partir de ahora."
    );
  };

  const ejecutarProceso = async (clave, fnAccion) => {
    setEjecutandoProceso(clave);
    const res = await fnAccion();
    setEjecutandoProceso(null);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo completar la operación.");
      return;
    }

    toast.success(res.mensaje || "Proceso ejecutado correctamente.");
    onCambioCuotas?.();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-tarifas"
      onClick={() => !bloqueado && onClose()}
      className="animacion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 font-socio backdrop-blur-xs sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animacion-modal relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-navy shadow-2xl"
      >
        {/* Cabecera institucional */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary">
                <FaCoins className="text-[11px]" /> Valores y facturación
              </span>
            </div>
            <h2
              id="titulo-modal-tarifas"
              className="mt-2.5 text-xl font-semibold leading-snug text-navy sm:text-2xl"
            >
              Modificar monto de la cuota y período
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Actualizá el valor mensual de la cuota de los socios Activos o ejecutá procesos administrativos del mes.
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
          {/* 1. Modificar el monto de la cuota (Solo Activos) */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FaCoins className="text-primary" /> Cuota social mensual (Socios Activos)
            </p>

            {cargando ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-10 text-center">
                <div className="relative h-9 w-9">
                  <div className="absolute inset-0 rounded-full border-3 border-surface-blue" />
                  <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
                <p className="mt-3 text-xs font-semibold text-navy">Cargando cuota vigente...</p>
              </div>
            ) : errorCarga ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {errorCarga}
              </p>
            ) : (
              <form
                onSubmit={actualizarCuota}
                noValidate
                className="space-y-4 rounded-xl border border-slate-200/80 bg-surface/60 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-3.5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Categoría alcanzada
                    </span>
                    <p className="mt-0.5 text-base font-bold text-navy">
                      Socio Activo
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Monto actual vigente
                    </span>
                    <p className="mt-0.5 text-xl font-bold text-primary tabular-nums sm:text-2xl">
                      {formatearMonto(montoActual)}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-nuevo-monto-cuota"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Nuevo monto mensual ($)
                  </label>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        id="input-nuevo-monto-cuota"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={nuevoMonto}
                        onChange={(e) => {
                          setNuevoMonto(e.target.value);
                          if (errorMonto) setErrorMonto("");
                        }}
                        placeholder="Ej: 25000"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3.5 text-sm font-semibold text-navy tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={bloqueado}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                      <FaFloppyDisk />
                      {guardando ? "Actualizando..." : "Actualizar cuota"}
                    </button>
                  </div>
                </div>

                {errorMonto && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                  >
                    {errorMonto}
                  </p>
                )}

                <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-surface-blue/70 px-3.5 py-3 text-xs leading-relaxed text-slate-700">
                  <FaCircleInfo className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-navy">
                      Se aplicará a las cuotas que se generen a partir de ahora; las ya emitidas no cambian.
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Por estatuto, únicamente la categoría <strong>Activo</strong> abona cuota social mensual. Las categorías Adherente, Padrino y Honorario no generan cuota fija y el cambio queda registrado en auditoría.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* 2. Procesos administrativos de período */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FaGears className="text-primary" /> Procesos manuales del período
            </p>

            <div className="space-y-2.5">
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-surface/50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-navy">Generar cuotas del mes actual</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Emite las cuotas del período en curso para todos los socios Activos aprobados que aún no la tengan.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => ejecutarProceso("generar", generarCuotasManualAdmin)}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-navy disabled:opacity-50"
                >
                  <FaCalendarPlus />
                  {ejecutandoProceso === "generar" ? "Generando..." : "Generar cuotas"}
                </button>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-surface/50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-navy">Enviar recordatorios de vencimiento</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Notifica a los socios que tienen su cuota mensual pendiente de pago (sin duplicar avisos).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => ejecutarProceso("recordatorios", enviarRecordatoriosAdmin)}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-white px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-surface-blue disabled:opacity-50"
                >
                  <FaBell />
                  {ejecutandoProceso === "recordatorios" ? "Enviando..." : "Enviar recordatorios"}
                </button>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-surface/50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-navy">Cerrar ventana y marcar vencidas</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pasa a vencidas las cuotas impagas cuya fecha de vencimiento ya expiró y evalúa categorías por mora.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => ejecutarProceso("vencidas", marcarCuotasVencidasAdmin)}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  <FaClockRotateLeft />
                  {ejecutandoProceso === "vencidas" ? "Procesando..." : "Marcar vencidas"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-surface/60 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={() => !bloqueado && onClose()}
            disabled={bloqueado}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
