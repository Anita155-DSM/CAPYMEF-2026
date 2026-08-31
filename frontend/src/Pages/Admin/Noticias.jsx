import { FaSearch, FaPlus, FaRegEdit, FaRegTrashAlt, FaArrowLeft } from "react-icons/fa";
import Loading from "../../Components/Loading";
import logo from "../../assets/img/logo.png"
import { useNoticiasLogic } from "./Hooks/useNoticiasLogic.js"; // Asegurate de la ruta correcta

export default function NoticiasAdmin() {
  // Conectamos nuestra librería propia
  const {
    vistaActual, setVistaActual,
    busqueda, setBusqueda,
    noticiasFiltradas, cargando,
    register, handleSubmit,
    imagenPreview, handleImagen,
    onSubmit, estaPublicando
  } = useNoticiasLogic();

  // ==========================================
  // VISTA 1: LISTADO DE TARJETAS
  // ==========================================
  const renderLista = () => {
    if (cargando) return <div className="p-10 text-center"><Loading /></div>;

    return (
      <div className="w-full flex flex-col animate-fade-in">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#132A46] uppercase mb-4">Gestión de Noticias</h2>
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por título de la noticia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#8da5b8] rounded text-sm focus:outline-none focus:border-[#132A46] focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={() => setVistaActual("formulario")}
            className="bg-[#1D7BB6] hover:bg-[#132A46] text-white font-bold py-2 px-6 rounded flex items-center gap-2 transition-colors shadow-sm"
          >
            <FaPlus /> NUEVA NOTICIA
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {noticiasFiltradas.length === 0 ? (
            <p className="col-span-full text-center py-10 text-gray-500">No hay noticias para mostrar.</p>
          ) : (
            noticiasFiltradas.map((noticia) => (
              <div key={noticia.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-4">
                    <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {noticia.categoria || "General"}
                    </span>
                  </div>
                  <div className="flex justify-center mb-4 bg-gray-50 h-32 rounded">
                    <img
                      src={noticia.imagenUrl || "https://placehold.co/400x200/ffffff/0056b3?text=CAPYMEF"}
                      alt="Portada"
                      className="h-full object-contain"
                    />
                  </div>
                  <p className="text-gray-500 text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 block"></span>
                    {noticia.fechaPublicacion || "Fecha no disponible"}
                  </p>
                  <h3 className="text-[#132A46] font-bold text-lg leading-tight mb-3">
                    {noticia.titulo}
                  </h3>
                  <p className="text-gray-500 text-sm flex-grow line-clamp-4">
                    {noticia.subtitulo || noticia.contenido?.substring(0, 100) + "..."}
                  </p>
                </div>

                <div className="px-5 py-4 flex justify-between items-center border-t border-gray-100">
                  <div className="flex gap-3 text-xl text-[#1D7BB6]">
                    <button className="hover:text-[#132A46] transition-colors"><FaRegEdit /></button>
                    <button className="hover:text-red-600 transition-colors"><FaRegTrashAlt /></button>
                  </div>
                  <span className={`px-4 py-1.5 rounded-md text-xs font-bold text-white uppercase ${noticia.estado === 'publicado' ? 'bg-[#00B859]' : 'bg-[#FFC107]'}`}>
                    {noticia.estado}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // VISTA 2: FORMULARIO DE PUBLICACIÓN
  // ==========================================
  const renderFormulario = () => (
    <div className="w-full flex flex-col max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => setVistaActual("lista")}
        className="flex items-center gap-2 text-[#1D7BB6] font-bold hover:underline mb-6 self-start"
      >
        <FaArrowLeft /> Volver al listado
      </button>

      <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#1D7BB6]">
        <h1 className="text-3xl font-bold text-[#132A46] mb-2">Panel Administrativo</h1>
        <p className="text-gray-500 mb-8">Publicar una nueva noticia en el portal.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Imagen de portada (Opcional)</label>
            <input
              id="input-imagen"
              type="file"
              accept="image/*"
              onChange={handleImagen}
              className="p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D7BB6] file:text-white hover:file:bg-[#156091] cursor-pointer text-gray-600"
            />
            {imagenPreview && (
              <div className="mt-3">
                <span className="text-xs text-gray-500 mb-1 block">Vista previa:</span>
                <img src={imagenPreview} alt="Vista previa" className="w-32 h-32 object-cover rounded-md border border-gray-200 shadow-sm" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Título de la noticia *</label>
            <input
              type="text"
              placeholder="Ej: Nuevos beneficios para socios..."
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6]"
              {...register("titulo", { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Subtítulo (Opcional)</label>
            <textarea
              placeholder="Un texto breve para enganchar al lector..."
              rows="2"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6] resize-none"
              {...register("subtitulo")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">¿Dónde se va a ver? *</label>
              <select className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white" {...register("visibilidad", { required: true })}>
                <option value="todos">En la página principal y en el panel</option>
                <option value="publico">Solo en la página principal (Landing)</option>
                <option value="socios">Solo adentro del panel de socios</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">Estado de publicación *</label>
              <select className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white" {...register("estado", { required: true })}>
                <option value="publicado">Publicado (Visible ahora mismo)</option>
                <option value="borrador">Borrador (Oculto temporalmente)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Contenido completo *</label>
            <textarea
              placeholder="Escribí todo el desarrollo de la noticia acá..."
              rows="6"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6]"
              {...register("contenido", { required: true })}
            />
          </div>

          <button
            type="submit"
            disabled={estaPublicando}
            className={`mt-4 font-bold py-3 px-6 rounded-md transition-colors text-white ${estaPublicando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1D7BB6] hover:bg-[#156091]'
              }`}
          >
            {estaPublicando ? 'Publicando noticia...' : 'Publicar Noticia'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-8 w-full font-sans relative min-h-screen bg-gray-100">
      {vistaActual === "lista" ? renderLista() : renderFormulario()}
    </div>
  );
}