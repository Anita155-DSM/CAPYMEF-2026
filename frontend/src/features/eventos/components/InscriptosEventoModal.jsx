import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarCheck,
  FaCheck,
  FaCheckDouble,
  FaDownload,
  FaMagnifyingGlass,
  FaUserCheck,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import dayjs from "@/shared/utils/fechas";
import {
  descargarCertificadoInscriptoAdmin,
  marcarAsistenciaInscripto,
  obtenerInscriptosEvento,
} from "@/services/eventosService";

/**
 * Modal administrativo para gestionar inscriptos, tomar asistencia (checklist)
 * y reimprimir certificados de asistencia de un evento.
 */
export default function InscriptosEventoModal({ evento, onClose, onEditar }) {
  useBloquearScroll(true);

  const [inscriptos, setInscriptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [marcandoTodos, setMarcandoTodos] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const res = await obtenerInscriptosEvento(evento.id);
    if (res.exito) {
      setInscriptos(Array.isArray(res.data) ? res.data : []);
    } else {
      setError(res.mensaje || "No se pudo obtener el listado de inscriptos.");
    }
    setCargando(false);
  }, [evento.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  const alternarAsistencia = async (inscripcion) => {
    const nuevoEstado = !inscripcion.asistio;
    setProcesandoId(inscripcion.id);
    const res = await marcarAsistenciaInscripto(evento.id, inscripcion.id, nuevoEstado);
    setProcesandoId(null);

    if (res.exito) {
      setInscriptos((prev) =>
        prev.map((item) => (item.id === inscripcion.id ? { ...item, asistio: nuevoEstado } : item))
      );
      toast.success(
        nuevoEstado
          ? `Asistencia confirmada para ${inscripcion.socio?.razonSocial || "el socio"}.`
          : `Se quitó la marca de asistencia de ${inscripcion.socio?.razonSocial || "el socio"}.`
      );
    } else {
      toast.error(res.mensaje || "No se pudo actualizar la asistencia.");
    }
  };

  const marcarTodosPresentes = async () => {
    const pendientes = inscriptos.filter((i) => !i.asistio);
    if (pendientes.length === 0) return;

    setMarcandoTodos(true);
    let fallos = 0;
    for (const insc of pendientes) {
      const res = await marcarAsistenciaInscripto(evento.id, insc.id, true);
      if (res.exito) {
        setInscriptos((prev) =>
          prev.map((item) => (item.id === insc.id ? { ...item, asistio: true } : item))
        );
      } else {
        fallos += 1;
      }
    }
    setMarcandoTodos(false);

    if (fallos === 0) {
      toast.success("Se marcó la asistencia de todos los inscriptos.");
    } else {
      toast.warning(`Se actualizaron los asistentes con ${fallos} error(es).`);
    }
  };

  const descargarCertificado = async (inscripcion) => {
    setDescargandoId(inscripcion.id);
    const res = await descargarCertificadoInscriptoAdmin(evento.id, inscripcion.id);
    setDescargandoId(null);

    if (!res.exito || !(res.data instanceof Blob)) {
      toast.error(res.mensaje || "No se pudo descargar el certificado.");
      return;
    }

    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    const razon = (inscripcion.socio?.razonSocial || "socio").replace(/\s+/g, "_");
    a.href = url;
    a.download = `certificado-${razon}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return inscriptos;
    return inscriptos.filter((i) => {
      const razon = (i.socio?.razonSocial || "").toLowerCase();
      const cuit = (i.socio?.cuit || "").toLowerCase();
      const email = (i.socio?.email || "").toLowerCase();
      return razon.includes(q) || cuit.includes(q) || email.includes(q);
    });
  }, [inscriptos, busqueda]);

  const totalPresentes = useMemo(
    () => inscriptos.filter((i) => i.asistio).length,
    [inscriptos]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animacion-modal flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-3xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-label={`Inscriptos a ${evento.titulo}`}
      >
        {/* Cabecera estilo Socio */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
              <FaUsers className="text-[11px]" /> Padrón de inscriptos y asistencia
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                evento.estado === "finalizado"
                  ? "bg-gray-100 text-gray-600"
                  : evento.estado === "cancelado"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {evento.estado || "programado"}
            </span>
          </div>

          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        <h2 className="mt-2 text-xl font-bold leading-snug text-navy sm:text-2xl">
          {evento.titulo}
        </h2>
        <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
          <FaCalendarCheck className="text-primary" />
          <span className="capitalize">
            {dayjs(evento.fecha).format("dddd D [de] MMMM, YYYY")}
          </span>
        </p>

        {/* Resumen rápido en 3 tarjetas */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-surface p-3.5 sm:p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Inscriptos
            </p>
            <p className="mt-0.5 text-lg font-bold text-navy tabular-nums">
              {inscriptos.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Presentes
            </p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700 tabular-nums">
              {totalPresentes}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Cupo máximo
            </p>
            <p className="mt-0.5 text-lg font-bold text-navy tabular-nums">
              {evento.cupoMaximo ? `${inscriptos.length} / ${evento.cupoMaximo}` : "Sin límite"}
            </p>
          </div>
        </div>

        {/* Barra de búsqueda y acción masiva */}
        {inscriptos.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por razón social, CUIT o correo..."
                className="w-full rounded-lg border border-slate-200 bg-surface/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {totalPresentes < inscriptos.length && (
              <button
                type="button"
                disabled={marcandoTodos}
                onClick={marcarTodosPresentes}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
              >
                <FaCheckDouble className="text-[11px]" />
                {marcandoTodos ? "Marcando..." : "Marcar todos presentes"}
              </button>
            )}
          </div>
        )}

        {/* Listado desplazable */}
        <div className="mt-4 flex-1 overflow-y-auto pr-0.5">
          {cargando ? (
            <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
              <p className="text-xs text-slate-500">Cargando listado de inscriptos...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs font-medium text-red-700">
              {error}
            </div>
          ) : inscriptos.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-surface/50 py-12 text-center">
              <span className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-xl bg-surface-blue text-lg text-primary">
                <FaUserCheck />
              </span>
              <p className="text-sm font-semibold text-navy">
                Aún no hay socios inscriptos en este evento
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cuando los socios confirmen su inscripción desde su panel, aparecerán listados aquí.
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-surface/50 py-8 text-center text-xs text-slate-500">
              No se encontraron inscriptos con "{busqueda}".
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white">
              {filtrados.map((item) => {
                const socio = item.socio || {};
                const estaProcesando = procesandoId === item.id;
                const estaDescargando = descargandoId === item.id;

                return (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-blue/30 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">
                        {socio.razonSocial || "Socio sin razón social"}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        {socio.cuit && <span className="tabular-nums">CUIT: {socio.cuit}</span>}
                        {socio.email && <span>· {socio.email}</span>}
                        {socio.telefono && <span>· Tel: {socio.telefono}</span>}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={estaProcesando}
                        onClick={() => alternarAsistencia(item)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                          item.asistio
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-surface-blue hover:text-navy"
                        }`}
                        title={
                          item.asistio
                            ? "Clic para quitar asistencia"
                            : "Clic para confirmar asistencia"
                        }
                      >
                        <FaCheck className="text-[11px]" />
                        {estaProcesando
                          ? "Guardando..."
                          : item.asistio
                          ? "Presente"
                          : "Marcar asistencia"}
                      </button>

                      {item.asistio && (
                        <button
                          type="button"
                          disabled={estaDescargando}
                          onClick={() => descargarCertificado(item)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-primary-dark disabled:opacity-50"
                          title="Descargar certificado de asistencia en PDF"
                        >
                          <FaDownload className="text-[11px]" />
                          {estaDescargando ? "..." : "Certificado"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Nota informativa sobre certificados */}
        <p className="mt-3 text-[11px] text-slate-500">
          Al confirmar la asistencia (<strong>Presente</strong>) y marcar el evento como{" "}
          <strong>Finalizado</strong>, el socio también podrá descargar su certificado desde su panel.
        </p>

        {/* Pie del modal */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          {onEditar ? (
            <button
              type="button"
              onClick={onEditar}
              className="cursor-pointer rounded-lg border border-primary/25 bg-surface-blue px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white sm:text-sm"
            >
              Editar datos del evento
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

