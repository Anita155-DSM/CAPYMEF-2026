import { FaCalendarCheck, FaClock, FaLocationDot } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";

export default function ProximoEventoCard({ evento }) {
  return (
    <div className="bg-white border-l-4 border-primary p-4 shadow-sm w-full lg:w-80 shrink-0 rounded-r">
      <p className="text-[11px] font-bold text-primary uppercase mb-1 tracking-wider">Próximo evento</p>
      <p className="font-bold text-navy truncate" title={evento.titulo}>{evento.titulo}</p>
      <div className="mt-2 text-xs text-gray-600 space-y-1.5 font-medium">
        <p><FaCalendarCheck className="inline mr-2 text-[#0875b1]" /> {dayjs(evento.fecha).format("D [de] MMMM, YYYY")}</p>
        <p>
          <FaClock className="inline mr-2 text-[#0875b1]" /> {evento.horaInicio || "A confirmar"}
          {evento.horaFin ? ` a ${evento.horaFin}` : ""}
        </p>
        <p className="truncate" title={evento.lugar || evento.modalidad}>
          <FaLocationDot className="inline mr-2 text-[#0875b1]" /> {evento.lugar || evento.modalidad || "Lugar a confirmar"}
        </p>
      </div>
    </div>
  );
}
