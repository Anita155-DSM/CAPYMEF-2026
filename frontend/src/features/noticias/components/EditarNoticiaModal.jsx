import { useEffect, useState } from "react";
import {
  FaEye,
  FaFloppyDisk,
  FaImage,
  FaNewspaper,
  FaTag,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import {
  actualizarNoticia,
  eliminarNoticia,
  publicarNuevaNoticia,
} from "@/services/noticiasService";
import { useCategoriasNoticias } from "../hooks/useCategoriasNoticias";
import logo from "@/assets/img/logo.png";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { urlImagen } from "@/shared/utils/imagenes";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import NoticiaDetalle from "./NoticiaDetalle";

const inputClase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const labelClase =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500";

/**
 * Modal unificado para Crear y Editar noticias desde Administración.
 * Sigue el mismo diseño visual que NoticiaModal y EventoFormModal.
 * Al crear, debajo del formulario hay una vista previa en vivo de cómo va quedando la noticia.
 */
export default function EditarNoticiaModal({
  noticia = null,
  onClose,
  onNoticiaActualizada,
  onVistaPrevia,
}) {
  useBloquearScroll(true);

  const esCrear = !noticia;

  const [form, setForm] = useState({
    titulo: noticia?.titulo || "",
    subtitulo: noticia?.subtitulo || "",
    contenido: noticia?.contenido || "",
    categoria: noticia?.categoria || "",
    visibilidad: noticia?.visibilidad || "todos",
    estado: noticia?.estado || "publicado",
  });

  const [imagen, setImagen] = useState({
    archivo: null,
    preview: noticia?.imagenUrl ? urlImagen(noticia.imagenUrl) : null,
  });
  const [guardando, setGuardando] = useState(false);
  // Fecha fija para la vista previa (se calcula una sola vez al abrir el modal)
  const [fechaPrevia] = useState(() => new Date().toISOString());
  const {
    categorias,
    cargando: cargandoCategorias,
    error: errorCategorias,
  } = useCategoriasNoticias();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !confirmando) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose, confirmando]);

  // Si la categoría actual no está en la lista, se conserva para no perderla
  const opcionesCategoria =
    form.categoria && !categorias.includes(form.categoria)
      ? [form.categoria, ...categorias]
      : categorias;

  // Noticia tal como se vería hoy, con textos de ejemplo mientras los campos están vacíos
  const noticiaPrevia = {
    titulo: form.titulo.trim() || "Título de la noticia",
    subtitulo: form.subtitulo.trim(),
    contenido: form.contenido.trim() || "El contenido de la noticia aparecerá acá a medida que lo escribas…",
    categoria: form.categoria,
    fechaPublicacion: fechaPrevia,
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImagen = (e) => {
    const file = e.target.files?.[0];
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
      toast.error(
        result.errores?.[0]?.mensaje || result.mensaje || "Ocurrió un error al procesar la noticia."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.titulo.trim().length < 5) {
      toast.error("El título debe tener al menos 5 caracteres.");
      return;
    }
    if (!form.contenido.trim()) {
      toast.error("El contenido de la noticia es obligatorio.");
      return;
    }

    setGuardando(true);
    const formData = new FormData();
    formData.append("titulo", form.titulo.trim());
    formData.append("subtitulo", form.subtitulo.trim());
    formData.append("contenido", form.contenido.trim());
    if (form.categoria) formData.append("categoria", form.categoria);
    formData.append("visibilidad", form.visibilidad);
    formData.append("estado", form.estado);
    if (imagen.archivo) formData.append("imagen", imagen.archivo);

    const result = esCrear
      ? await publicarNuevaNoticia(formData)
      : await actualizarNoticia(noticia.id, formData);

    setGuardando(false);
    terminar(
      result,
      esCrear ? "¡Noticia publicada con éxito!" : "¡Noticia actualizada correctamente!"
    );
  };

  const handleEliminar = async () => {
    setEliminando(true);
    const result = await eliminarNoticia(noticia.id);
    setEliminando(false);
    setConfirmando(false);
    terminar(result, "Noticia eliminada correctamente.");
  };

  return (
    <>
      {/* Toda la pantalla hace scroll: el formulario arriba y, al crear, la vista previa abajo */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 backdrop-blur-xs">
        <div
          className="flex min-h-full flex-col items-center justify-center gap-6 p-4 sm:p-6"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
        <div
          className={`animacion-modal w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-3xl sm:p-7 ${
            esCrear ? "" : "max-h-[90vh] overflow-y-auto"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={esCrear ? "Publicar nueva noticia" : "Editar noticia"}
        >
          {/* Cabecera con el estilo de Socio (NoticiaModal / EventoDetalleModal) */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                <FaNewspaper className="text-[11px]" />
                {esCrear ? "Nueva publicación" : "Edición de noticia"}
              </span>

              {form.categoria && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-navy">
                  <FaTag className="text-[10px] text-primary" />
                  {form.categoria}
                </span>
              )}

              {!esCrear && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    form.estado === "publicado"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {form.estado === "publicado" ? "Visible" : "Borrador"}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar ventana"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <FaXmark className="text-xl" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug text-navy sm:text-2xl">
              {esCrear ? "Publicar noticia en el portal" : noticia.titulo}
            </h2>

            {!esCrear && onVistaPrevia && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVistaPrevia(noticia);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <FaEye className="text-[11px]" /> Vista previa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Imagen de portada con vista previa estilo NoticiaModal */}
            <div className="rounded-xl border border-gray-100 bg-surface p-4 sm:p-5">
              <label className={labelClase}>
                <span className="inline-flex items-center gap-1.5">
                  <FaImage className="text-primary" /> Imagen de portada (opcional)
                </span>
              </label>

              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                {imagen.preview ? (
                  <img
                    src={imagen.preview}
                    alt="Vista previa de portada"
                    className="h-28 w-full shrink-0 rounded-xl border border-slate-200 object-cover shadow-2xs sm:w-44"
                  />
                ) : (
                  <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-navy to-primary p-4 sm:w-44">
                    <img
                      src={logo}
                      alt="CAPYMEF"
                      className="max-h-12 object-contain opacity-75"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagen}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-primary-dark"
                  />
                  <p className="text-xs text-slate-500">
                    Si no seleccionás una imagen, se mostrará la portada institucional con el logo de CAPYMEF.
                  </p>
                </div>
              </div>
            </div>

            {/* Título y Subtítulo */}
            <div className="space-y-4">
              <div>
                <label className={labelClase}>Título de la noticia *</label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="Ej. Nuevas líneas de financiamiento para PyMEs asociadas"
                  className={inputClase}
                />
              </div>

              <div>
                <label className={labelClase}>Subtítulo o copete (opcional)</label>
                <textarea
                  rows="2"
                  name="subtitulo"
                  value={form.subtitulo}
                  onChange={handleChange}
                  maxLength={300}
                  placeholder="Un resumen breve para introducir la noticia en el listado..."
                  className={`${inputClase} resize-none`}
                />
              </div>
            </div>

            {/* Categoría, Visibilidad y Estado en bloque estructurado */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-surface p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelClase}>Categoría *</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  disabled={cargandoCategorias}
                  className={`${inputClase} disabled:opacity-60`}
                >
                  <option value="" disabled>
                    {cargandoCategorias ? "Cargando..." : "Seleccioná categoría"}
                  </option>
                  {opcionesCategoria.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errorCategorias && (
                  <span className="mt-1 block text-xs text-red-500">{errorCategorias}</span>
                )}
              </div>

              <div>
                <label className={labelClase}>¿Dónde se ve? *</label>
                <select
                  name="visibilidad"
                  value={form.visibilidad}
                  onChange={handleChange}
                  className={inputClase}
                >
                  <option value="todos">Todos (Web y Socios)</option>
                  <option value="publico">Solo página principal</option>
                  <option value="socios">Solo panel de socios</option>
                </select>
              </div>

              <div>
                <label className={labelClase}>Estado *</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className={inputClase}
                >
                  <option value="publicado">Publicado (Visible)</option>
                  <option value="borrador">Borrador (Oculto)</option>
                </select>
              </div>
            </div>

            {/* Contenido completo */}
            <div>
              <label className={labelClase}>Contenido completo *</label>
              <textarea
                rows="6"
                name="contenido"
                value={form.contenido}
                onChange={handleChange}
                required
                placeholder="Escribí todo el desarrollo del comunicado o novedad..."
                className={inputClase}
              />
            </div>

            {/* Pie de acciones */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {esCrear ? (
                <div />
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  disabled={guardando || eliminando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <FaTrashCan className="text-xs" /> Eliminar noticia
                </button>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={guardando}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  <FaFloppyDisk className="text-xs" />
                  {guardando
                    ? "Guardando..."
                    : esCrear
                    ? "Publicar noticia"
                    : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {esCrear && (
          <section className="w-full max-w-2xl sm:max-w-3xl" aria-label="Vista previa de la noticia">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white">Así se verá tu noticia</p>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-7">
              <NoticiaDetalle noticia={noticiaPrevia} imagenDirecta={imagen.preview} />
            </div>
          </section>
        )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmando}
        titulo="¿Eliminar esta noticia?"
        mensaje={`Estás a punto de eliminar "${
          noticia?.titulo || ""
        }". Dejará de mostrarse en el portal y en el panel de socios.`}
        textoConfirmar={eliminando ? "Eliminando..." : "Eliminar"}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={handleEliminar}
      />
    </>
  );
}
