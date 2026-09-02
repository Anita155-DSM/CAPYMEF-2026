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

export const recuperarPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/recuperar-password`, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-type": "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error en el servicio de recuperación de contraseña:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

export const restablecerPassword = async (token, password) => {
  try {
    const response = await fetch(`${API_URL}/restablecer-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
      headers: {
        "Content-type": "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error en el servicio de restablecimiento de contraseña:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  // Redirigir al inicio
  window.location.href = "/login";
};