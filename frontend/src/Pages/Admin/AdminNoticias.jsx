import { useState } from "react";
import { useForm } from "react-hook-form"; // Importamos la magia
import Navbar from "../../Components/Navbar";

export default function AdminNoticias() {
  // Sacamos las herramientas que necesitamos de la librería
  const { register, handleSubmit, reset } = useForm();

  // Mantenemos solo el estado para la vista previa de la imagen
  const [imagenPreview, setImagenPreview] = useState(null);

  // La misma función de antes para leer la foto
  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // onSubmit recibe directamente los datos agrupados por la librería
  const onSubmit = (data) => {
    const nuevaNoticia = {
      id: Date.now().toString(),
      titulo: data.titulo,
      resumen: data.resumen,
      contenido: data.contenido,
      imagen: imagenPreview,
    };

    console.log("¡Noticia lista para guardar!", nuevaNoticia);
    alert("Noticia publicada con éxito (Simulación)");

    // Limpiamos todo con una sola línea
    reset();
    setImagenPreview(null);
    document.getElementById("input-imagen").value = "";
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-10 font-sans">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-[#132A46] mb-2">
            Panel Administrativo
          </h1>
          <p className="text-gray-500 mb-8">
            Publicar una nueva noticia en el portal.
          </p>

          {/* Le pasamos nuestro onSubmit al handleSubmit de la librería */}
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

            {/* CAMPO: RESUMEN */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Resumen corto (Para la tarjeta) *
              </label>
              <textarea
                placeholder="Un texto breve de 2 líneas..."
                rows="2"
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#1D7BB6] focus:ring-1 focus:ring-[#1D7BB6] resize-none"
                {...register("resumen", { required: true })}
              />
            </div>

            {/* CAMPO: CONTENIDO COMPLETO */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">
                Contenido completo (Para el modal) *
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
              className="mt-4 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-3 px-6 rounded-md transition-colors"
            >
              Publicar Noticia
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
