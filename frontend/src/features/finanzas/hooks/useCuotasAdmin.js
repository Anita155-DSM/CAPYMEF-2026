import { useEffect, useState } from "react";
import { obtenerCuotasAdmin } from "@/services/finanzasServices";

/** Carga todas las cuotas del sistema (con su socio) una sola vez y permite marcar una como pagada. */
export function useCuotasAdmin() {
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerCuotasAdmin().then((resultado) => {
      if (!activo) return;
      if (resultado.exito && Array.isArray(resultado.data)) setCuotas(resultado.data);
      else setError(resultado.mensaje || "No se pudieron cargar las cuotas.");
      setCargando(false);
    });
    return () => { activo = false; };
  }, []);

  // Tras registrar un pago, la cuota pasa a "pagada" sin volver a pedir todo el listado
  const marcarPagada = (id) =>
    setCuotas((actuales) => actuales.map((c) => (c.id === id ? { ...c, estado: "pagada" } : c)));

  return { cuotas, cargando, error, marcarPagada };
}
