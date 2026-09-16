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

/**
 * Crea una orden de pago (preferencia) para una Cuota puntual.
 * Devuelve la URL a la que hay que redirigir al socio para que pague.
 *
 * @param {Object} cuota - instancia de Cuota, con su relación 'socio' incluida
 * @returns {Promise<{ initPoint: string, preferenceId: string }>}
 */
export const crearOrdenDePago = async (cuota) => {
  const preference = new Preference(client);

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
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pago-exitoso`,
        failure: `${process.env.FRONTEND_URL}/pago-fallido`,
        pending: `${process.env.FRONTEND_URL}/pago-pendiente`,
      },
    //   auto_return: 'approved',
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