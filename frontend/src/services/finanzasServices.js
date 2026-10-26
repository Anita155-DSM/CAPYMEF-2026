import { api } from "@/api/client";
import { descargarBlob, idValido, nombreArchivoSeguro } from "@/shared/utils/seguridad";

// ==========================================
// FINANZAS (solo admin)
// ==========================================

/** Todas las cuotas del sistema, cada una con los datos de su socio. */
export const obtenerCuotasAdmin = () => api("/cuotas");

/** Descarga el PDF del comprobante de una cuota ya pagada. */
export async function descargarComprobanteAdmin(cuota) {
  if (!idValido(cuota?.id)) return { exito: false, mensaje: "Cuota inválida." };

  const resultado = await api(`/cuotas/${encodeURIComponent(cuota.id)}/comprobante`, { blob: true });
  if (!resultado.exito) {
    return resultado.status === 400 || resultado.status === 404
      ? { exito: false, mensaje: "Esta cuota todavía no tiene un comprobante disponible." }
      : resultado;
  }

  const nombre = `comprobante-${nombreArchivoSeguro(cuota.socio?.razonSocial)}-${nombreArchivoSeguro(cuota.mes_anio)}.pdf`;
  descargarBlob(resultado.data, nombre);
  return { exito: true };
}
