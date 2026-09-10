const API_URL = import.meta.env.VITE_API_URL_ADMIN;
const API_URL_EVENTOS = import.meta.env.VITE_API_URL_EVENTOS;

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

// ==========================================
// CREAR EVENTOS (CALENDARIO ADMIN)
// ==========================================
export const crearNuevoEvento = async (formData) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL_EVENTOS}/admin`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
                // NO ponemos Content-Type acá, fetch lo calcula solo por el FormData
            },
            body: formData
        });

        return await response.json();
    } catch (error) {
        console.error("Error al crear evento:", error);
        return { exito: false, mensaje: "Error de conexión con el servidor al crear" };
    }
};

// ==========================================
// OBTENER TODOS LOS EVENTOS (CALENDARIO ADMIN)
// ==========================================
export const obtenerTodosLosEventos = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL_EVENTOS}/socios`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        return await response.json();
    } catch (error) {
        console.error("Error al obtener eventos:", error);
        return { exito: false, data: [] };
    }
};

// ==========================================
// ACTUALIZAR EVENTO (ADMIN)
// ==========================================
export const actualizarEvento = async (id, formData) => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL_EVENTOS}/admin/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error("Error al actualizar evento:", error);
        return { exito: false, mensaje: "Error de conexión con el servidor" };
    }
};

// ==========================================
// ELIMINAR EVENTO (ADMIN)
// ==========================================
export const eliminarEvento = async (id) => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL_EVENTOS}/admin/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error("Error al eliminar evento:", error);
        return { exito: false, mensaje: "Error de conexión con el servidor" };
    }
};