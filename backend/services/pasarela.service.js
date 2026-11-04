import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// ==========================================
// Capa de abstracción sobre la pasarela de pago.
// HOY: implementado con Mercado Pago (Checkout Pro + API de Preferencias).
// El resto del sistema (controllers, rutas) nunca habla directo con el SDK de
// Mercado Pago — solo llama a las funciones de este archivo. Si en el futuro
// cambian de pasarela (MODO, Openpay), solo hay que reescribir este archivo.
// ==========================================

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Las direcciones a las que Mercado Pago devuelve al socio después de pagar (back_urls).
// Por qué hay dos variantes: Mercado Pago no acepta direcciones locales (localhost) en back_urls, y en
// desarrollo el frontend corre en http://localhost:5173. Pero el backend ya tiene una dirección pública
// https (ngrok), así que en desarrollo (viaBackend = true) las back_urls apuntan a una ruta del backend
// (/api/pagos/retorno/...) que redirige al frontend. En producción (viaBackend = false) van directo al
// frontend, que ya es público.
//
// autoReturn (volver solo al sitio después de un pago aprobado) se activa solo si la dirección de éxito
// es https: con una dirección http (local), Mercado Pago rechaza la orden si lleva auto_return.
//
// Función pura (no lee el entorno): recibe todo por parámetro para poder probarla sin Mercado Pago.
// Si falta la dirección base que corresponde (undefined o vacía), no lanza error: devuelve
// { backUrls: undefined, autoReturn: false }, y la orden se crea sin back_urls (Mercado Pago muestra
// su propia pantalla final) en vez de mandar direcciones rotas como "undefined/pago-exitoso".
export const armarRetornoPago = ({ frontendUrl, backendUrl, viaBackend } = {}) => {
  const base = viaBackend ? backendUrl : frontendUrl;
  if (typeof base !== 'string' || base.trim() === '') {
    return { backUrls: undefined, autoReturn: false };
  }
  const raiz = base.trim().replace(/\/+$/, ''); // sin "/" final, para no armar "//pago-exitoso"

  const backUrls = viaBackend
    ? {
      success: `${raiz}/api/pagos/retorno/exitoso`,
      pending: `${raiz}/api/pagos/retorno/pendiente`,
      failure: `${raiz}/api/pagos/retorno/fallido`,
    }
    : {
      success: `${raiz}/pago-exitoso`,
      pending: `${raiz}/pago-pendiente`,
      failure: `${raiz}/pago-fallido`,
    };

  return { backUrls, autoReturn: backUrls.success.startsWith('https://') };
};

/**
 * Crea una orden de pago (preferencia) para una Cuota puntual.
 * Devuelve la URL a la que hay que redirigir al socio para que pague.
 *
 * @param {Object} cuota - instancia de Cuota, con su relación 'socio' incluida
 * @returns {Promise<{ initPoint: string, preferenceId: string }>}
 */
export const crearOrdenDePago = async (cuota) => {
  const preference = new Preference(client);

  // En desarrollo local PAGO_RETORNO_VIA_BACKEND=true (ver armarRetornoPago); en producción false.
  const { backUrls, autoReturn } = armarRetornoPago({
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    viaBackend: process.env.PAGO_RETORNO_VIA_BACKEND === 'true',
  });

  const resultado = await preference.create({
    body: {
      items: [
        {
          title: `Cuota CAPYMEF ${cuota.mes_anio} - ${cuota.socio.razonSocial}`,
          quantity: 1,
          unit_price: Number(cuota.monto),
          currency_id: 'ARS',
        },
      ],
      // external_reference es CLAVE: es el dato que nos devuelve Mercado Pago
      // en la notificación del webhook, y nos permite saber a qué Cuota
      // corresponde el pago sin ambigüedad.
      external_reference: cuota.id,
      payer: {
        email: cuota.socio.email,
      },
      ...(backUrls && { back_urls: backUrls }),
      // Solo con una dirección https: con una local (http) Mercado Pago rechaza la orden.
      ...(autoReturn && { auto_return: 'approved' }),
      notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
    },
  });

  return {
    initPoint: resultado.init_point,
    preferenceId: resultado.id,
  };
};

/**
 * Procesa la notificación que manda Mercado Pago cuando cambia el estado de un pago.
 * Devuelve los datos normalizados que necesita el controller para actualizar la Cuota,
 * sin exponer la forma particular en que Mercado Pago arma su respuesta.
 *
 * @param {string} paymentId - el ID de pago que viene en la notificación
 * @returns {Promise<{ aprobado: boolean, cuotaId: string, montoPagado: number, idTransaccionExterna: string }>}
 */
export const procesarNotificacionPago = async (paymentId) => {
  const payment = new Payment(client);
  const resultado = await payment.get({ id: paymentId });

  return {
    aprobado: resultado.status === 'approved',
    cuotaId: resultado.external_reference,
    montoPagado: resultado.transaction_amount,
    idTransaccionExterna: String(resultado.id),
  };
};