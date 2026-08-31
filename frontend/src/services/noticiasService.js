const API_URL = import.meta.env.VITE_API_URL;

export const publicarNuevaNoticia = async (formData) => {
  try {
    const token = localStorage.getItem("token");

    // 2. Reemplazamos la URL cruda por nuestra variable
    const response = await fetch(`${API_URL}/noticias/admin`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error("Error al publicar la noticia:", error);
    throw new Error("Error de conexión con el servidor al Publicar");
  }
};
export async function actualizarNoticia(id, formData) {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/noticias/admin/${id}`, {

      method: "PUT", // o PATCH según tu backend
      body: formData, // FormData maneja tanto texto como archivos de imagen
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { exito: false, mensaje: data.mensaje || "Error al actualizar" };
    }
    return { exito: true, data };
  } catch (error) {
    console.error("Error en actualizarNoticia:", error);
    return { exito: false, mensaje: "Error de conexión con el servidor al Actualizar" };
  }
}

export const obtenerNoticiasPublicas = async () => {
  try {
    // 3. Lo mismo acá
    const response = await fetch(`${API_URL}/noticias/publicas`);
    return await response.json();
  } catch (error) {
    console.error("Error al obtener noticias públicas:", error);
    throw new Error("Error de conexión con el servidor al Obtener");
  }
};