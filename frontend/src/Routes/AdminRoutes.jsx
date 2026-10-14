import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";

function AccesoDenegado() {
  useEffect(() => {
    toast.error("Sección exclusiva para administradores.");
  }, []);
  return <Navigate to="/" replace />;
}

export default function AdminRoutes() {
  const usuarioString = localStorage.getItem("usuario");
  const usuario = usuarioString ? JSON.parse(usuarioString) : null;

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== "admin") return <AccesoDenegado />;
  return <Outlet />;
}