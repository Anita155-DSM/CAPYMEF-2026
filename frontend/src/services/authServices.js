import { api } from "@/api/client";

export const iniciarSesion = (credenciales) =>
  api("/auth/login", { method: "POST", body: credenciales });

export const registrarSocio = (formData) =>
  api("/auth/registro", { method: "POST", body: formData });

export const recuperarPassword = (email) =>
  api("/auth/recuperar-password", { method: "POST", body: { email } });

export const restablecerPassword = (token, password) =>
  api(`/auth/restablecer-password/${token}`, { method: "PUT", body: { password } });

export const obtenerPerfil = () => api("/auth/perfil");