import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

// Lee la sesión guardada una sola vez, al abrir la app
function leerSesionGuardada() {
  try {
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    return token && usuario ? usuario : null;
  } catch {
    return null; // JSON roto en localStorage: arrancamos sin sesión
  }
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesionGuardada);

  // Recibe la respuesta del backend al loguearse: { token, usuario }
  const login = useCallback(({ token, usuario }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    setUsuario(usuario);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }, []);

  // Para refrescar datos del usuario (ej: el perfil que trae SocioLayout)
  const actualizarUsuario = useCallback((datos) => {
    setUsuario((anterior) => {
      const nuevo = { ...anterior, ...datos };
      localStorage.setItem("usuario", JSON.stringify(nuevo));
      return nuevo;
    });
  }, []);

  // client.js dispara este evento cuando el backend responde 401
  useEffect(() => {
    const alExpirar = () => {
      logout();
      toast.error("Tu sesión expiró. Volvé a iniciar sesión.");
    };
    window.addEventListener("sesion-expirada", alExpirar);
    return () => window.removeEventListener("sesion-expirada", alExpirar);
  }, [logout]);

  const valor = useMemo(
    () => ({
      usuario,
      estaLogueado: !!usuario,
      esAdmin: usuario?.rol === "admin",
      login,
      logout,
      actualizarUsuario,
    }),
    [usuario, login, logout, actualizarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}