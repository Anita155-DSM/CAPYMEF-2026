import { api } from "@/api/client";
import { descargarBlob, nombreArchivoSeguro } from "@/shared/utils/seguridad";

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
// PADRÓN DE VOTANTES (ASAMBLEA)
// ==========================================
export function obtenerPadronVotantesAdmin(fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return api(`/admin/padron${query}`);
}

export async function exportarPadronVotantesCsv(fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  const resultado = await api(`/admin/padron/exportar${query}`, { blob: true });
  if (!resultado.exito) return resultado;

  const sufijo = nombreArchivoSeguro(fecha || "hoy");
  descargarBlob(resultado.data, `padron-habilitados-${sufijo}.csv`);
  return { exito: true };
}

// ==========================================
// REPORTES, RESUMEN Y AUDITORÍA (DASHBOARD ADMIN)
// ==========================================
export const obtenerResumenInicioAdmin = () => api("/admin/resumen-inicio");

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
