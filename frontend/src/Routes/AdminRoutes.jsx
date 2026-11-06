import { Navigate, Outlet } from "react-router-dom";
import { useRef } from "react";
import { toast } from "sonner";

export default function AdminRoutes() {
  const token = localStorage.getItem("token");
  const usuarioString = localStorage.getItem("usuario");
  const usuario = usuarioString ? JSON.parse(usuarioString) : null;

  const alertaMostrada = useRef(false);
  // Si no está logueado, al login
  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si está logueado pero NO es admin, lo rebotamos al Home
  if (usuario.rol !== "admin") {
    if (!alertaMostrada.current) {
      toast.error("Acceso Denegado: Esta sección es exclusiva para Administradores.");
      alertaMostrada.current = true;
    }
    return <Navigate to="/" replace />;
  }
  // Si es admin, pasa al panel
  return <Outlet />;
}
