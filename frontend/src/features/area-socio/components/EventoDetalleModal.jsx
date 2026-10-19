import { useEffect } from "react";
import { FaCalendarCheck, FaCircleCheck, FaClock, FaDownload, FaLocationDot, FaUsers, FaXmark } from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import dayjs from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { describirLugar, linkReunion, textoCupos, textoHorario, yaTermino } from "../utils/eventos";
import MapaEvento from "./MapaEvento";

const icono = "mr-2 inline text-[#0875b1]";
const btnPrincipal = "inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#164568] disabled:cursor-not-allowed disabled:opacity-60";

function Lugar({ evento }) {
  // El link de una reunión virtual solo se muestra a quien ya está inscripto
  const reunion = evento.yaInscripto ? linkReunion(evento) : null;
  if (reunion) return <a href={reunion} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0875b1] hover:underline">Unirme a la reunión virtual</a>;
  if (evento.modalidad === "virtual") {
    return evento.yaInscripto ? "Virtual (el enlace se informará por correo)" : "Virtual (el enlace se habilita al inscribirte)";
  }
  const lugar = describirLugar(evento);
  if (lugar.href) return <a href={lugar.href} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0875b1] hover:underline">{lugar.texto}</a>;
  return lugar.texto;
}

/**
 * Renderizar solo con evento: {evento && <EventoDetalleModal … />}
 *   cupoDisponible: undefined = consultando · null = sin límite / no se pudo saber · número = cupos libres
 */
export default function EventoDetalleModal({ evento, otros = [], procesando, cupoDisponible, onInscripcion, onCertificado, onSeleccionar, onClose }) {
  useBloquearScroll(true);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  const finalizado = evento.estado === "finalizado";
  const termino = yaTermino(evento); // por estado o por fecha (el backend no finaliza solo)
  const agotado = typeof cupoDisponible === "number" && cupoDisponible <= 0;
  const imagen = urlImagen(evento.imagenUrl);

  // Aviso según la situación REAL del evento y de la inscripción
  let aviso = "";
  if (finalizado) {
    aviso = evento.yaInscripto
      ? "El certificado se habilita cuando la administración confirma tu asistencia."
      : "Este evento ya finalizó.";
  } else if (termino) {
    aviso = evento.yaInscripto
      ? "Este evento ya se realizó. Si asististe, vas a poder descargar el certificado cuando la administración lo cierre y confirme tu asistencia."
      : "Este evento ya se realizó.";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={evento.titulo}>
        {imagen && <img src={imagen} alt={evento.titulo} className="mb-4 h-40 w-full rounded-xl object-cover" />}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              Evento {evento.modalidad === "virtual" ? "virtual" : "presencial"}{finalizado ? " · Finalizado" : ""}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy">{evento.titulo}</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="text-xl text-gray-500 hover:text-black">
            <FaXmark />
          </button>
        </div>

        <p className="mt-4 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">{evento.descripcion || "Sin descripción disponible."}</p>

        <div className="mt-5 space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700">
          <p className="first-letter:uppercase"><FaCalendarCheck className={icono} />{dayjs(evento.fecha).format("dddd D [de] MMMM, YYYY")}</p>
          <p><FaClock className={icono} />{textoHorario(evento)}</p>
          <p className="break-words"><FaLocationDot className={icono} /><Lugar evento={evento} /></p>
          <p><FaUsers className={icono} />{textoCupos(evento, cupoDisponible)}</p>
          {evento.yaInscripto && (
            <p className="inline-flex items-center gap-2 font-bold text-[#247c5c]"><FaCircleCheck /> Ya estás inscripto a este evento.</p>
          )}
        </div>

        <MapaEvento evento={evento} />

        {otros.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-[#66727d]">Otros eventos ese día</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {otros.map((o) => (
                <button key={o.id} type="button" onClick={() => onSeleccionar(o)} className="rounded-md border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-1 text-xs text-[#17384f] hover:bg-[#e7f2f8]">
                  {o.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {aviso && <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-sm text-gray-600">{aviso}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cerrar</button>
          {finalizado ? (
            evento.yaInscripto && (
              <button type="button" disabled={procesando} onClick={onCertificado} className={btnPrincipal}>
                {procesando ? "Descargando..." : "Descargar certificado"} <FaDownload />
              </button>
            )
          ) : (
            !termino &&
            (agotado && !evento.yaInscripto ? (
              <button type="button" disabled className={btnPrincipal}>Cupos agotados</button>
            ) : (
              <button type="button" disabled={procesando} onClick={onInscripcion} className={btnPrincipal}>
                {procesando ? "Procesando..." : evento.yaInscripto ? "Cancelar inscripción" : "Inscribirme"}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}