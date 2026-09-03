
export default function Modal({ noticia, onClose }) {
  if (!noticia) return null
  {/*Funcion para poder cerrar el modal si presionas fuera de el */ }
  const handleClose = (e) => {
    if (e.target.id === "fondo-modal") {
      onClose();
    }
  };

  return (
    <div id="fondo-modal" onClick={handleClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all cursor-pointer">

      {/* Contenedor principal del modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative">

        {/* Botón flotante para cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white text-gray-500 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md font-bold transition-colors z-10"
        >
          X
        </button>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto p-6 md:p-8">

          {/* Imagen completa */}
          {noticia.imagenUrl && (
            <img
              src={`${import.meta.env.VITE_API_URL_UPLOADS}/${noticia.imagenUrl}`}
              alt={noticia.titulo}
              className="w-full h-64 md:h-80 object-cover rounded-lg mb-6 shadow-sm"
            />
          )}

          <div className="text-sm font-semibold text-[#1D7BB6] uppercase tracking-wider mb-2 flex items-center gap-2">
            {new Date(noticia.fechaPublicacion).toLocaleDateString('es-AR')}
            <span className="w-1 h-1 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span>
            <span>{noticia.categoria || "Institucional"}</span>
          </div>

          <h2 className="text-3xl font-bold text-[#132A46] mb-4">
            {noticia.titulo}
          </h2>

          {noticia.subtitulo && (
            <h4 className="text-lg text-gray-500 font-medium italic mb-6 border-l-4 border-[#1D7BB6] pl-4">
              {noticia.subtitulo}
            </h4>
          )}

          {/* whitespace-pre-wrap respeta los "Enter" (párrafos) que hiciste en el textarea del admin */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {noticia.contenido}
          </p>

        </div>
      </div>
    </div>
  );
}
