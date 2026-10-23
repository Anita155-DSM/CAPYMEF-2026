import { useEffect, useState } from "react";
import { obtenerNoticiasPublicas } from "@/services/noticiasService";

/** Noticias públicas para el Home. api() nunca lanza: se mira result.exito. */
export function useNoticiasPublicas() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    obtenerNoticiasPublicas().then((result) => {
      if (cancelado) return;
      if (result.exito) setNoticias(Array.isArray(result.data) ? result.data : []);
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  return { noticias, cargando };
}
