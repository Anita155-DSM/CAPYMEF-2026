import { FaCalendarDays, FaTag, FaUpRightFromSquare, FaXmark } from "react-icons/fa6";
import { formatearFechaLarga } from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";

/**
 * Contenido de una noticia tal como la ve el socio o el visitante.
 * Lo usan NoticiaModal (con `onClose`) y la vista previa en vivo del formulario de creación
 * (sin `onClose`: no muestra botones de cierre ni el enlace para abrir la imagen).
 * `imagenDirecta` permite pasar una imagen ya resuelta (por ejemplo, una vista previa local).
 */
export default function NoticiaDetalle({ noticia, onClose, imagenDirecta }) {
  const imagen = imagenDirecta ?? urlImagen(noticia.imagenUrl);

  return (
    <>
      {/* Cabecera: fecha a la izquierda y categoría + botón de cierre a la derecha */}
      <div className="flex items-center justify-between gap-4">
        {noticia.fechaPublicacion ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <FaCalendarDays className="text-[12px]" />
            <span>{formatearFechaLarga(noticia.fechaPublicacion)}</span>
          </span>
        ) : (
          <span />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
            {noticia.categoria ? (
              <>
                <FaTag className="text-[11px]" />
                {noticia.categoria}
              </>
            ) : (
              "Novedad institucional"
            )}
          </span>

          {onClose && (
            <button
              type="button"
              aria-label="Cerrar ventana"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <FaXmark className="text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Título principal */}
      <h2 className="mt-3 text-xl font-bold leading-snug text-navy sm:text-2xl">{noticia.titulo}</h2>

      {/* Subtítulo si está presente */}
      {noticia.subtitulo && (
        <p className="mt-2.5 border-l-4 border-primary pl-3.5 text-sm font-medium italic text-gray-600 sm:text-base">
          {noticia.subtitulo}
        </p>
      )}

      {/* Imagen completa: el recuadro mantiene su tamaño y la imagen se ajusta adentro sin recortarse */}
      {imagen && (
        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl bg-gray-100 shadow-xs sm:h-80">
          <img src={imagen} alt={noticia.titulo} className="h-full w-full object-contain" />
          {onClose && (
            <a
              href={imagen}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs transition-colors hover:bg-navy"
            >
              <FaUpRightFromSquare className="text-[11px]" />
              Abrir imagen
            </a>
          )}
        </div>
      )}

      {/* Cuerpo o contenido completo */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Contenido</p>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-700 sm:text-base">
            {noticia.contenido}
          </p>
        </div>
      </div>

      {/* Pie con botón de cierre (solo en el modal real) */}
      {onClose && (
        <div className="mt-6 flex items-center justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
