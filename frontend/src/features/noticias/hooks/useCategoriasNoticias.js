import { useEffect, useState } from "react";
import { obtenerCategoriasNoticias } from "@/services/noticiasService";

/**
 * Categorías de noticias. Se piden al backend (la Cámara puede sumar o quitar categorías),
 * por eso NO se escriben a mano en el frontend.
 *   const { categorias, cargando, error } = useCategoriasNoticias();
 */
export function useCategoriasNoticias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerCategoriasNoticias().then((resultado) => {
      if (!activo) return;
      if (resultado.exito && Array.isArray(resultado.data)) setCategorias(resultado.data);
      else setError(resultado.mensaje || "No se pudieron cargar las categorías.");
      setCargando(false);
    });

    return () => {
      activo = false;
    };
  }, []);

  return { categorias, cargando, error };
}
