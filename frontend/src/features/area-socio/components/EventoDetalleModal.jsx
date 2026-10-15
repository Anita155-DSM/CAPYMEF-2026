import { FaCalendarCheck, FaClock, FaLocationDot, FaUsers, FaXmark } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";

const icono = "mr-2 inline text-[#0875b1]";

/** Renderizar solo con evento: {evento && <EventoDetalleModal … />} */
export default function EventoDetalleModal({ evento, procesando, onInscripcion, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Evento para socios</p>
            <h2 className="mt-1 text-2xl font-bold text-navy">{evento.titulo}</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="text-xl text-gray-500 hover:text-black">
            <FaXmark />
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-700 max-h-32 overflow-y-auto">{evento.descripcion || "Sin descripción disponible."}</p>

        <div className="mt-5 space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700">
          <p><FaCalendarCheck className={icono} />{dayjs(evento.fecha).format("dddd D [de] MMMM, YYYY")}</p>
          <p><FaClock className={icono} />{evento.horaInicio || "Horario a confirmar"}{evento.horaFin ? ` a ${evento.horaFin}` : ""}</p>
          <p><FaLocationDot className={icono} />{evento.lugar || evento.modalidad || "Lugar a confirmar"}</p>
          <p><FaUsers className={icono} />{evento.cupoMaximo ? `${evento.cupoMaximo} cupos` : "Cupo abierto"}</p>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="border border-gray-300 px-4 py-2 text-sm">Cerrar</button>
          <button
            type="button"
            disabled={procesando}
            onClick={onInscripcion}
            className="bg-sidebar px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60 transition-colors"
          >
            {procesando ? "Procesando..." : evento.yaInscripto ? "Cancelar inscripción" : "Inscribirme"}
          </button>
        </div>
      </div>
    </div>
  );
}
