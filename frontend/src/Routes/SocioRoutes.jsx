import { Navigate, Outlet } from "react-router-dom";
import { leerUsuarioGuardado, limpiarSesion, tokenVigente } from "../services/socioServices";

// Roles que pueden ver el panel de socio. El admin entra para probar la vista
// (tiene el acceso "VISTA SOCIO (TEST)" en su menú). La seguridad real la hace el
// backend en cada endpoint: esto solo evita mostrar el panel a quien no tiene sesión.
const ROLES_PERMITIDOS = ["socio", "admin"];

export default function SocioRoutes() {
  const usuario = leerUsuarioGuardado();

  if (!tokenVigente() || !usuario) {
    limpiarSesion();
    return <Navigate to="/login" replace />;
  }

  if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
