import { api } from "@/api/client";

// ==========================================
// SOCIO / PÚBLICO
// ==========================================
export const obtenerEventosSocios = () => api("/eventos/socios");

export const obtenerEventosPublicos = () => api("/eventos/publicos");

export const inscribirseEvento = (id) =>
  api(`/eventos/${id}/inscribirse`, { method: "POST" });

export const cancelarInscripcion = (id) =>
  api(`/eventos/${id}/inscribirse`, { method: "DELETE" });

export const obtenerCertificadoEvento = (id) =>
  api(`/eventos/${encodeURIComponent(id)}/certificado`, { blob: true });

// ==========================================
// ADMIN
// ==========================================
export const crearNuevoEvento = (formData) =>
  api("/eventos/admin", { method: "POST", body: formData });

export const actualizarEvento = (id, formData) =>
  api(`/eventos/admin/${id}`, { method: "PUT", body: formData });

export const eliminarEvento = (id) =>
  api(`/eventos/admin/${id}`, { method: "DELETE" });