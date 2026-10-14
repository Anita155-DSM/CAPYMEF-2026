import { useCallback, useEffect, useState } from "react";
import { obtenerTodosLosUsuarios } from "@/services/adminServices";

/**
 * Carga todos los usuarios y se queda con los que cumplen `filtro`.
 * `filtro` debe ser una función estable (definida fuera del componente).
 */
export function useUsuarios(filtro) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const result = await obtenerTodosLosUsuarios(); // api() nunca lanza
    if (result.exito) setUsuarios(result.data.filter(filtro));
    setCargando(false);
  }, [filtro]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { usuarios, setUsuarios, cargando, recargar };
}
