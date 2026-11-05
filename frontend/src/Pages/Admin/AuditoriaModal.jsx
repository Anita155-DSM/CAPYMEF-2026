import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaClipboardList,
  FaMagnifyingGlass,
  FaXmark,
} from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import Paginacion from "@/shared/ui/Paginacion";
import { obtenerAuditoriasAdmin } from "@/services/adminServices";

const MODULOS = [
  { valor: "", texto: "Todos los módulos" },
  { valor: "ADMIN", texto: "Socios y Solicitudes" },
  { valor: "CUOTAS", texto: "Cuotas y Cobranzas" },
  { valor: "TARIFAS", texto: "Tarifas" },
  { valor: "EVENTOS", texto: "Eventos" },
  { valor: "NOTICIAS", texto: "Noticias" },
  { valor: "AUTH", texto: "Autenticación" },
];

const ACCIONES = [
  { valor: "", texto: "Todas las acciones" },
  { valor: "CREACION", texto: "Creación / Alta" },
  { valor: "MODIFICACION", texto: "Modificación" },
  { valor: "ELIMINACION", texto: "Eliminación / Baja" },
];

const ESTILO_ACCION = {
  CREACION: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MODIFICACION: "border-primary/20 bg-surface-blue text-primary",
  ELIMINACION: "border-red-200 bg-red-50 text-red-700",
};

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return "-";
  const f = new Date(fechaIso);
  if (Number.isNaN(f.getTime())) return "-";
  return f.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditoriaModal({ onClose }) {
  const [registros, setRegistros] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [modulo, setModulo] = useState("");
  const [accionTipo, setAccionTipo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useBloquearScroll();

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const res = await obtenerAuditoriasAdmin({
      page: pagina,
      limit: 8,
      busqueda,
      modulo,
      accionTipo,
    });

    if (res.exito && Array.isArray(res.data)) {
      setRegistros(res.data);
      setTotalRegistros(res.totalRegistros ?? res.data.length);
      setTotalPaginas(Math.max(1, res.totalPaginas || 1));
    } else {
      setError(res.mensaje || "No se pudo consultar el historial de auditoría.");
    }
    setCargando(false);
  }, [pagina, busqueda, modulo, accionTipo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarModulo = (valor) => {
    setModulo(valor);
    setPagina(1);
  };

  const cambiarAccion = (valor) => {
    setAccionTipo(valor);
    setPagina(1);
  };

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor);
    setPagina(1);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-auditoria"
      onClick={onClose}
      className="animacion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 font-socio backdrop-blur-xs sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animacion-modal relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-navy shadow-2xl"
      >
        {/* Cabecera estilo Socio */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-3 py-1 text-xs font-semibold text-primary">
                <FaClipboardList className="text-[11px]" /> Trazabilidad del sistema
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
                {totalRegistros} {totalRegistros === 1 ? "registro" : "registros"}
              </span>
            </div>
            <h2
              id="titulo-modal-auditoria"
              className="mt-2.5 text-xl font-semibold leading-snug text-navy sm:text-2xl"
            >
              Historial de auditoría
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registro cronológico de altas, modificaciones, cobros y acciones administrativas realizadas en el portal.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-navy"
          >
            <FaXmark />
          </button>
        </div>

        {/* Barra de filtros */}
        <div className="shrink-0 border-b border-slate-100 bg-surface/60 px-5 py-3.5 sm:px-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => cambiarBusqueda(e.target.value)}
                placeholder="Buscar por usuario o detalle..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-navy placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
              />
            </div>

            <select
              value={modulo}
              onChange={(e) => cambiarModulo(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
            >
              {MODULOS.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.texto}
                </option>
              ))}
            </select>

            <select
              value={accionTipo}
              onChange={(e) => cambiarAccion(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
            >
              {ACCIONES.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.texto}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {cargando ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-14 text-center">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-3 border-surface-blue" />
                <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
              <p className="mt-3 text-sm font-semibold text-navy">Cargando registros de auditoría...</p>
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 sm:text-sm">
              {error}
            </p>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-12 text-center">
              <p className="text-sm font-semibold text-navy">No se encontraron registros</p>
              <p className="mt-1 text-xs text-slate-500">
                No hay movimientos que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {registros.map((item) => {
                const claseAccion =
                  ESTILO_ACCION[item.accionTipo] || "border-slate-200 bg-slate-100 text-slate-600";
                return (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200/80 bg-surface/50 p-3.5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${claseAccion}`}
                        >
                          {item.accionTipo || "ACCIÓN"}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200/80">
                          {item.modulo || "SISTEMA"}
                        </span>
                        <span className="text-xs font-semibold text-navy">
                          {item.usuarioNombre || "Administrador"}
                        </span>
                      </div>
                      <p className="wrap-break-word text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {item.descripcion}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-medium text-slate-400 tabular-nums">
                      {formatearFechaHora(item.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {!cargando && totalPaginas > 1 && (
            <div className="mt-5">
              <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-surface/60 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

