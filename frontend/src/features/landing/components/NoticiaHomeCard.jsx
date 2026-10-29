import { FaArrowRight, FaCalendarDay, FaTag } from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import { formatearFechaLarga } from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";

/**
 * Tarjeta de noticia para la sección de socios y novedades.
 * Estilo unificado con las tarjetas de eventos (EventoCard):
 * - Mismo borde redondeado (rounded-2xl) y sombra suave
 * - Imagen de cabecera con proporción uniforme y respaldo con logo
 * - Insignia de categoría flotante sobre la imagen
 * - Fecha con ícono y texto institucional formateado en formato largo (dddd D de MMMM, YYYY)
 * - Enlace inferior claro con flecha animada al hacer hover
 */
export default function NoticiaHomeCard({ noticia, onClick }) {
  const imagen = urlImagen(noticia.imagenUrl);

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Leer la noticia: ${noticia.titulo}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar cursor-pointer"
    >
      {/* Cabecera con imagen o degradado institucional con logo */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {imagen ? (
          <img
            src={imagen}
            alt={noticia.titulo}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-primary p-6">
            <img
              src={logo}
              alt="CAPYMEF"
              className="max-h-20 max-w-[55%] object-contain opacity-80 drop-shadow-md"
            />
          </div>
        )}

        {noticia.categoria && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow-sm backdrop-blur-xs">
              <FaTag className="text-[11px] text-primary" />
              {noticia.categoria}
            </span>
          </div>
        )}
      </div>

      {/* Contenido descriptivo */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <FaCalendarDay />
          <span>{formatearFechaLarga(noticia.fechaPublicacion)}</span>
        </div>

        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary">
          {noticia.titulo}
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
          {noticia.subtitulo || noticia.resumen || noticia.contenido || "Sin descripción disponible."}
        </p>

        {/* Acciones al pie */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs font-bold text-primary group-hover:underline">
            Leer noticia completa
          </span>
          <FaArrowRight className="text-xs text-primary transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
