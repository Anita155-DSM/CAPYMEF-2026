import { api } from "@/api/client";

// ==========================================
// SOCIOS Y SOLICITUDES DE ALTA
// ==========================================
export const obtenerTodosLosUsuarios = () => api("/admin/usuarios");

export const gestionarEstadoSolicitud = (id, nuevoEstado) =>
    api(`/admin/solicitudes/${id}`, { method: "PUT", body: { nuevoEstado } });

export const actualizarDatosSocio = (id, datos) =>
    api(`/admin/socios/${id}`, { method: "PUT", body: datos });

export const darDeBajaSocio = (id) =>
    api(`/admin/socios/${id}/baja`, { method: "PUT" });