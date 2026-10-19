import { FaCalendarCheck, FaClock, FaLocationDot } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { textoLugar } from "../utils/ubicacion";

/** Tarjeta del próximo evento. Al tocarla se abre el detalle (con el mapa). */
export default function ProximoEventoCard({ evento, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border-l-4 border-primary p-4 shadow-sm w-full lg:w-80 shrink-0 rounded-r text-left hover:bg-[#f7fbfe] transition-colors"
    >
      <p className="text-[11px] font-bold text-primary uppercase mb-1 tracking-wider">Próximo evento</p>
      <p className="font-bold text-navy truncate" title={evento.titulo}>{evento.titulo}</p>
      <div className="mt-2 text-xs text-gray-600 space-y-1.5 font-medium">
        <p><FaCalendarCheck className="inline mr-2 text-[#0875b1]" /> {dayjs(evento.fecha).format("D [de] MMMM, YYYY")}</p>
        <p>
          <FaClock className="inline mr-2 text-[#0875b1]" /> {evento.horaInicio || "A confirmar"}
          {evento.horaFin ? ` a ${evento.horaFin}` : ""}
        </p>
        <p className="truncate">
          <FaLocationDot className="inline mr-2 text-[#0875b1]" /> {textoLugar(evento)}
        </p>
      </div>
    </button>
  );
}
