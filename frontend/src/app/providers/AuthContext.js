import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/**
 * Uso en cualquier componente, EJEMPLO ABAJO:
 *   const { usuario, estaLogueado, esAdmin, login, logout } = useAuth()
 */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  }
  return contexto;
}