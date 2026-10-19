import { FaCalendarCheck, FaClock, FaDownload, FaLocationDot, FaUsers, FaXmark } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { linkReunion } from "../utils/eventos";
import { textoLugar } from "../utils/ubicacion";
import MapaEvento from "./MapaEvento";

const icono = "mr-2 inline text-[#0875b1]";
const btnPrincipal = "inline-flex items-center gap-2 bg-sidebar px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60 transition-colors";

function Lugar({ evento }) {
  const enlace = evento.yaInscripto ? linkReunion(evento) : null;
  if (enlace) return <a href={enlace} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0875b1] hover:underline">Unirme a la reunión virtual</a>;
  if (evento.modalidad === "virtual") {
    return evento.yaInscripto ? "Virtual (el enlace se informará por correo)" : "Virtual (el enlace se habilita al inscribirte)";
  }
  return textoLugar(evento);
}

/** Renderizar solo con evento: {evento && <EventoDetalleModal … />} */
export default function EventoDetalleModal({ evento, otros = [], procesando, onInscripcion, onCertificado, onSeleccionar, onClose }) {
  const finalizado = evento.estado === "finalizado";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Evento para socios{finalizado ? " · Finalizado" : ""}</p>
            <h2 className="mt-1 text-2xl font-bold text-navy">{evento.titulo}</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="text-xl text-gray-500 hover:text-black">
            <FaXmark />
          </button>
        </div>

        <p className="mt-4 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">{evento.descripcion || "Sin descripción disponible."}</p>

        <div className="mt-5 space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700">
          <p><FaCalendarCheck className={icono} />{dayjs(evento.fecha).format("dddd D [de] MMMM, YYYY")}</p>
          <p><FaClock className={icono} />{evento.horaInicio || "Horario a confirmar"}{evento.horaFin ? ` a ${evento.horaFin}` : ""}</p>
          <p><FaUsers className={icono} />{evento.cupoMaximo ? `${evento.cupoMaximo} cupos` : "Cupo abierto"}</p>
          {evento.yaInscripto && <p className="font-bold text-[#247c5c]">Ya estás inscripto a este evento.</p>}
        </div>

        <MapaEvento evento={evento} />

        {otros.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-[#66727d]">Otros eventos ese día</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {otros.map((o) => (
                <button key={o.id} type="button" onClick={() => onSeleccionar(o)} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-1 text-xs text-[#17384f] hover:bg-[#e7f2f8]">
                  {o.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="border border-gray-300 px-4 py-2 text-sm">Cerrar</button>
          {finalizado ? (
            evento.yaInscripto && (
              <button type="button" disabled={procesando} onClick={onCertificado} className={btnPrincipal}>
                {procesando ? "Descargando..." : "Descargar certificado"} <FaDownload />
              </button>
            )
          ) : (
            <button type="button" disabled={procesando} onClick={onInscripcion} className={btnPrincipal}>
              {procesando ? "Procesando..." : evento.yaInscripto ? "Cancelar inscripción" : "Inscribirme"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
