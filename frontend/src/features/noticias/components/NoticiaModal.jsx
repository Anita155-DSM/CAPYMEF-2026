import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { formatearFecha } from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";

export default function NoticiaModal({ noticia, onClose }) {
  useBloquearScroll(Boolean(noticia));

  // Se cierra con Escape
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  if (!noticia) return null;

  // Cierra el modal al hacer clic en el fondo oscuro
  const handleClose = (e) => {
    if (e.target.id === "fondo-modal") onClose();
  };

  return createPortal(
    <div id="fondo-modal" onClick={handleClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all cursor-pointer">

      {/* Contenedor principal del modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden relative animacion-modal" role="dialog" aria-modal="true" aria-label={noticia.titulo}>

        {/* Botón flotante para cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 bg-white text-gray-500 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md font-bold transition-colors z-10"
        >
          X
        </button>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto p-6 md:p-8">

          {/* Imagen completa */}
          {noticia.imagenUrl && (
            <img
              src={urlImagen(noticia.imagenUrl)}
              alt={noticia.titulo}
              className="w-full h-64 md:h-80 object-cover rounded-lg mb-6 shadow-sm"
            />
          )}

          <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>{formatearFecha(noticia.fechaPublicacion)}</span>
            {/* La categoría solo se muestra si la noticia la tiene */}
            {noticia.categoria && (
              <>
                <span className="w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
                <span>{noticia.categoria}</span>
              </>
            )}
          </div>

          <h2 className="text-3xl font-bold text-navy mb-4">
            {noticia.titulo}
          </h2>

          {noticia.subtitulo && (
            <h4 className="text-lg text-gray-500 font-medium italic mb-6 border-l-4 border-primary pl-4">
              {noticia.subtitulo}
            </h4>
          )}

          {/* whitespace-pre-wrap respeta los "Enter" (párrafos) que hiciste en el textarea del admin */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {noticia.contenido}
          </p>

        </div>
      </div>
    </div>,
    document.body
  );
}