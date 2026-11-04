import { useEffect, useMemo } from "react";
import {
  FaCalendarCheck,
  FaCircleCheck,
  FaClock,
  FaDownload,
  FaLocationDot,
  FaUsers,
  FaVideo,
  FaXmark,
} from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import dayjs from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { describirLugar, linkReunion, textoCupos, textoHorario, yaTermino } from "../../utils/eventos";
import MapaEvento from "./MapaEvento";

function Lugar({ evento }) {
  // El link de una reunión virtual solo se muestra a quien ya está inscripto
  const reunion = evento.yaInscripto ? linkReunion(evento) : null;
  if (reunion) {
    return (
      <a
        href={reunion}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary transition-colors hover:text-primary-dark hover:underline"
      >
        Unirme a la reunión virtual (enlace directo)
      </a>
    );
  }
  if (evento.modalidad === "virtual") {
    return evento.yaInscripto
      ? "Virtual (el enlace de acceso se informará por correo)"
      : "Virtual (el enlace se habilita al confirmar tu inscripción)";
  }
  const lugar = describirLugar(evento);
  if (lugar.href) {
    return (
      <a
        href={lugar.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary transition-colors hover:text-primary-dark hover:underline"
      >
        {lugar.texto}
      </a>
    );
  }
  return lugar.texto;
}

/**
 * Modal detallado de evento para socios.
 * Muestra la información completa con la imagen adaptada a todo el ancho (estilo NoticiaModal),
 * ficha estructurada de datos y gestión de asistencia/inscripción.
 */
export default function EventoDetalleModal({
  evento,
  otros = [],
  procesando,
  cupoDisponible,
  onInscripcion,
  onCertificado,
  onSeleccionar,
  onClose,
}) {
  useBloquearScroll(true);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  const finalizado = evento.estado === "finalizado";
  const termino = yaTermino(evento);
  const agotado = typeof cupoDisponible === "number" && cupoDisponible <= 0;
  const imagen = urlImagen(evento.imagenUrl);
  const esVirtual = evento.modalidad === "virtual";
  const IconoLugar = esVirtual ? FaVideo : FaLocationDot;

  // Logos externos (CAME, entidades gubernamentales, auspiciantes)
  const logos = useMemo(() => {
    if (!evento?.logosExternos) return [];
    if (Array.isArray(evento.logosExternos)) return evento.logosExternos;
    try {
      const parsed = JSON.parse(evento.logosExternos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [evento?.logosExternos]);

  // Mensaje de estado informativo
  let aviso = "";
  if (finalizado) {
    aviso = evento.yaInscripto
      ? "El certificado de asistencia estará habilitado para descargar una vez que la administración confirme tu presencia."
      : "Este evento ya ha finalizado.";
  } else if (termino) {
    aviso = evento.yaInscripto
      ? "Este evento ya concluyó. Vas a poder descargar tu certificado cuando la administración confirme la asistencia de los participantes."
      : "Este evento ya se realizó.";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animacion-modal max-h-[90vh] w-full max-w-2xl sm:max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-label={evento.titulo}
      >
        {/* Cabecera del modal: Insignias de estado y botón de cierre */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
              <IconoLugar className="text-[11px]" />
              {esVirtual ? "Modalidad Virtual" : "Modalidad Presencial"}
            </span>

            {finalizado && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                Finalizado
              </span>
            )}

            {evento.yaInscripto && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <FaCircleCheck className="text-[11px]" /> Estás inscripto
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        {/* Título principal */}
        <h2 className="mt-3 text-xl font-bold leading-snug text-navy sm:text-2xl">
          {evento.titulo}
        </h2>

        {/* Imagen del evento adaptada a todo el ancho del espacio (idéntico al modal de noticias) */}
        {imagen && (
          <img
            src={imagen}
            alt={evento.titulo}
            className="mt-4 h-64 sm:h-80 w-full rounded-xl object-cover shadow-xs"
          />
        )}

        {/* Ficha estructurada de datos clave (Fecha, Horario, Ubicación, Cupos) */}
        <div className="mt-5 grid grid-cols-1 gap-3.5 rounded-xl border border-gray-100 bg-surface p-4 sm:grid-cols-2 sm:p-5">
          {/* Fecha */}
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaCalendarCheck className="text-base" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Fecha
              </p>
              <p className="truncate text-xs font-bold capitalize text-navy sm:text-sm">
                {dayjs(evento.fecha).format("dddd D [de] MMMM, YYYY")}
              </p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaClock className="text-base" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Horario
              </p>
              <p className="truncate text-xs font-bold text-navy sm:text-sm">
                {textoHorario(evento)}
              </p>
            </div>
          </div>

          {/* Ubicación / Enlace */}
          <div className="flex items-start gap-3 sm:col-span-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <IconoLugar className="text-base" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {esVirtual ? "Plataforma de reunión" : "Lugar del encuentro"}
              </p>
              <div className="break-words text-xs font-bold text-navy sm:text-sm">
                <Lugar evento={evento} />
              </div>
            </div>
          </div>

          {/* Disponibilidad / Cupos */}
          <div className="flex items-center gap-3 sm:col-span-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaUsers className="text-base" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Disponibilidad
              </p>
              <p className="text-xs font-bold text-navy sm:text-sm">
                {textoCupos(evento, cupoDisponible)}
              </p>
            </div>
          </div>
        </div>

        {/* Descripción del evento */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Descripción y temario
          </p>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {evento.descripcion || "Sin descripción adicional informada para esta actividad."}
            </p>
          </div>
        </div>

        {/* Mapa interactivo si es presencial */}
        <MapaEvento evento={evento} />

        {/* Logos institucionales co-organizadores / auspiciantes */}
        {logos.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Organizan y auspician
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {logos.map((logoUrl, idx) => (
                <img
                  key={idx}
                  src={logoUrl}
                  alt="Institución participante"
                  className="h-10 max-w-[130px] rounded-lg border border-gray-100 bg-white p-1.5 object-contain shadow-2xs"
                />
              ))}
            </div>
          </div>
        )}

        {/* Otros eventos en la misma fecha */}
        {otros.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Otras actividades programadas para este día
            </p>
            <div className="flex flex-wrap gap-2">
              {otros.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSeleccionar(o)}
                  className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-primary/40 hover:bg-surface-blue"
                >
                  {o.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aviso según estado */}
        {aviso && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-surface-blue/50 p-3.5 text-xs leading-relaxed text-gray-700">
            {aviso}
          </div>
        )}

        {/* Pie de acciones del modal */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cerrar
          </button>

          {finalizado ? (
            evento.yaInscripto && (
              <button
                type="button"
                disabled={procesando}
                onClick={onCertificado}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {procesando ? "Descargando..." : "Descargar certificado"} <FaDownload />
              </button>
            )
          ) : (
            !termino &&
            (agotado && !evento.yaInscripto ? (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-500"
              >
                Cupos agotados
              </button>
            ) : (
              <button
                type="button"
                disabled={procesando}
                onClick={onInscripcion}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold shadow-sm transition-colors ${
                  evento.yaInscripto
                    ? "border border-red-300 bg-white text-red-600 hover:bg-red-50"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                {procesando
                  ? "Procesando..."
                  : evento.yaInscripto
                  ? "Cancelar inscripción"
                  : "Inscribirme al evento"}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
