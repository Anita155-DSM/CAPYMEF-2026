const API_URL = import.meta.env.VITE_API_URL_ADMIN;
export const obtenerTodosLosUsuarios = async () => {
    try {
        const token = localStorage.getItem("token");

        // Acá cambiamos a la nueva ruta /usuarios
        const response = await fetch(`${API_URL}/usuarios`, {
            method: "GET",
            headers: {
                "Content-type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        return await response.json();
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        throw new Error("Error de conexión con el servidor al Obtener");
    }
};

// src/services/adminServices.js

export const gestionarEstadoSolicitud = async (id, nuevoEstado) => {
    try {
        const token = localStorage.getItem("token");

        // Apuntamos a la ruta exacta de tu adminRoutes: /solicitudes/:id
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Pasamos el token porque lo exige tu middleware
            },
            // Le mandamos 'nuevoEstado' porque así lo espera tu controller (gestionarSolicitud)
            body: JSON.stringify({ nuevoEstado })
        });

        return await response.json();
    } catch (error) {
        console.error("Error al gestionar la solicitud:", error);
        throw new Error("Error de conexión con el servidor");
    }
};