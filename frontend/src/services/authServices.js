// Centralizamos la URL para no repetirla
// Antes estaba hardcodeada a localhost:3000 — la cambiamos a la variable de entorno
// (la misma que ya usa noticiasService.js) para que funcione también en producción.
// Necesitás tener VITE_API_URL definida en tu .env, ej: VITE_API_URL=http://localhost:3000/api
const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

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
      body: formData, // Acordate que al ser FormData no lleva headers
    });

    return await response.json();
  } catch (error) {
    console.error("Error en el servicio de registro:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

// ==========================================
// Recuperación de contraseña
// ==========================================

// Paso 1: el socio pide el mail de recuperación
export const solicitarRecuperacion = async (email) => {
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
    console.error("Error en el servicio de recuperación:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

// Paso 2: el socio ya tiene el token del mail y elige su nueva contraseña
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
    console.error("Error al restablecer la contraseña:", error);
    throw new Error("Error de conexión con el servidor");
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  // Redirigir al inicio
  window.location.href = "/login";
};
