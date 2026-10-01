import { useState } from "react";
import { toast } from "sonner";
import { descargarComprobanteCuota, pagarCuotaOnline } from "../../../services/socioServices";

// Acciones sobre una cuota (pagar / descargar comprobante), compartidas entre Inicio y Pagos: evitan doble click y muestran el error del backend.
export default function useAccionesCuota() {
  const [procesando, setProcesando] = useState(null);

  const pagar = async (cuota) => {
    if (procesando) return;
    setProcesando(`pagar-${cuota.id}`);
    try {
      await pagarCuotaOnline(cuota.id); // redirige a Mercado Pago
    } catch (error) {
      toast.error(error.message);
      setProcesando(null);
    }
  };

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

  return { procesando, pagar, descargar };
}
