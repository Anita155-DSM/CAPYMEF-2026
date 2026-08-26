
export default function Modal({ noticia, onClose }) {
  if (!noticia) return null
  {/*Funcion para poder cerrar el modal si presionas fuera de el */ }
  const handleClose = (e) => {
    if (e.target.id === "fondo-modal") {
      onClose();
    }
  };

  return (
    <div id="fondo-modal" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="noticia-titulo" className="animacion-modal fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/55 p-4 backdrop-blur-sm">

      {/* Contenedor principal del modal */}
      <article className="relative flex max-h-[92vh] w-full max-w-5xl cursor-default flex-col overflow-hidden bg-white shadow-2xl">

        {/* Botón flotante para cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar noticia"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-2xl font-light text-gray-700 shadow-md transition-colors hover:bg-[#132A46] hover:text-white"
        >
          &times;
        </button>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-6 py-8 md:px-16 md:py-10">

          {/* Imagen completa */}
          {noticia.imagenUrl && (
            <img
              src={`${import.meta.env.VITE_API_URL_UPLOADS}/${noticia.imagenUrl}`}
              alt={noticia.titulo}
              className="mx-auto mb-9 max-h-[420px] w-full object-contain"
            />
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wider text-[#1D7BB6]">
            <span>{noticia.tipo || noticia.categoria || "Institucional"}</span>
            <span className="text-gray-300">&bull;</span>
            {new Date(noticia.fechaPublicacion).toLocaleDateString('es-AR')}
          </div>

          <h2 id="noticia-titulo" className="mb-7 max-w-4xl text-3xl font-bold leading-tight text-[#252525] md:text-5xl">
            {noticia.titulo}
          </h2>

          {noticia.subtitulo && (
            <h3 className="mb-7 max-w-3xl border-l-4 border-[#1D7BB6] pl-4 text-lg font-medium italic text-gray-500">
              {noticia.subtitulo}
            </h3>
          )}

          {/* whitespace-pre-wrap respeta los "Enter" (párrafos) que hiciste en el textarea del admin */}
          <p className="max-w-3xl whitespace-pre-wrap text-lg leading-8 text-gray-700">
            {noticia.contenido}
          </p>

        </div>
      </article>
    </div>
  );
}
