import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import Logo from "../../../assets/img/logo.png";

export default function ModalAdmin({ noticia, onClose }) {
  if (!noticia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Cabecera del Modal */}
        <div className="bg-[#132A46] p-4 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Gestión de Noticia</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow">
          {noticia.imagenUrl ? (
            <img 
              src={`${import.meta.env.VITE_API_URL_UPLOADS}/${noticia.imagenUrl}`} 
              alt={noticia.titulo} 
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center rounded-lg">
              <img src={Logo} alt="CAPYMEF" className="h-20 w-auto object-contain opacity-30" />
            </div>
          )}

          <div className="text-xs font-semibold text-[#1D7BB6] uppercase tracking-wider">
            {noticia.fechaPublicacion ? new Date(noticia.fechaPublicacion).toLocaleDateString('es-AR') : ""}
          </div>

          <h2 className="text-2xl font-bold text-[#132A46]">{noticia.titulo}</h2>
          
          {noticia.subtitulo && (
            <h4 className="text-gray-600 font-medium">{noticia.subtitulo}</h4>
          )}

          <div className="text-gray-700 whitespace-pre-line mt-2 border-t pt-4">
            {noticia.contenido}
          </div>

          <div className="mt-2 text-sm text-gray-500 font-semibold">
            Visibilidad actual: <span className="text-[#1D7BB6] capitalize">{noticia.visibilidad || 'todos'}</span>
          </div>
        </div>

        {/* Pie del Modal con acciones de administración */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={() => alert(`Editar noticia: ${noticia.titulo}`)}
            className="px-4 py-2 bg-[#1D7BB6] hover:bg-[#132A46] text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
          >
            <FaRegEdit /> Editar
          </button>
          <button 
            onClick={() => alert(`Eliminar noticia ID: ${noticia.id}`)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
          >
            <FaRegTrashAlt /> Eliminar
          </button>
        </div>

      </div>
    </div>
  );
}