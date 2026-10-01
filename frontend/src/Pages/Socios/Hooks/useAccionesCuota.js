import { useCallback, useState } from "react";
import { toast } from "sonner";
import { descargarComprobanteCuota } from "../../../services/socioServices";

// Acciones sobre una cuota (pagar / descargar comprobante), compartidas entre Inicio y Pagos: evitan doble click y muestran el error del backend.
export default function useAccionesCuota() {
  const [procesando, setProcesando] = useState(null);
  const [cuotaAPagar, setCuotaAPagar] = useState(null); // abre el ModalPagoCuota

  const pagar = (cuota) => {
    if (procesando || cuota.estado === "pagada") return;
    setCuotaAPagar(cuota);
  };

  const cerrarPago = useCallback(() => setCuotaAPagar(null), []);

  const descargar = async (cuota) => {
    if (procesando) return;
    setProcesando(`comprobante-${cuota.id}`);
    try {
      await descargarComprobanteCuota(cuota);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcesando(null);
    }
  };

  return { procesando, pagar, descargar, cuotaAPagar, cerrarPago };
}
