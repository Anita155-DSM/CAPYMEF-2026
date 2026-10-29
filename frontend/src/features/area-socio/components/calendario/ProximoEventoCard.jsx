import {
  FaArrowRight,
  FaCalendarCheck,
  FaCircleCheck,
  FaClock,
  FaLocationDot,
  FaVideo,
} from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { describirLugar, textoHorario } from "../../utils/eventos";

/**
 * Tarjeta destacada del próximo evento programado.
 * Mantiene la identidad visual de CAPYMEF (tarjetas redondeadas, fecha destacada, insignias de estado).
 */
export default function ProximoEventoCard({ evento, onClick }) {
  if (!evento) return null;

  const lugar = describirLugar(evento);
  const fecha = dayjs(evento.fecha);
  const IconoLugar = evento.modalidad === "virtual" ? FaVideo : FaLocationDot;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="group w-full shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:p-5 lg:w-96"
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <FaCalendarCheck /> Próximo evento
        </span>
        {evento.yaInscripto ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            <FaCircleCheck className="text-[11px]" /> Inscripto
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-blue px-2.5 py-0.5 text-xs font-bold text-primary">
            {evento.modalidad === "virtual" ? "Virtual" : "Presencial"}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3.5">
        {/* Bloque de fecha con estilo institucional CAPYMEF */}
        <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center font-bold text-white shadow-xs">
          <span className="block text-[11px] uppercase tracking-wide">
            {fecha.format("MMM").replace(".", "")}
          </span>
          <span className="text-xl leading-none">{fecha.date()}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3
            className="truncate text-sm font-bold text-navy transition-colors group-hover:text-primary sm:text-base"
            title={evento.titulo}
          >
            {evento.titulo}
          </h3>

          <p className="flex items-center gap-2 text-xs text-gray-600">
            <FaClock className="shrink-0 text-primary" /> {textoHorario(evento)}
          </p>

          <p className="flex items-center gap-2 truncate text-xs text-gray-600" title={lugar.texto}>
            <IconoLugar className="shrink-0 text-primary" />
            <span className="truncate">{lugar.texto}</span>
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs font-bold text-primary">
        <span>{evento.yaInscripto ? "Ver información y ubicación" : "Ver detalle e inscribirme"}</span>
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}
