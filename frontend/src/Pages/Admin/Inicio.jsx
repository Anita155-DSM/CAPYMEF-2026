import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaChartPie,
  FaCheckToSlot,
  FaClipboardCheck,
  FaClipboardList,
  FaHandHoldingDollar,
  FaLocationDot,
  FaTriangleExclamation,
  FaUserGroup,
} from "react-icons/fa6";
import {
  obtenerAuditoriasAdmin,
  obtenerDistribucionLocalidades,
  obtenerDistribucionRubros,
  obtenerResumenInicioAdmin,
  obtenerTodosLosUsuarios,
} from "@/services/adminServices";
import { formatearMonto } from "@/features/area-socio/utils/cuotas";
import { nombrePeriodo } from "@/features/finanzas/utils/cuotas";
import AuditoriaModal from "./AuditoriaModal";

const ESTILO_ACCION = {
  CREACION: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MODIFICACION: "border-primary/20 bg-surface-blue text-primary",
  ELIMINACION: "border-red-200 bg-red-50 text-red-700",
};

function formatearDiaMes(fechaIso) {
  if (!fechaIso) return null;
  const partes = String(fechaIso).slice(0, 10).split("-");
  if (partes.length === 3) {
    return `${Number(partes[2])}/${Number(partes[1])}`;
  }
  const f = new Date(fechaIso);
  if (Number.isNaN(f.getTime())) return null;
  return f.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatearFechaHoraCorta(fechaIso) {
  if (!fechaIso) return "-";
  const f = new Date(fechaIso);
  if (Number.isNaN(f.getTime())) return "-";
  return f.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default function Inicio() {
  const [usuarios, setUsuarios] = useState([]);
  const [resumenInicio, setResumenInicio] = useState(null);
  const [rubros, setRubros] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [auditoriasRecientes, setAuditoriasRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarDashboard = async () => {
      setCargando(true);
      try {
        const [
          resUsuarios,
          resResumen,
          resRubros,
          resLocalidades,
          resAuditorias,
        ] = await Promise.all([
          obtenerTodosLosUsuarios(),
          obtenerResumenInicioAdmin(),
          obtenerDistribucionRubros(),
          obtenerDistribucionLocalidades(),
          obtenerAuditoriasAdmin({ page: 1, limit: 5 }),
        ]);

        if (!activo) return;

        if (resUsuarios?.exito && Array.isArray(resUsuarios.data)) {
          setUsuarios(resUsuarios.data);
        }
        if (resResumen?.exito && resResumen.data) {
          setResumenInicio(resResumen.data);
        }
        if (resRubros?.exito && Array.isArray(resRubros.data)) {
          setRubros(resRubros.data);
        }
        if (resLocalidades?.exito && Array.isArray(resLocalidades.data)) {
          setLocalidades(resLocalidades.data);
        }
        if (resAuditorias?.exito && Array.isArray(resAuditorias.data)) {
          setAuditoriasRecientes(resAuditorias.data);
        }
      } catch (error) {
        console.error("Error al cargar datos del resumen general:", error);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDashboard();
    return () => {
      activo = false;
    };
  }, []);

  // 1. Estadísticas de Padrón y Solicitudes (excluyendo cuentas de gestión rol === "admin")
  const conteoSocios = useMemo(() => {
    const soloSocios = usuarios.filter((s) => s.rol !== "admin");
    const aprobados = soloSocios.filter((s) => s.estado === "aprobado");
    const pendientes = soloSocios.filter((s) => s.estado === "pendiente").length;
    const activos = aprobados.filter((s) => s.categoria?.toLowerCase() === "activo").length;
    const padrinos = aprobados.filter((s) => s.categoria?.toLowerCase() === "padrino").length;
    const adherentes = aprobados.filter((s) => s.categoria?.toLowerCase() === "adherente").length;
    const honorarios = aprobados.filter((s) => s.categoria?.toLowerCase() === "honorario").length;
    const degradadosMora = aprobados.filter((s) => Boolean(s.degradadoPorMora)).length;

    return {
      total: aprobados.length,
      activos,
      padrinos,
      adherentes,
      honorarios,
      pendientes,
      degradadosMora,
    };
  }, [usuarios]);

  const recaudacion = resumenInicio?.recaudacion;
  const morosidad = resumenInicio?.morosidad;
  const proximoEvento = resumenInicio?.proximoEvento;
  const periodoEtiqueta = resumenInicio?.periodo
    ? nombrePeriodo(resumenInicio.periodo)
    : "Mes actual";

  return (
    <div className="space-y-6 pb-8">
      {/* Cabecera institucional unificada */}
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
              Administración · Inicio
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Resumen general de CAPYMEF
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Estado actual del padrón de socios, indicadores financieros, próximas actividades y distribución provincial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {conteoSocios.pendientes > 0 && (
              <Link
                to="/admin/registros"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100 sm:text-sm"
              >
                <FaClipboardCheck />
                Solicitudes pendientes ({conteoSocios.pendientes})
              </Link>
            )}

            <Link
              to="/admin/padron"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface-blue sm:text-sm"
            >
              <FaCheckToSlot /> Padrón de votantes
            </Link>

            <button
              type="button"
              onClick={() => setModalAuditoriaAbierto(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy sm:text-sm"
            >
              <FaClipboardList /> Historial de auditoría
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
            Cargando resumen general...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Consolidando indicadores de socios, finanzas, eventos y reportes.
          </p>
        </div>
      ) : (
        <>
          {/* Tarjeta principal de Padrón de Socios */}
          <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                  <FaUserGroup />
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                  Padrón de socios aprobados
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                  Total: {conteoSocios.total}
                </span>
                <Link
                  to="/admin/padron"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
                >
                  Padrón de votantes <FaArrowRight className="text-[10px]" />
                </Link>
                <Link
                  to="/admin/socios"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
                >
                  Ver padrón <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-none border border-primary/20 bg-linear-to-br from-navy via-sidebar to-primary p-5 text-white shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8bd0f8]">
                  Total Socios
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums sm:text-4xl">
                  {conteoSocios.total}
                </p>
                <p className="mt-1.5 text-xs text-white/80">
                  Empresas con alta aprobada
                </p>
              </div>

              <div className="rounded-none border border-slate-200/70 bg-surface/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Activos
                </p>
                <p className="mt-2 text-3xl font-semibold text-navy tabular-nums sm:text-4xl">
                  {conteoSocios.activos}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {conteoSocios.total > 0
                    ? `${Math.round((conteoSocios.activos / conteoSocios.total) * 100)}% del padrón`
                    : "Sin registros"}
                </p>
              </div>

              <div className="rounded-none border border-slate-200/70 bg-surface/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Padrinos {conteoSocios.honorarios > 0 ? `/ Honorarios` : ""}
                </p>
                <p className="mt-2 text-3xl font-semibold text-navy tabular-nums sm:text-4xl">
                  {conteoSocios.padrinos + conteoSocios.honorarios}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {conteoSocios.honorarios > 0
                    ? `${conteoSocios.padrinos} padrinos · ${conteoSocios.honorarios} honorarios`
                    : conteoSocios.total > 0
                      ? `${Math.round((conteoSocios.padrinos / conteoSocios.total) * 100)}% del padrón`
                      : "Sin registros"}
                </p>
              </div>

              <div className="rounded-none border border-slate-200/70 bg-surface/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Adherentes
                </p>
                <p className="mt-2 text-3xl font-semibold text-navy tabular-nums sm:text-4xl">
                  {conteoSocios.adherentes}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {conteoSocios.degradadosMora > 0
                    ? `${conteoSocios.degradadosMora} por mora de cuotas`
                    : conteoSocios.total > 0
                      ? `${Math.round((conteoSocios.adherentes / conteoSocios.total) * 100)}% del padrón`
                      : "Sin registros"}
                </p>
              </div>
            </div>
          </section>

          {/* Indicadores clave con datos reales de GET /api/admin/resumen-inicio */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* 1. Recaudación del mes */}
            <section className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                      <FaHandHoldingDollar />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                      Recaudación del mes
                    </h3>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                    {periodoEtiqueta}
                  </span>
                </div>

                <p className="text-2xl font-semibold tracking-tight text-navy tabular-nums sm:text-3xl">
                  {formatearMonto(recaudacion?.montoRecaudado ?? 0)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {recaudacion?.porcentajeCobrado != null
                    ? `${recaudacion.porcentajeCobrado}% de las cuotas cobradas (${recaudacion.cuotasPagadas}/${recaudacion.cuotasDelMes})`
                    : "Sin cuotas emitidas en el período"}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <Link
                  to="/admin/finanzas"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
                >
                  Ir a finanzas y cuotas <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </section>

            {/* 2. Índice de morosidad */}
            <section className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                      <FaTriangleExclamation />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                      Índice de morosidad
                    </h3>
                  </div>
                </div>

                <p className="text-2xl font-semibold tracking-tight text-navy tabular-nums sm:text-3xl">
                  {morosidad?.indice != null ? `${morosidad.indice}%` : "—"}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {morosidad?.indice == null
                    ? "Todavía no hay cuotas generadas para calcular morosidad"
                    : `${morosidad.sociosEnRiesgo ?? 0} ${
                        morosidad.sociosEnRiesgo === 1 ? "socio" : "socios"
                      } en riesgo (${morosidad.umbralRiesgo ?? 2} cuotas impagas)`}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <Link
                  to="/admin/finanzas"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
                >
                  Consultar estado de cobros <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </section>

            {/* 3. Próximo evento */}
            <section className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                      <FaCalendarCheck />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                      Próximo evento
                    </h3>
                  </div>
                  {proximoEvento?.modalidad && (
                    <span className="rounded-full bg-surface-blue px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary">
                      {proximoEvento.modalidad}
                    </span>
                  )}
                </div>

                {proximoEvento ? (
                  <>
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-semibold tracking-tight text-navy tabular-nums sm:text-3xl">
                        {formatearDiaMes(proximoEvento.fecha) || "-"}
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-700" title={proximoEvento.titulo}>
                        {proximoEvento.titulo}
                      </p>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      {proximoEvento.cupoMaximo != null
                        ? `${proximoEvento.inscriptos ?? 0}/${proximoEvento.cupoMaximo} inscriptos (${proximoEvento.cuposDisponibles ?? 0} disponibles)`
                        : `${proximoEvento.inscriptos ?? 0} inscriptos · Cupo libre`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold tracking-tight text-navy">
                      Sin programar
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      No hay próximos eventos cargados en agenda.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <Link
                  to="/admin/eventos"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
                >
                  Gestionar agenda de eventos <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </section>
          </div>

          {/* Distribución por Rubros y Localidades */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribución por Rubro */}
            <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                    <FaChartPie />
                  </span>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                    Socios por rubro productivo
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {rubros.length} {rubros.length === 1 ? "rubro" : "rubros"}
                </span>
              </div>

              {rubros.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No hay datos de rubros disponibles todavía.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rubros.slice(0, 6).map((item, idx) => {
                    const cantidad = Number(item.cantidad) || 0;
                    const porcentaje =
                      conteoSocios.total > 0
                        ? Math.round((cantidad / conteoSocios.total) * 100)
                        : 0;
                    return (
                      <li key={item.rubro || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy">
                            {item.rubro || "Sin especificar"}
                          </span>
                          <span className="font-medium text-slate-500 tabular-nums">
                            {cantidad} {cantidad === 1 ? "socio" : "socios"} ({porcentaje}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.max(porcentaje, 4)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Distribución por Localidad */}
            <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                    <FaLocationDot />
                  </span>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                    Distribución por localidad
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {localidades.length} {localidades.length === 1 ? "localidad" : "localidades"}
                </span>
              </div>

              {localidades.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No hay datos de localidades disponibles todavía.
                </p>
              ) : (
                <ul className="space-y-3">
                  {localidades.slice(0, 6).map((item, idx) => {
                    const cantidad = Number(item.cantidad) || 0;
                    const porcentaje =
                      conteoSocios.total > 0
                        ? Math.round((cantidad / conteoSocios.total) * 100)
                        : 0;
                    return (
                      <li key={item.localidad || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy">
                            {item.localidad || "Sin especificar"}
                          </span>
                          <span className="font-medium text-slate-500 tabular-nums">
                            {cantidad} {cantidad === 1 ? "socio" : "socios"} ({porcentaje}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-sidebar transition-all"
                            style={{ width: `${Math.max(porcentaje, 4)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Actividad reciente del sistema (Auditoría) */}
          <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                  <FaClipboardList />
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                  Actividad reciente del sistema
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalAuditoriaAbierto(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-navy"
              >
                Ver historial completo <FaArrowRight className="text-[10px]" />
              </button>
            </div>

            {auditoriasRecientes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Todavía no hay registros de actividad en la auditoría.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {auditoriasRecientes.map((item) => {
                  const claseAccion =
                    ESTILO_ACCION[item.accionTipo] ||
                    "border-slate-200 bg-slate-100 text-slate-600";
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${claseAccion}`}
                        >
                          {item.accionTipo || "ACCIÓN"}
                        </span>
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {item.modulo || "SISTEMA"}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-xs text-slate-700 sm:text-sm">
                          <strong className="font-semibold text-navy">
                            {item.usuarioNombre || "Admin"}:
                          </strong>{" "}
                          {item.descripcion}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] font-medium text-slate-400 tabular-nums">
                        {formatearFechaHoraCorta(item.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {modalAuditoriaAbierto && (
        <AuditoriaModal onClose={() => setModalAuditoriaAbierto(false)} />
      )}
    </div>
  );
}
