// Centralizamos la URL para no repetirla
const API_URL = import.meta.env.VITE_API_URL_AUTH;

export const iniciarSesion = async (credenciales) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify(credenciales),
      headers: {
        "Content-type": "application/json",
      },
    });

    // Retornamos lo que responda el backend
    return await response.json();
  } catch (error) {
    console.error("Error en el servicio de login:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

export const registrarSocio = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/registro`, {
      method: "POST",
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error("Error en el servicio de registro:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  // Redirigir al inicio
  window.location.href = "/login";
};
