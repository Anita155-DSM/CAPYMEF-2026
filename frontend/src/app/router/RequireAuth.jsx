import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthContext";

export default function RequireAuth({ roles }) {
  const { usuario } = useAuth();
  const location = useLocation();

  const sinPermiso = Boolean(usuario && roles && !roles.includes(usuario.rol));

  useEffect(() => {
    if (sinPermiso) toast.error("No tenés permiso para entrar a esa sección.");
  }, [sinPermiso]);

  // No logueado → al login (guardamos a dónde quería ir)
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;

  // Logueado pero sin el rol necesario → al inicio
  if (sinPermiso) return <Navigate to="/" replace />;

  return <Outlet />;
}