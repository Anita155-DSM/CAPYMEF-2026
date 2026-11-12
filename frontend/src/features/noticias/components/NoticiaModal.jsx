import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import NoticiaDetalle from "./NoticiaDetalle";

/**
 * Modal detallado de noticia para socios y visitantes.
 * Estilo visual unificado con el modal de eventos (EventoDetalleModal):
 * - Fondo con desenfoque suave y base institucional (bg-navy/60 backdrop-blur-xs)
 * - Mismo contenedor redondeado (rounded-2xl) con animación de entrada (animacion-modal)
 * El contenido (cabecera, título, imagen, cuerpo y pie) vive en NoticiaDetalle.
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
        <NoticiaDetalle noticia={noticia} onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}
