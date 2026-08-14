import { useState } from "react";
import { useForm } from "react-hook-form";
import { publicarNuevaNoticia } from "../../services/noticiasService.js"; 

export default function NoticiasAdmin() {
  // 1. Configuramos los valores por defecto para que no falle el validador
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      visibilidad: "todos",
      estado: "publicado"
    }
  });
  
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [estaPublicando, setEstaPublicando] = useState(false); 

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setEstaPublicando(true); 
    
    try {
      const formData = new FormData();
      formData.append("titulo", data.titulo);
      formData.append("contenido", data.contenido);
      formData.append("visibilidad", data.visibilidad);
      formData.append("estado", data.estado);

      // Si el usuario escribió un subtítulo, lo sumamos al paquete
      if (data.subtitulo) {
        formData.append("subtitulo", data.subtitulo);
      }

      if (imagenArchivo) {
        formData.append("imagen", imagenArchivo); 
      }

      const result = await publicarNuevaNoticia(formData);

      if (result.exito) {
        alert("¡Noticia publicada con éxito en la base de datos!");
        reset();
        setImagenPreview(null);
        setImagenArchivo(null);
        document.getElementById("input-imagen").value = "";
      } else {
        console.log("Detalle de los errores:", result.errores);
        alert("Error al publicar: " + result.mensaje);
      }
      
    } catch (error) {
      alert("Hubo un error al intentar conectarse con el servidor.");
      console.error(error);
    } finally {
      setEstaPublicando(false); 
    }
  };

  return (
    <>
      <div className="bg-gray-100 p-10 font-sans min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#1D7BB6]">
          <h1 className="text-3xl font-bold text-[#132A46] mb-2">
            Panel Administrativo
          </h1>
          <p className="text-gray-500 mb-8">
            Publicar una nueva noticia en el portal.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            
            {/* CAMPO: IMAGEN */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Imagen de portada (Opcional)
              </label>
              <input
                id="input-imagen"
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D7BB6] file:text-white hover:file:bg-[#156091] cursor-pointer text-gray-600"
              />
              {imagenPreview && (
                <div className="mt-3">
                  <span className="text-xs text-gray-500 mb-1 block">
                    Vista previa:
                  </span>
                  <img
                    src={imagenPreview}
                    alt="Vista previa"
                    className="w-32 h-32 object-cover rounded-md border border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* CAMPO: TÍTULO */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Título de la noticia *
              </label>
              <input
                type="text"
                placeholder="Ej: Nuevos beneficios para socios..."
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6]"
                {...register("titulo", { required: true })}
              />
            </div>

            {/* CAMPO: SUBTÍTULO (¡Acá está!) */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Subtítulo (Opcional)
              </label>
              <textarea
                placeholder="Un texto breve para enganchar al lector..."
                rows="2"
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6] resize-none"
                {...register("subtitulo")} 
              />
            </div>

            {/* FILA DE SELECTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CAMPO: VISIBILIDAD */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700">
                  ¿Dónde se va a ver? *
                </label>
                <select
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white"
                  {...register("visibilidad", { required: true })}
                >
                  <option value="todos">En la página principal y en el panel</option>
                  <option value="publico">Solo en la página principal (Landing)</option>
                  <option value="socios">Solo adentro del panel de socios</option>
                </select>
              </div>

              {/* CAMPO: ESTADO */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700">
                  Estado de publicación *
                </label>
                <select
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] bg-white"
                  {...register("estado", { required: true })}
                >
                  <option value="publicado">Publicado (Visible ahora mismo)</option>
                  <option value="borrador">Borrador (Oculto temporalmente)</option>
                </select>
              </div>

            </div>

            {/* CAMPO: CONTENIDO COMPLETO */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Contenido completo *
              </label>
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
              className={`mt-4 font-bold py-3 px-6 rounded-md transition-colors text-white ${
                estaPublicando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#1D7BB6] hover:bg-[#156091]'
              }`}
            >
              {estaPublicando ? 'Publicando noticia...' : 'Publicar Noticia'}
            </button>
            
          </form>
        </div>
      </div>
    </>
  );
}