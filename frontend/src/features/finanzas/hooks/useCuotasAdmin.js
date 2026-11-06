import { useCallback, useEffect, useState } from "react";
import { obtenerCuotasAdmin, obtenerPagosSinConfirmarAdmin } from "@/services/finanzasServices";

/** Carga todas las cuotas del sistema (con su socio) y los pagos pendientes de confirmación en Tesorería. */
export function useCuotasAdmin() {
  const [cuotas, setCuotas] = useState([]);
  const [pagosSinConfirmar, setPagosSinConfirmar] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError("");

    const [resCuotas, resPagos] = await Promise.all([
      obtenerCuotasAdmin(),
      obtenerPagosSinConfirmarAdmin(),
    ]);

    if (resCuotas.exito && Array.isArray(resCuotas.data)) {
      setCuotas(resCuotas.data);
    } else {
      setError(resCuotas.mensaje || "No se pudieron cargar las cuotas.");
    }

    if (resPagos.exito && Array.isArray(resPagos.data)) {
      setPagosSinConfirmar(resPagos.data);
    }

    if (!silencioso) setCargando(false);
  }, []);

  useEffect(() => {
    recargar(false);
  }, [recargar]);

  // Tras registrar un pago, la cuota pasa a "pagada" y refrescamos pagos sin confirmar en segundo plano
  const marcarPagada = (id) => {
    setCuotas((actuales) => actuales.map((c) => (c.id === id ? { ...c, estado: "pagada" } : c)));
    recargar(true);
  };

  return {
    cuotas,
    pagosSinConfirmar,
    cargando,
    error,
    marcarPagada,
    recargar,
  };
}
