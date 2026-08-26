// src/services/noticiasService.js

// 1. Llamamos a la variable global de Vite
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
    throw new Error("Error de conexión con el servidor");
  }
};

export const obtenerNoticiasPublicas = async () => {
  try {
    // 3. Lo mismo acá
    const response = await fetch(`${API_URL}/noticias/publicas`);
    return await response.json();
  } catch (error) {
    console.error("Error al obtener noticias públicas:", error);
    throw new Error("Error de conexión con el servidor");
  }
};