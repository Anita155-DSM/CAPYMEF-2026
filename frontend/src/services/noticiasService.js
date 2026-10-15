import { api } from "@/api/client";

// PÚBLICO Y SOCIOS
export const obtenerNoticiasPublicas = () => api("/noticias/publicas");

export const obtenerNoticiasSocios = () => api("/noticias/socios");

// ADMIN
export const obtenerTodasLasNoticiasAdmin = () => api("/noticias/admin");

export const publicarNuevaNoticia = (formData) =>
  api("/noticias/admin", { method: "POST", body: formData });

export const actualizarNoticia = (id, formData) =>
  api(`/noticias/admin/${id}`, { method: "PUT", body: formData });

export const eliminarNoticia = (id) =>
  api(`/noticias/admin/${id}`, { method: "DELETE" });