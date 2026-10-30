import { Link } from "react-router-dom";
import { FaChevronRight, FaNewspaper } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";

/**
 * Últimas noticias para socios.
 *   estado: { cargando, error, lista } (viene de useNovedadesInicio)
 */
export default function TarjetaNovedades({ estado }) {
  const { cargando, error, lista } = estado;

  let contenido;
  if (cargando) contenido = <p className="py-3 text-sm text-gray-600">Cargando noticias...</p>;
  else if (error) contenido = <p className="py-3 text-sm text-red-700">{error}</p>;
  else if (!lista.length) contenido = <p className="py-3 text-sm text-gray-600">No hay noticias publicadas.</p>;
  else {
    contenido = (
      <div className="divide-y divide-gray-100">
        {lista.map((noticia) => (
          <article key={noticia.id} className="py-3 first:pt-0">
            {/* Si la noticia no trae fecha válida, no mostramos "Invalid Date" */}
            {noticia.fechaPublicacion && dayjs(noticia.fechaPublicacion).isValid() && (
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {dayjs(noticia.fechaPublicacion).format("DD/MM/YYYY")}
              </p>
            )}
            <p className="text-sm font-bold leading-snug text-navy">{noticia.titulo}</p>
            {noticia.subtitulo && <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-gray-600">{noticia.subtitulo}</p>}
          </article>
        ))}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold uppercase tracking-wide text-gray-700">Novedades</h2>
        <FaNewspaper className="text-primary" />
      </div>
      <div className="flex-1">{contenido}</div>
      <Link to="/socios/noticias" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
        Ver todas las noticias <FaChevronRight />
      </Link>
    </section>
  );
}
