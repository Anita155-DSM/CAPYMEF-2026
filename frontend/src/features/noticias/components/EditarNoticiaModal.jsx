import { useState } from "react";
import { FaRegSave, FaRegTrashAlt, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "sonner";
import { actualizarNoticia, eliminarNoticia } from "@/services/noticiasService";
import { useCategoriasNoticias } from "../hooks/useCategoriasNoticias";
import logo from "@/assets/img/logo.png";
import { urlImagen } from "@/shared/utils/imagenes";
import ModalShell from "@/shared/ui/ModalShell";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Campo from "@/shared/ui/Campo";
import { btnCancelarClase, btnGuardarClase } from "@/shared/ui/estilos";

const inputNoticia = "p-2.5 border rounded-md focus:border-primary text-sm";

/** El padre debe renderizarlo solo cuando hay noticia: {noticia && <EditarNoticiaModal … />} */
export default function EditarNoticiaModal({ noticia, onClose, onNoticiaActualizada }) {
  const [form, setForm] = useState({
    titulo: noticia.titulo || "",
    subtitulo: noticia.subtitulo || "",
    contenido: noticia.contenido || "",
    categoria: noticia.categoria || "",
    visibilidad: noticia.visibilidad || "todos",
    estado: noticia.estado || "publicado",
  });
  const [imagen, setImagen] = useState({ archivo: null, preview: urlImagen(noticia.imagenUrl) });
  const [guardando, setGuardando] = useState(false);
  const { categorias, cargando: cargandoCategorias, error: errorCategorias } = useCategoriasNoticias();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Si la lista no cargó (o la categoría actual ya no existe), se conserva la actual para no perderla
  const opcionesCategoria = form.categoria && !categorias.includes(form.categoria) ? [form.categoria, ...categorias] : categorias;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagen({ archivo: file, preview: reader.result });
    reader.readAsDataURL(file);
  };

  const terminar = (result, okMsg) => {
    if (result.exito) {
      toast.success(okMsg);
      onNoticiaActualizada?.();
      onClose();
    } else {
      toast.error("Error: " + (result.errores?.[0]?.mensaje || result.mensaje));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => value && formData.append(key, value));
    if (imagen.archivo) formData.append("imagen", imagen.archivo);

    const result = await actualizarNoticia(noticia.id, formData);
    setGuardando(false);
    terminar(result, "¡Noticia actualizada!");
  };

  const handleEliminar = async () => {
    setEliminando(true);
    const result = await eliminarNoticia(noticia.id);
    setEliminando(false);
    setConfirmando(false);
    terminar(result, "Noticia ocultada correctamente.");
  };

  return (
    <>
      <ModalShell titulo="Panel de Edición de Noticia" onClose={onClose}>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 grow">
          <Campo label="Imagen de portada" className="gap-2">
            <div className="flex items-center gap-4">
              {imagen.preview ? (
                <img src={imagen.preview} alt="" className="w-32 h-24 object-cover rounded-lg border shadow-sm" />
              ) : (
                <div className="w-32 h-24 bg-linear-to-tr from-navy to-primary flex items-center justify-center rounded-lg">
                  <img src={logo} alt="" className="h-10 opacity-30" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-white cursor-pointer"
              />
            </div>
          </Campo>

          <Campo label="Título *">
            <input type="text" name="titulo" value={form.titulo} onChange={handleChange} required className={inputNoticia} />
          </Campo>
          <Campo label="Subtítulo">
            <textarea rows="2" name="subtitulo" value={form.subtitulo} onChange={handleChange} className={`${inputNoticia} resize-none`} />
          </Campo>
          <Campo label="Categoría *">
            <select name="categoria" value={form.categoria} onChange={handleChange} required disabled={cargandoCategorias} className={`${inputNoticia} bg-white disabled:bg-gray-100`}>
              <option value="" disabled>{cargandoCategorias ? "Cargando categorías..." : "Elegí una categoría"}</option>
              {opcionesCategoria.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errorCategorias && <span className="text-red-500 text-xs">{errorCategorias}</span>}
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Visibilidad *">
              <select name="visibilidad" value={form.visibilidad} onChange={handleChange} className="p-2.5 border rounded-md text-sm">
                <option value="todos">Todos</option>
                <option value="publico">Solo Público</option>
                <option value="socios">Solo Socios</option>
              </select>
            </Campo>
            <Campo label="Estado *">
              <select name="estado" value={form.estado} onChange={handleChange} className="p-2.5 border rounded-md text-sm">
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
              </select>
            </Campo>
          </div>

          <Campo label="Contenido *">
            <textarea rows="5" name="contenido" value={form.contenido} onChange={handleChange} required className={inputNoticia} />
          </Campo>

          <div className="pt-4 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm"
            >
              <FaRegTrashAlt /> Eliminar
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className={btnCancelarClase}>Cancelar</button>
              <button type="submit" disabled={guardando} className={btnGuardarClase}>
                <FaRegSave /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      <ConfirmDialog
        isOpen={confirmando}
        icono={FaExclamationTriangle}
        titulo="¿Ocultar esta noticia?"
        mensaje="Pasará a estado borrador (baja lógica)."
        textoConfirmar={eliminando ? "Procesando..." : "Sí, ocultar"}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={handleEliminar}
      />
    </>
  );
}
