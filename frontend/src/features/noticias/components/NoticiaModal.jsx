import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaCalendarDays,
  FaTag,
  FaXmark,
} from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { formatearFechaLarga } from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";

/**
 * Modal detallado de noticia para socios y visitantes.
 * Estilo visual unificado con el modal de eventos (EventoDetalleModal):
 * - Fondo con desenfoque suave y base institucional (bg-navy/60 backdrop-blur-xs)
 * - Mismo contenedor redondeado (rounded-2xl) con animación de entrada (animacion-modal)
 * - Encabezado limpio con categoría y fecha de publicación superior
 * - Botón de cierre con FaXmark
 * - Imagen adaptada a todo el ancho disponible (h-64 sm:h-80 w-full object-cover rounded-xl)
 * - Cuerpo de contenido con tipografía clara y legible
 * - Pie de acciones con botón de cierre estandarizado
 */
export default function NoticiaModal({ noticia, onClose }) {
  useBloquearScroll(Boolean(noticia));

  // Se cierra con tecla Escape
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  if (!noticia) return null;

  const imagen = urlImagen(noticia.imagenUrl);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animacion-modal max-h-[90vh] w-full max-w-2xl sm:max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-label={noticia.titulo}
      >
        {/* Cabecera del modal: Insignia de categoría, fecha de publicación y botón de cierre */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {noticia.categoria ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                <FaTag className="text-[11px]" />
                {noticia.categoria}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                Novedad institucional
              </span>
            )}

            {noticia.fechaPublicacion && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <FaCalendarDays className="text-[12px]" />
                <span>{formatearFechaLarga(noticia.fechaPublicacion)}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        {/* Título principal de la noticia */}
        <h2 className="mt-3 text-xl font-bold leading-snug text-navy sm:text-2xl">
          {noticia.titulo}
        </h2>

        {/* Subtítulo si está presente */}
        {noticia.subtitulo && (
          <p className="mt-2.5 border-l-4 border-primary pl-3.5 text-sm font-medium italic text-gray-600 sm:text-base">
            {noticia.subtitulo}
          </p>
        )}

        {/* Imagen de la noticia adaptada a todo el ancho disponible */}
        {imagen && (
          <img
            src={imagen}
            alt={noticia.titulo}
            className="mt-4 h-64 sm:h-80 w-full rounded-xl object-cover shadow-xs"
          />
        )}

        {/* Cuerpo o contenido completo de la noticia */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Contenido
          </p>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-700 sm:text-base">
              {noticia.contenido}
            </p>
          </div>
        </div>

        {/* Pie de acciones con botón de cierre */}
        <div className="mt-6 flex items-center justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
