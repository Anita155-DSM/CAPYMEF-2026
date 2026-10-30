import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarDay,
  FaCircleCheck,
  FaClock,
  FaLocationDot,
  FaUsers,
  FaVideo,
} from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { describirLugar, textoCupos, textoHorario } from "../../utils/eventos";

const fila = "flex items-start gap-2.5 text-sm text-gray-600";
const iconoFila = "mt-0.5 w-4 shrink-0 text-primary";

/**
 * Próximo evento en el Inicio del socio.
 *   estado: { cargando, error, datos, cupoDisponible } (viene de useNovedadesInicio)
 */
export default function TarjetaProximoEvento({ estado }) {
  const { cargando, error, datos: evento, cupoDisponible } = estado;
  const lugar = evento ? describirLugar(evento) : null;
  const IconoLugar = evento?.modalidad === "virtual" ? FaVideo : FaLocationDot;

  let contenido;
  if (cargando) contenido = <p className="py-3 text-sm text-gray-600">Cargando eventos...</p>;
  else if (error) contenido = <p className="py-3 text-sm text-red-700">{error}</p>;
  else if (!evento) contenido = <p className="py-3 text-sm text-gray-600">No hay próximos eventos publicados.</p>;
  else {
    const fecha = dayjs(evento.fecha);
    contenido = (
      <div className="flex items-start gap-4">
        {/* Bloque de fecha */}
        <div className="shrink-0 rounded-xl bg-primary px-3.5 py-2.5 text-center font-bold text-white shadow-sm">
          <span className="block text-xs uppercase tracking-wide">{fecha.format("MMM").replace(".", "")}</span>
          <span className="text-2xl leading-none">{fecha.date()}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="break-words text-base font-bold text-navy">{evento.titulo}</h3>
            {evento.yaInscripto && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <FaCircleCheck /> Ya estás inscripto
              </span>
            )}
          </div>

          <p className={fila}>
            <FaCalendarDay className={iconoFila} />
            <span className="first-letter:uppercase">{fecha.format("dddd D [de] MMMM")}</span>
          </p>
          <p className={fila}>
            <FaClock className={iconoFila} /> {textoHorario(evento)}
          </p>
          <p className={fila}>
            <IconoLugar className={iconoFila} />
            {lugar.href ? (
              <a href={lugar.href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-primary-dark hover:underline">
                {lugar.texto}
              </a>
            ) : (
              <span className="min-w-0 break-words">{lugar.texto}</span>
            )}
          </p>
          <p className={fila}>
            <FaUsers className={iconoFila} /> {textoCupos(evento, cupoDisponible)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold uppercase tracking-wide text-gray-700">Próximo evento</h2>
        <Link to="/socios/eventos" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark hover:underline">
          {evento?.yaInscripto ? "Ver detalle" : "Ver todos"} <FaArrowRight />
        </Link>
      </div>
      <div className="flex-1">{contenido}</div>
    </section>
  );
}
