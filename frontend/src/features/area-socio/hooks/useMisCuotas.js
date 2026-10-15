import { useCallback, useEffect, useState } from "react";
import { obtenerMisCuotas } from "@/services/socioServices";

/**
 * Cuotas del socio logueado.
 *   cuotas === undefined → cargando
 *   cuotas === null      → el backend no expone el endpoint (404)
 *   cuotas === []        → sin cuotas
 */
export function useMisCuotas() {
  const [cuotas, setCuotas] = useState(undefined);
  const [errorCuotas, setErrorCuotas] = useState("");

  const aplicar = useCallback((resultado) => {
    if (resultado.status === 404) {
      setErrorCuotas("");
      setCuotas(null);
    } else if (!resultado.exito) {
      setErrorCuotas(resultado.mensaje || "No se pudieron cargar tus cuotas.");
      setCuotas([]);
    } else {
      setErrorCuotas("");
      setCuotas(Array.isArray(resultado.data) ? resultado.data : []);
    }
  }, []);

  const recargarCuotas = useCallback(async () => aplicar(await obtenerMisCuotas()), [aplicar]);

  useEffect(() => {
    let activo = true;
    obtenerMisCuotas().then((resultado) => activo && aplicar(resultado));
    return () => {
      activo = false;
    };
  }, [aplicar]);

  return { cuotas, errorCuotas, recargarCuotas };
}
