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

  // Carga inicial (y cuando cambia `filtro`). `recargar` queda para refrescos manuales.
  useEffect(() => {
    let activo = true;
    obtenerTodosLosUsuarios().then((result) => {
      if (!activo) return;
      if (result.exito) setUsuarios(result.data.filter(filtro));
      setCargando(false);
    });
    return () => { activo = false; };
  }, [filtro]);

  return { usuarios, setUsuarios, cargando, recargar };
}
