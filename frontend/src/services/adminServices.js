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

// ==========================================
// REPORTES Y AUDITORÍA (DASHBOARD ADMIN)
// ==========================================
export const obtenerDistribucionRubros = () => api("/admin/reportes/distribucion-rubros");

export const obtenerDistribucionLocalidades = () => api("/admin/reportes/distribucion-localidad");

export function obtenerAuditoriasAdmin(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.page) params.set("page", String(filtros.page));
  if (filtros.limit) params.set("limit", String(filtros.limit));
  if (filtros.modulo) params.set("modulo", filtros.modulo);
  if (filtros.accionTipo) params.set("accionTipo", filtros.accionTipo);
  if (filtros.busqueda?.trim()) params.set("busqueda", filtros.busqueda.trim());
  if (filtros.fechaInicio) params.set("fechaInicio", filtros.fechaInicio);
  if (filtros.fechaFin) params.set("fechaFin", filtros.fechaFin);

  const query = params.toString();
  return api(`/admin/auditorias${query ? `?${query}` : ""}`);
}
