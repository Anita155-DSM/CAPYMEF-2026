import { api } from "@/api/client";
import { descargarBlob, idValido, nombreArchivoSeguro, urlSegura } from "@/shared/utils/seguridad";

const DOMINIO_MERCADOPAGO = /(^|\.)mercadopago\.com(\.[a-z]{2})?$/i;
const DOMINIO_CLOUDINARY = /^res\.cloudinary\.com$/i;

const error = (mensaje) => ({ exito: false, mensaje });

// ==========================================
// PERFIL (el socio solo puede editar teléfono y localidad)
// ==========================================
export const actualizarMisDatosContacto = ({ telefono, localidad }) =>
  api("/auth/perfil", { method: "PUT", body: { telefono, localidad } });

// ==========================================
// CUOTAS Y PAGOS
// ==========================================
export const obtenerMisCuotas = () => api("/pagos/mis-cuotas");

/**
 * Pide la orden de Mercado Pago. Si sale bien devuelve
 * { exito: true, data: { linkPago, preferenceId } } con el link ya validado.
 */
export async function crearOrdenPagoCuota(cuotaId) {
  if (!idValido(cuotaId)) return error("Cuota inválida.");

  const resultado = await api(`/pagos/${encodeURIComponent(cuotaId)}/iniciar`, { method: "POST" });
  if (!resultado.exito) return resultado;

  const destino = urlSegura(resultado.data?.linkPago, DOMINIO_MERCADOPAGO);
  if (!destino) return error("El enlace de pago recibido no es válido. Contactá a la administración.");

  const preferenceId = destino.searchParams.get("pref_id");
  return {
    exito: true,
    data: {
      linkPago: destino.href,
      preferenceId: /^[\w-]{1,100}$/.test(preferenceId || "") ? preferenceId : null,
    },
  };
}

/** Plan B si el botón de Mercado Pago no carga: va directo al checkout. */
export function irAlCheckout(linkPago) {
  const destino = urlSegura(linkPago, DOMINIO_MERCADOPAGO);
  if (destino) window.location.assign(destino.href);
}

/** Abre el comprobante de Cloudinary o descarga el PDF desde el backend. */
export async function descargarComprobanteCuota(cuota) {
  const cloudinary = urlSegura(cuota?.pago?.urlComprobante, DOMINIO_CLOUDINARY);
  if (cloudinary) {
    window.open(cloudinary.href, "_blank", "noopener,noreferrer");
    return { exito: true };
  }
  if (!idValido(cuota?.id)) return error("Cuota inválida.");

  const resultado = await api(`/pagos/mis-cuotas/${encodeURIComponent(cuota.id)}/comprobante`, { blob: true });
  if (!resultado.exito) {
    return resultado.status === 404 ? error("El comprobante todavía no está disponible para descargar.") : resultado;
  }
  descargarBlob(resultado.data, `comprobante-${nombreArchivoSeguro(cuota.mes_anio)}.pdf`);
  return { exito: true };
}
