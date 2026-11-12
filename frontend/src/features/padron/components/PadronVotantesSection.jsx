import { useCallback, useEffect, useState } from "react";
import {
  FaCalendarDay,
  FaCheckToSlot,
  FaCircleCheck,
  FaCircleInfo,
  FaCircleXmark,
  FaFileCsv,
} from "react-icons/fa6";
import { toast } from "sonner";
import {
  exportarPadronVotantesCsv,
  obtenerPadronVotantesAdmin,
} from "@/services/adminServices";
import { fechaHoyArgentina, formatearFecha } from "@/shared/utils/fechas";

const ESTILO_CATEGORIA = {
  activo: "bg-surface-blue text-primary border-primary/20",
  adherente: "bg-slate-100 text-slate-700 border-slate-200",
  padrino: "bg-amber-50 text-amber-800 border-amber-200",
  honorario: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function PadronVotantesSection() {
  const [fechaCorte, setFechaCorte] = useState(() => fechaHoyArgentina());
  const [padron, setPadron] = useState({
    fechaCorte: "",
    totalHabilitados: 0,
    habilitados: [],
    noHabilitados: [],
  });
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  const cargarPadron = useCallback(async (fecha) => {
    if (!fecha) return;
    setCargando(true);
    setError("");
    const res = await obtenerPadronVotantesAdmin(fecha);
    if (res.exito && res.data) {
      setPadron({
        fechaCorte: res.data.fechaCorte || fecha,
        totalHabilitados: res.data.totalHabilitados ?? res.data.habilitados?.length ?? 0,
        habilitados: Array.isArray(res.data.habilitados) ? res.data.habilitados : [],
        noHabilitados: Array.isArray(res.data.noHabilitados) ? res.data.noHabilitados : [],
      });
    } else {
      setError(res.mensaje || "No se pudo calcular el padrón de votantes para la fecha indicada.");
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarPadron(fechaCorte);
  }, [fechaCorte, cargarPadron]);

  const descargarCsv = async () => {
    setDescargando(true);
    const res = await exportarPadronVotantesCsv(fechaCorte);
    setDescargando(false);

    if (!res.exito) {
      toast.error(res.mensaje || "No se pudo descargar el padrón en CSV.");
      return;
    }
    toast.success("Padrón de votantes descargado en CSV.");
  };

  const { habilitados, noHabilitados } = padron;

  return (
    <div className="space-y-6">
      {/* Barra de fecha de corte de Asamblea, requisitos y descarga CSV */}
      <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <FaCheckToSlot />
              <span>Asamblea General · Requisitos Estatutarios</span>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
              Integran el padrón de votantes los socios con cuenta aprobada, categoría{" "}
              <strong className="text-navy">Activo</strong>, al menos{" "}
              <strong className="text-navy">6 meses de antigüedad</strong> desde su aprobación y{" "}
              <strong className="text-navy">sin cuotas vencidas impagas</strong> a la fecha de corte seleccionada.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="fecha-corte-asamblea"
                className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                <FaCalendarDay className="text-primary" /> Fecha de corte (Asamblea)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fecha-corte-asamblea"
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-surface/60 px-3.5 py-2 text-xs font-semibold text-navy tabular-nums transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFechaCorte(fechaHoyArgentina())}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:bg-surface-blue hover:text-primary"
                  title="Restablecer a la fecha de hoy"
                >
                  Hoy
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={descargarCsv}
              disabled={cargando || descargando || Boolean(error)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0c5e31] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <FaFileCsv className="text-sm" />
              {descargando ? "Descargando..." : "Descargar padrón"}
            </button>
          </div>
        </div>

        {/* Resumen numérico */}
        {!cargando && !error && (
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Habilitados para votar
                </p>
                <p className="text-xs text-emerald-700/80">Cumplen todos los requisitos</p>
              </div>
              <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                {habilitados.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  No habilitados
                </p>
                <p className="text-xs text-amber-800/80">Con motivo de exclusión detallado</p>
              </div>
              <span className="text-2xl font-bold text-amber-800 tabular-nums">
                {noHabilitados.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-surface/70 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total socios evaluados
                </p>
                <p className="text-xs text-slate-500">
                  Corte al {formatearFecha(padron.fechaCorte || fechaCorte)}
                </p>
              </div>
              <span className="text-2xl font-bold text-navy tabular-nums">
                {habilitados.length + noHabilitados.length}
              </span>
            </div>
          </div>
        )}
      </section>

      {cargando ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm font-semibold text-navy">Calculando padrón de votantes...</p>
          <p className="mt-1 text-xs text-slate-500">
            Verificando categoría, antigüedad de aprobación y estado de cuotas.
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-none border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* TABLA 1: SOCIOS HABILITADOS PARA VOTAR */}
          <section className="rounded-none border border-slate-200/90 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-sm text-emerald-600">
                  <FaCircleCheck />
                </span>
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                    Socios habilitados para votar
                  </h2>
                  <p className="text-xs text-slate-500">
                    Incluidos en el archivo CSV oficial de la Asamblea
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 tabular-nums">
                {habilitados.length} {habilitados.length === 1 ? "socio habilitado" : "socios habilitados"}
              </span>
            </div>

            {habilitados.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-navy">
                  No hay socios habilitados para votar en la fecha seleccionada
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Revisá la tabla inferior para consultar los motivos de cada socio o seleccioná otra fecha de corte.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3.5">N.º</th>
                      <th className="px-4 py-3.5">Razón Social</th>
                      <th className="px-4 py-3.5">CUIT</th>
                      <th className="px-4 py-3.5">Correo electrónico</th>
                      <th className="px-4 py-3.5">Categoría</th>
                      <th className="px-4 py-3.5">Fecha de aprobación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {habilitados.map((socio, idx) => (
                      <tr key={socio.id} className="transition-colors hover:bg-surface-blue/35">
                        <td className="px-4 py-3.5 text-xs font-semibold text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-navy">
                          {socio.razonSocial}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                          {socio.cuit || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {socio.email || "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                              ESTILO_CATEGORIA[socio.categoria?.toLowerCase()] ||
                              "border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {socio.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                          <span>{formatearFecha(socio.fechaAprobacion)}</span>
                          {socio.fechaAprobacionAproximada && (
                            <span
                              className="ml-1.5 text-[11px] text-slate-400"
                              title="Se tomó la fecha de registro porque el socio fue aprobado antes de registrar fecha de aprobación"
                            >
                              (registro)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* TABLA 2: SOCIOS NO HABILITADOS Y MOTIVOS */}
          <section className="rounded-none border border-slate-200/90 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-sm text-amber-600">
                  <FaCircleXmark />
                </span>
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                    Socios no habilitados y motivos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Socios aprobados que no cumplen uno o más requisitos a la fecha de corte
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 tabular-nums">
                {noHabilitados.length} {noHabilitados.length === 1 ? "socio no habilitado" : "socios no habilitados"}
              </span>
            </div>

            {noHabilitados.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-navy">
                  Todos los socios aprobados cumplen las condiciones para votar
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  No se registran socios inhabilitados para la fecha de corte seleccionada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3.5">Razón Social</th>
                      <th className="px-4 py-3.5">CUIT</th>
                      <th className="px-4 py-3.5">Categoría</th>
                      <th className="px-4 py-3.5">Fecha de aprobación</th>
                      <th className="px-4 py-3.5">Motivos de no habilitación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {noHabilitados.map((socio) => (
                      <tr key={socio.id} className="transition-colors hover:bg-surface-blue/35">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-navy">{socio.razonSocial}</p>
                          <p className="text-xs text-slate-400">{socio.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                          {socio.cuit || "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                              ESTILO_CATEGORIA[socio.categoria?.toLowerCase()] ||
                              "border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {socio.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                          <span>{formatearFecha(socio.fechaAprobacion)}</span>
                          {socio.fechaAprobacionAproximada && (
                            <span
                              className="ml-1.5 text-[11px] text-slate-400"
                              title="Se tomó la fecha de registro porque el socio fue aprobado antes de registrar fecha de aprobación"
                            >
                              (registro)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {(socio.motivos || []).map((motivo, i) => (
                              <span
                                key={`${socio.id}-motivo-${i}`}
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                              >
                                <FaCircleInfo className="text-[10px]" />
                                {motivo}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

