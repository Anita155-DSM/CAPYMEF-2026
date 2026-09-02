const API_URL = import.meta.env.VITE_API_URL_ADMIN;
// ==========================================
// OBTENER TODOS LOS USUARIOS
// ==========================================
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
// ==========================================
// GESTIONAR ESTADO DEL SOLICITUD
// ==========================================
export const gestionarEstadoSolicitud = async (id, nuevoEstado) => {
    try {
        const token = localStorage.getItem("token");

        // Apuntamos a la ruta exacta de tu adminRoutes: /solicitudes/:id
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ nuevoEstado })
        });

        return await response.json();
    } catch (error) {
        console.error("Error al gestionar la solicitud:", error);
        throw new Error("Error de conexión con el servidor");
    }
};

// ==========================================
// ACTUALIZAR DATOS DEL SOCIO
// ==========================================
export const actualizarDatosSocio = async (id, datosActualizados) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: "PUT", 
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(datosActualizados)
        });

        return await response.json();
    } catch (error) {
        console.error("Error al actualizar socio:", error);
        return { exito: false, mensaje: "Error de conexión con el servidor al actualizar" };
    }
};