import { useCallback, useState } from "react";
import { toast } from "sonner";
import { descargarComprobanteCuota } from "@/services/socioServices";

/** Pagar / descargar comprobante de una cuota. Evita el doble click y avisa los errores. */
export function useAccionesCuota() {
  const [procesando, setProcesando] = useState(null); // "comprobante-<id>" mientras descarga
  const [cuotaAPagar, setCuotaAPagar] = useState(null); // abre el modal de pago

  const pagar = (cuota) => {
    if (!procesando && cuota.estado !== "pagada") setCuotaAPagar(cuota);
  };

  const cerrarPago = useCallback(() => setCuotaAPagar(null), []);

  const descargar = async (cuota) => {
    if (procesando) return;
    setProcesando(`comprobante-${cuota.id}`);
    const resultado = await descargarComprobanteCuota(cuota);
    setProcesando(null);
    if (!resultado.exito) toast.error(resultado.mensaje);
  };

  return { procesando, pagar, descargar, cuotaAPagar, cerrarPago };
}
