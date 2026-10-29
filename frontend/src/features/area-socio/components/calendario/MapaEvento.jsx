import { FaLocationDot } from "react-icons/fa6";
import { mapaDelEvento } from "../../utils/ubicacion";

/**
 * Mapa interactivo embebido para eventos presenciales con ubicación válida.
 * Proporción compacta para una óptima distribución dentro del modal de detalle.
 */
export default function MapaEvento({ evento }) {
  const mapa = mapaDelEvento(evento);
  if (!mapa) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        Ubicación en el mapa
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-xs">
        <iframe
          title={`Mapa: ${evento.titulo}`}
          src={mapa.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-44 w-full border-0 sm:h-48"
        />
      </div>
      <a
        href={mapa.enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary-dark hover:underline"
      >
        <FaLocationDot className="text-primary" /> Abrir en Google Maps para ver cómo llegar
      </a>
    </div>
  );
}
