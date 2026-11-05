import { api } from "@/api/client";
import { descargarBlob, idValido, nombreArchivoSeguro } from "@/shared/utils/seguridad";

// ==========================================
// FINANZAS, CUOTAS Y TARIFAS (solo admin)
// ==========================================

/** Todas las cuotas del sistema, cada una con los datos de su socio. */
export const obtenerCuotasAdmin = () => api("/cuotas");

/** Resumen financiero general (conteos por estado y total recaudado). */
export const obtenerResumenFinancieroAdmin = () => api("/cuotas/resumen-financiero");

/**
 * Registra el pago manual/efectivo de una cuota (PUT /cuotas/:id/pagar).
 * El backend crea el pago, marca la cuota como pagada, avisa al socio y le manda el comprobante.
 */
export function registrarPagoEfectivo(cuota, opciones = "") {
  if (!idValido(cuota?.id)) return Promise.resolve({ exito: false, mensaje: "Cuota inválida." });

  const esObjeto = opciones && typeof opciones === "object";
  const metodoPago = esObjeto ? opciones.metodoPago || "Efectivo" : "Efectivo";
  const nroComprobante = esObjeto ? opciones.nroComprobante?.trim() || null : null;
  const textoObs = esObjeto ? opciones.observaciones : opciones;

  return api(`/cuotas/${encodeURIComponent(cuota.id)}/pagar`, {
    method: "PUT",
    body: {
      metodoPago,
      nroComprobante,
      observaciones: String(textoObs || "").trim() || `Pago (${metodoPago}) registrado por administración`,
    },
  });
}

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

// ==========================================
// TESORERÍA: CONFIRMACIÓN DE PAGOS
// ==========================================

/** Lista los pagos registrados que Tesorería todavía no confirmó contra el banco/caja. */
export const obtenerPagosSinConfirmarAdmin = () => api("/cuotas/pagos/sin-confirmar");

/** Confirma uno o varios pagos por su ID (PUT /cuotas/pagos/confirmar). */
export function confirmarPagosAdmin(pagoIds = []) {
  const ids = Array.isArray(pagoIds) ? pagoIds.filter(idValido) : [];
  if (ids.length === 0) {
    return Promise.resolve({ exito: false, mensaje: "Seleccioná al menos un pago válido para confirmar." });
  }
  return api("/cuotas/pagos/confirmar", {
    method: "PUT",
    body: { pagoIds: ids },
  });
}

// ==========================================
// PROCESOS DE PERÍODO (CUOTAS)
// ==========================================

/** Dispara manualmente la generación de cuotas del mes actual para los socios aprobados. */
export const generarCuotasManualAdmin = () => api("/cuotas/generar-manual", { method: "POST" });

/** Cierra la ventana de pago marcando como vencidas las cuotas impagas vencidas y evaluando mora. */
export const marcarCuotasVencidasAdmin = () => api("/cuotas/marcar-vencidas", { method: "POST" });

/** Envía recordatorios de vencimiento a los socios con cuota pendiente del mes. */
export const enviarRecordatoriosAdmin = () => api("/cuotas/enviar-recordatorios", { method: "POST" });

// ==========================================
// TARIFAS POR CATEGORÍA
// ==========================================

/** Obtiene las tarifas vigentes de cada categoría de socio. */
export const obtenerTarifasAdmin = () => api("/tarifas");

/** Actualiza el monto mensual de una categoría (PUT /tarifas/:categoria). */
export function actualizarTarifaAdmin(categoria, monto) {
  if (!categoria) return Promise.resolve({ exito: false, mensaje: "Categoría inválida." });
  return api(`/tarifas/${encodeURIComponent(categoria)}`, {
    method: "PUT",
    body: { monto: Number(monto) },
  });
}
