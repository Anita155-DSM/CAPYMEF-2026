import { FaLocationDot } from "react-icons/fa6";
import { mapaDelEvento } from "../utils/ubicacion";

/** Mapa embebido con el lugar del evento y botón "Cómo llegar". No renderiza nada si no hay ubicación. */
export default function MapaEvento({ evento }) {
  const mapa = mapaDelEvento(evento);
  if (!mapa) return null;

  return (
    <div className="mt-4">
      <iframe
        title={`Mapa: ${evento.titulo}`}
        src={mapa.embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-56 w-full border border-[#d7e0e5]"
      />
      <a
        href={mapa.enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline"
      >
        <FaLocationDot /> Cómo llegar
      </a>
    </div>
  );
}
