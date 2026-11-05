import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaBell,
  FaCalendarPlus,
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
import { formatearMonto, mayuscula } from "../utils/cuotas";

const DESCRIPCION_CATEGORIA = {
  activo: "Socios plenos con derecho a voto y cuota mensual regular.",
  adherente: "Socios adherentes o en período de regularización ($0 si no abonan cuota fija).",
  padrino: "Empresas padrino con aportes voluntarios ($0 si no generan cuota mensual fija).",
  honorario: "Socios honorarios exentos de cuota social ($0 por defecto).",
};

export default function TarifasYPeriodoModal({ onClose, onCambioCuotas }) {
  const [tarifas, setTarifas] = useState([]);
  const [editados, setEditados] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardandoCat, setGuardandoCat] = useState(null);
  const [ejecutandoProceso, setEjecutandoProceso] = useState(null);
  const [error, setError] = useState("");

  useBloquearScroll();

  const bloqueado = Boolean(guardandoCat || ejecutandoProceso);

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
        setTarifas(res.data);
        const mapaInicial = {};
        for (const t of res.data) {
          mapaInicial[t.categoria] = String(Number(t.monto) || 0);
        }
        setEditados(mapaInicial);
      } else {
        setError(res.mensaje || "No se pudieron cargar las tarifas vigentes.");
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const guardarTarifa = async (categoria) => {
    const valorNum = Number(editados[categoria]);
    if (Number.isNaN(valorNum) || valorNum < 0) {
      toast.error("Ingresá un monto válido mayor o igual a 0.");
      return;
    }

    setGuardandoCat(categoria);
    const res = await actualizarTarifaAdmin(categoria, valorNum);
    setGuardandoCat(null);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo actualizar la tarifa.");
      return;
    }

    toast.success(res.mensaje || `Tarifa de ${mayuscula(categoria)} actualizada.`);
    setTarifas((prev) =>
      prev.map((t) => (t.categoria === categoria ? { ...t, monto: valorNum } : t))
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
        {/* Cabecera estilo Socio */}
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
              Tarifas y procesos del período
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Configurá el valor mensual de la cuota por categoría o ejecutá procesos administrativos del mes.
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
          {/* 1. Tarifas por categoría */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FaCoins className="text-primary" /> Monto mensual por categoría de socio
            </p>

            {cargando ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-10 text-center">
                <div className="relative h-9 w-9">
                  <div className="absolute inset-0 rounded-full border-3 border-surface-blue" />
                  <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
                <p className="mt-3 text-xs font-semibold text-navy">Cargando tarifas...</p>
              </div>
            ) : error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {error}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tarifas.map((tarifa) => {
                  const cat = tarifa.categoria;
                  const valorActual = Number(tarifa.monto) || 0;
                  const valorInput = editados[cat] ?? String(valorActual);
                  const cambioPendiente = Number(valorInput) !== valorActual;
                  const guardandoEsta = guardandoCat === cat;

                  return (
                    <div
                      key={cat}
                      className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface/60 p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold capitalize text-navy">
                            {mayuscula(cat)}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-2xs">
                            Actual: {formatearMonto(valorActual)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {DESCRIPCION_CATEGORIA[cat] || "Valor mensual para nuevas cuotas generadas."}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={valorInput}
                            onChange={(e) =>
                              setEditados((prev) => ({ ...prev, [cat]: e.target.value }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm font-semibold text-navy tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => guardarTarifa(cat)}
                          disabled={!cambioPendiente || bloqueado}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <FaFloppyDisk />
                          {guardandoEsta ? "..." : "Guardar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    Emite las cuotas del período en curso para todos los socios aprobados que aún no la tengan.
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

