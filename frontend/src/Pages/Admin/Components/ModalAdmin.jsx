import { useState } from "react";
import { FaRegSave, FaRegTrashAlt, FaExclamationTriangle } from "react-icons/fa";
import { actualizarNoticia, eliminarNoticia } from "../../../services/noticiasService.js";
import Logo from "../../../assets/img/logo.png";
import { toast } from "sonner";

export default function ModalAdmin({ noticia, onClose, onNoticiaActualizada }) {
  if (!noticia) return null;

  // Optimización: Agrupamos todo el formulario en un solo estado
  const [form, setForm] = useState({
    titulo: noticia.titulo || "",
    subtitulo: noticia.subtitulo || "",
    contenido: noticia.contenido || "",
    visibilidad: noticia.visibilidad || "todos",
    estado: noticia.estado || "publicado",
  });

  const [imagen, setImagen] = useState({ archivo: null, preview: noticia.imagenUrl ? (noticia.imagenUrl.includes("res.cloudinary.com") || noticia.imagenUrl.startsWith("http") ? noticia.imagenUrl : `${import.meta.env.VITE_API_URL_UPLOADS}/${noticia.imagenUrl}`) : null });
  const [ui, setUi] = useState({ guardando: false, confirmando: false, eliminando: false });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagen({ archivo: file, preview: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUi({ ...ui, guardando: true });
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => value && formData.append(key, value));
      if (imagen.archivo) formData.append("imagen", imagen.archivo);

      const result = await actualizarNoticia(noticia.id, formData);
      if (result.exito) {
        toast.success("¡Noticia actualizada!");
        onNoticiaActualizada?.();
        onClose();
      } else toast.error("Error: " + result.mensaje);
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setUi({ ...ui, guardando: false });
    }
  };

  const handleEliminar = async () => {
    setUi({ ...ui, eliminando: true });
    try {
      const result = await eliminarNoticia(noticia.id);
      if (result.exito) {
        toast.success("Noticia ocultada correctamente.");
        onNoticiaActualizada?.();
        onClose();
      } else toast.error("Error: " + result.mensaje);
    } catch {
      toast.error("Error al intentar eliminar.");
    } finally {
      setUi({ ...ui, eliminando: false, confirmando: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="bg-[#132A46] p-4 text-white flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">Panel de Edición de Noticia</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        {ui.confirmando ? (
          <div className="p-8 flex flex-col items-center text-center flex-grow gap-4">
            <FaExclamationTriangle className="text-red-500 text-5xl mb-2" />
            <h3 className="text-xl font-bold text-[#132A46]">¿Ocultar esta noticia?</h3>
            <p className="text-gray-500">Pasará a estado borrador (baja lógica).</p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setUi({ ...ui, confirmando: false })} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md">Cancelar</button>
              <button onClick={handleEliminar} disabled={ui.eliminando} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm">{ui.eliminando ? "Procesando..." : "Sí, Aceptar"}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 text-sm">Imagen de portada</label>
              <div className="flex items-center gap-4">
                {imagen.preview ? <img src={imagen.preview} className="w-32 h-24 object-cover rounded-lg border shadow-sm" /> : <div className="w-32 h-24 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center rounded-lg"><img src={Logo} className="h-10 opacity-30" /></div>}
                <input type="file" accept="image/*" onChange={handleImagen} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#1D7BB6] file:text-white cursor-pointer" />
              </div>
            </div>

            <div className="flex flex-col gap-1"><label className="font-bold text-gray-700 text-sm">Título *</label><input type="text" name="titulo" value={form.titulo} onChange={handleChange} required className="p-2.5 border rounded-md focus:border-[#1D7BB6] text-sm" /></div>
            <div className="flex flex-col gap-1"><label className="font-bold text-gray-700 text-sm">Subtítulo</label><textarea rows="2" name="subtitulo" value={form.subtitulo} onChange={handleChange} className="p-2.5 border rounded-md focus:border-[#1D7BB6] text-sm resize-none" /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1"><label className="font-bold text-gray-700 text-sm">Visibilidad *</label><select name="visibilidad" value={form.visibilidad} onChange={handleChange} className="p-2.5 border rounded-md text-sm"><option value="todos">Todos</option><option value="publico">Solo Público</option><option value="socios">Solo Socios</option></select></div>
              <div className="flex flex-col gap-1"><label className="font-bold text-gray-700 text-sm">Estado *</label><select name="estado" value={form.estado} onChange={handleChange} className="p-2.5 border rounded-md text-sm"><option value="publicado">Publicado</option><option value="borrador">Borrador</option></select></div>
            </div>

            <div className="flex flex-col gap-1"><label className="font-bold text-gray-700 text-sm">Contenido *</label><textarea rows="5" name="contenido" value={form.contenido} onChange={handleChange} required className="p-2.5 border rounded-md focus:border-[#1D7BB6] text-sm" /></div>

            <div className="pt-4 border-t flex justify-between items-center">
              <button type="button" onClick={() => setUi({ ...ui, confirmando: true })} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm"><FaRegTrashAlt /> Eliminar</button>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md text-sm">Cancelar</button>
                <button type="submit" disabled={ui.guardando} className="px-5 py-2 bg-[#00B859] hover:bg-[#009649] text-white font-semibold rounded-md flex items-center gap-2 text-sm shadow-sm"><FaRegSave /> {ui.guardando ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}