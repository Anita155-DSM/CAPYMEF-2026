import { api } from "@/api/client";
import { idValido } from "@/shared/utils/seguridad";

// ==========================================
// NOTIFICACIONES (cualquier usuario logueado: ve SOLO las suyas)
// ==========================================

/** { page, limit } → { data, noLeidas, paginaActual, totalPaginas } */
export const obtenerNotificaciones = ({ page = 1, limit = 10 } = {}) =>
  api(`/notificaciones?page=${Number(page) || 1}&limit=${Number(limit) || 10}`);

/** Solo el número de no leídas (para el globito de la campana). */
export const obtenerContadorNotificaciones = () => api("/notificaciones/contador");

export const marcarNotificacionLeida = (id) =>
  idValido(id)
    ? api(`/notificaciones/${encodeURIComponent(id)}/leer`, { method: "PUT" })
    : Promise.resolve({ exito: false, mensaje: "Notificación inválida." });

export const marcarTodasNotificacionesLeidas = () => api("/notificaciones/leer-todas", { method: "PUT" });
