import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaChartPie,
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
  obtenerTodosLosUsuarios,
} from "@/services/adminServices";
import { obtenerDetalleEvento, obtenerEventosSocios } from "@/services/eventosService";
import { obtenerCuotasAdmin } from "@/services/finanzasServices";
import { formatearMonto } from "@/features/area-socio/utils/cuotas";
import { elegirProximoEvento } from "@/features/area-socio/utils/eventos";
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
  return `${f.getDate()}/${f.getMonth() + 1}`;
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
  });
}

export default function Inicio() {
  const [usuarios, setUsuarios] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [eventos, setEventos] = useState([]);
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
          resCuotas,
          resEventos,
          resRubros,
          resLocalidades,
          resAuditorias,
        ] = await Promise.all([
          obtenerTodosLosUsuarios(),
          obtenerCuotasAdmin(),
          obtenerEventosSocios(),
          obtenerDistribucionRubros(),
          obtenerDistribucionLocalidades(),
          obtenerAuditoriasAdmin({ page: 1, limit: 5 }),
        ]);

        if (!activo) return;

        if (resUsuarios?.exito && Array.isArray(resUsuarios.data)) {
          setUsuarios(resUsuarios.data);
        }
        if (resCuotas?.exito && Array.isArray(resCuotas.data)) {
          setCuotas(resCuotas.data);
        }
        if (resEventos?.exito && Array.isArray(resEventos.data)) {
          setEventos(resEventos.data);
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

  // 1. Estadísticas de Padrón y Solicitudes
  const conteoSocios = useMemo(() => {
    const aprobados = usuarios.filter((s) => s.estado === "aprobado");
    const pendientes = usuarios.filter((s) => s.estado === "pendiente").length;
    const activos = aprobados.filter((s) => s.categoria?.toLowerCase() === "activo").length;
    const padrinos = aprobados.filter((s) => s.categoria?.toLowerCase() === "padrino").length;
    const adherentes = aprobados.filter((s) => s.categoria?.toLowerCase() === "adherente").length;
    const degradadosMora = aprobados.filter((s) => Boolean(s.degradadoPorMora)).length;

    return {
      total: aprobados.length,
      activos,
      padrinos,
      adherentes,
      pendientes,
      degradadosMora,
    };
  }, [usuarios]);

  // 2. Estadísticas de Finanzas (Recaudación e Índice de Morosidad reales)
  const metricasFinanzas = useMemo(() => {
    if (cuotas.length === 0) {
      return {
        periodoEtiqueta: "Sin período activo",
        recaudadoPeriodo: 0,
        porcentajeCobrado: 0,
        pagadasPeriodo: 0,
        totalPeriodo: 0,
        porcentajeMorosidad: 0,
        sociosConDeuda: 0,
        cuotasImpagasCount: 0,
      };
    }

    const periodos = [...new Set(cuotas.map((c) => c.mes_anio).filter(Boolean))].sort().reverse();
    const ultimoPeriodo = periodos[0];
    const cuotasUltimoPeriodo = ultimoPeriodo
      ? cuotas.filter((c) => c.mes_anio === ultimoPeriodo)
      : cuotas;

    const pagadas = cuotasUltimoPeriodo.filter((c) => c.estado === "pagada");
    const recaudadoPeriodo = pagadas.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
    const porcentajeCobrado =
      cuotasUltimoPeriodo.length > 0
        ? Math.round((pagadas.length / cuotasUltimoPeriodo.length) * 100)
        : 0;

    // Morosidad sobre el total de cuotas emitidas
    const impagas = cuotas.filter((c) => c.estado === "pendiente" || c.estado === "vencida");
    const porcentajeMorosidad =
      cuotas.length > 0 ? Math.round((impagas.length / cuotas.length) * 100) : 0;

    const sociosDeudoresSet = new Set(
      impagas.map((c) => c.socio?.id || c.usuario_id).filter(Boolean)
    );

    return {
      periodoEtiqueta: ultimoPeriodo ? nombrePeriodo(ultimoPeriodo) : "General",
      recaudadoPeriodo,
      porcentajeCobrado,
      pagadasPeriodo: pagadas.length,
      totalPeriodo: cuotasUltimoPeriodo.length,
      porcentajeMorosidad,
      sociosConDeuda: sociosDeudoresSet.size,
      cuotasImpagasCount: impagas.length,
    };
  }, [cuotas]);

  // 3. Próxima capacitación real
  const proximoEvento = useMemo(() => elegirProximoEvento(eventos), [eventos]);
  const [detalleProximo, setDetalleProximo] = useState(null);

  useEffect(() => {
    let activo = true;
    if (!proximoEvento?.id) {
      setDetalleProximo(null);
      return undefined;
    }
    obtenerDetalleEvento(proximoEvento.id).then((res) => {
      if (activo && res?.exito && res.data) {
        setDetalleProximo(res.data);
      }
    });
    return () => {
      activo = false;
    };
  }, [proximoEvento?.id]);

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

              <div className="flex items-center gap-4">
                <span className="rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                  Total: {conteoSocios.total}
                </span>
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
                  Padrinos
                </p>
                <p className="mt-2 text-3xl font-semibold text-navy tabular-nums sm:text-4xl">
                  {conteoSocios.padrinos}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {conteoSocios.total > 0
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

          {/* Indicadores clave con datos reales */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* 1. Recaudación */}
            <section className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                      <FaHandHoldingDollar />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                      Recaudación del período
                    </h3>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                    {metricasFinanzas.periodoEtiqueta}
                  </span>
                </div>

                <p className="text-2xl font-semibold tracking-tight text-navy tabular-nums sm:text-3xl">
                  {formatearMonto(metricasFinanzas.recaudadoPeriodo)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {metricasFinanzas.totalPeriodo > 0
                    ? `${metricasFinanzas.porcentajeCobrado}% de las cuotas cobradas (${metricasFinanzas.pagadasPeriodo}/${metricasFinanzas.totalPeriodo})`
                    : "Aún no se registran cuotas emitidas"}
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

            {/* 2. Morosidad */}
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
                  {metricasFinanzas.porcentajeMorosidad}%
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {metricasFinanzas.cuotasImpagasCount > 0
                    ? `${metricasFinanzas.sociosConDeuda} ${metricasFinanzas.sociosConDeuda === 1 ? "socio" : "socios"} con cuotas impagas (${metricasFinanzas.cuotasImpagasCount} en total)`
                    : "Todos los socios se encuentran al día"}
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

            {/* 3. Próxima capacitación */}
            <section className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                      <FaCalendarCheck />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
                      Próxima capacitación
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
                      {proximoEvento.cupoMaximo
                        ? `${detalleProximo?.totalInscriptos ?? 0}/${proximoEvento.cupoMaximo} cupos inscriptos`
                        : "Cupo libre · Inscripción abierta"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold tracking-tight text-navy">
                      Sin programar
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      No hay capacitaciones próximas cargadas en agenda.
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
