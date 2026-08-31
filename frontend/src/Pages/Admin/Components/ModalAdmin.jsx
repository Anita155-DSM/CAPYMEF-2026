import { useState } from "react";
import { toast } from "sonner";
import { FaRegSave, FaRegTrashAlt } from "react-icons/fa";
import { actualizarNoticia } from "../../../services/noticiasService.js"; // Importas tu servicio
import Logo from "../../../assets/img/logo.png";

export default function ModalAdmin({ noticia, onClose, onNoticiaActualizada }) {
  if (!noticia) return null;

  const [titulo, setTitulo] = useState(noticia.titulo || "");
  const [subtitulo, setSubtitulo] = useState(noticia.subtitulo || "");
  const [contenido, setContenido] = useState(noticia.contenido || "");
  const [visibilidad, setVisibilidad] = useState(noticia.visibilidad || "todos");
  const [estado, setEstado] = useState(noticia.estado || "publicado");
  
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(
    noticia.imagenUrl 
      ? (noticia.imagenUrl.startsWith("http") ? noticia.imagenUrl : `${import.meta.env.VITE_API_URL_UPLOADS}/${noticia.imagenUrl}`)
      : null
  );
  const [estaGuardando, setEstaGuardando] = useState(false);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();
    setEstaGuardando(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("contenido", contenido);
      formData.append("visibilidad", visibilidad);
      formData.append("estado", estado);
      if (subtitulo) formData.append("subtitulo", subtitulo);
      
      // Solo adjuntamos la imagen si el usuario seleccionó una nueva
      if (imagenArchivo) {
        formData.append("imagen", imagenArchivo);
      }

      const result = await actualizarNoticia(noticia.id, formData);

      if (result.exito) {
        toast.success("¡Noticia actualizada con éxito!");
        if (onNoticiaActualizada) onNoticiaActualizada(); // Recarga la lista en el componente padre
        onClose();
      } else {
        toast.error("Error al actualizar: " + result.mensaje);
      }
    } catch (error) {
      toast.error("Hubo un error al intentar conectarse con el servidor.");
      console.error(error);
    } finally {
      setEstaGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Cabecera del Modal */}
        <div className="bg-[#132A46] p-4 text-white flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">Panel de Edición de Noticia</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Formulario con scroll */}
        <form onSubmit={handleSubmitEdicion} className="p-6 overflow-y-auto flex flex-col gap-5 flex-grow">
          
          {/* Previsualización y Selector de Imagen */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm">Imagen de portada</label>
            <div className="flex items-center gap-4">
              {imagenPreview ? (
                <img 
                  src={imagenPreview} 
                  alt="Vista previa" 
                  className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-32 h-24 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center rounded-lg">
                  <img src={Logo} alt="CAPYMEF" className="h-10 w-auto object-contain opacity-30" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D7BB6] file:text-white hover:file:bg-[#156091] cursor-pointer"
              />
            </div>
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700 text-sm">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] text-sm"
              required
            />
          </div>

          {/* Subtítulo */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700 text-sm">Subtítulo</label>
            <textarea
              rows="2"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] text-sm resize-none"
            />
          </div>

          {/* Selects: Visibilidad y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-700 text-sm">¿Dónde se ve? *</label>
              <select
                value={visibilidad}
                onChange={(e) => setVisibilidad(e.target.value)}
                className="p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white text-sm"
              >
                <option value="todos">En la página principal y en el panel</option>
                <option value="publico">Solo en la página principal (Landing)</option>
                <option value="socios">Solo adentro del panel de socios</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-700 text-sm">Estado *</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white text-sm"
              >
                <option value="publicado">Publicado (Visible)</option>
                <option value="borrador">Borrador (Oculto)</option>
              </select>
            </div>
          </div>

          {/* Contenido Completo */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700 text-sm">Contenido completo *</label>
            <textarea
              rows="5"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] text-sm"
              required
            />
          </div>

          {/* Pie del Modal con botones de acción */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={() => alert(`Eliminar noticia ID: ${noticia.id}`)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
            >
              <FaRegTrashAlt /> Eliminar Noticia
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00B859] hover:bg-[#009649] text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors shadow-sm"
              >
                <FaRegSave /> Guardar Cambios
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}