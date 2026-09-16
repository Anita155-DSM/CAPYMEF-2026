import { Cuota } from '../models/cuota.models.js';
import { User } from '../models/user.models.js';
import { Pago } from '../models/pago.models.js';
import { crearOrdenDePago, procesarNotificacionPago } from '../services/pasarela.service.js';
import { generarComprobantePago } from '../services/comprobante.service.js';
import { enviarMailComprobantePago } from '../config/mailer.js';
import { subirPDFCloudinary } from '../services/cloudinary.service.js';

// ==========================================
// 1. INICIAR PAGO ONLINE (Socio logueado)
// ==========================================
// El socio pide pagar su cuota. Le devolvemos el link de Mercado Pago
// al que tiene que ir para completar el pago.
export const iniciarPagoOnline = async (req, res) => {
  try {
    const { id } = req.params; // ID de la Cuota
    const usuarioId = req.usuario.id;

    const cuota = await Cuota.findByPk(id, {
      include: [{ model: User, as: 'socio', attributes: ['id', 'razonSocial', 'email'] }],
    });

    if (!cuota) {
      return res.status(404).json({ exito: false, mensaje: 'Cuota no encontrada.' });
    }

    // Un socio solo puede pagar SU PROPIA cuota, no la de otro.
    if (cuota.usuario_id !== usuarioId) {
      return res.status(403).json({ exito: false, mensaje: 'No tenés permiso para pagar esta cuota.' });
    }

    if (cuota.estado === 'pagada') {
      return res.status(400).json({ exito: false, mensaje: 'Esta cuota ya fue abonada anteriormente.' });
    }

    const { initPoint } = await crearOrdenDePago(cuota);

    res.status(200).json({
      exito: true,
      mensaje: 'Orden de pago creada correctamente.',
      data: { linkPago: initPoint },
    });
  } catch (error) {
    console.error('Error al iniciar el pago online:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al iniciar el pago.' });
  }
};

// ==========================================
// 2. WEBHOOK — Mercado Pago nos avisa que cambió el estado de un pago
// ==========================================
// OJO: esta ruta NO tiene verificarToken. Quien la llama es el servidor de
// Mercado Pago, no un usuario logueado — no tiene forma de mandar un JWT nuestro.
export const recibirWebhook = async (req, res) => {
  try {
    // Mercado Pago manda varios "topics" distintos de notificación (merchant_order,
    // payment, etc.), a veces varias veces para el mismo evento de compra. Solo
    // nos interesan las de tipo "payment" — el resto las reconocemos, respondemos
    // 200 para que Mercado Pago no reintente, pero no las procesamos.
    const topic = req.query.topic || req.query.type || req.body?.type;

    if (topic && topic !== 'payment') {
      return res.status(200).json({ recibido: true });
    }

    const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id;

    if (!paymentId) {
      return res.status(200).json({ recibido: true });
    }

    const { aprobado, cuotaId, montoPagado, idTransaccionExterna } = await procesarNotificacionPago(paymentId);

    if (!aprobado || !cuotaId) {
      return res.status(200).json({ recibido: true }); // pago rechazado/pendiente: no hacemos nada todavía
    }

    const cuota = await Cuota.findByPk(cuotaId, {
      include: [{ model: User, as: 'socio', attributes: ['id', 'razonSocial', 'cuit', 'email'] }],
    });

    if (!cuota || cuota.estado === 'pagada') {
      // Ya procesada (o no existe): respondemos 200 igual, para no reintentos infinitos.
      return res.status(200).json({ recibido: true });
    }

    // Evitamos procesar 2 veces la misma transacción si el webhook llega duplicado.
    const pagoExistente = await Pago.findOne({ where: { idTransaccionExterna } });
    if (pagoExistente) {
      return res.status(200).json({ recibido: true });
    }

    const nuevoPago = await Pago.create({
      cuota_id: cuota.id,
      usuario_id: cuota.usuario_id,
      montoAbonado: montoPagado,
      metodoPago: 'Otro', // Mercado Pago puede ser tarjeta, débito, etc. — no mapeamos 1 a 1 todavía
      origenPago: 'pasarela',
      idTransaccionExterna,
      observaciones: 'Pago online vía Mercado Pago',
    });

    cuota.estado = 'pagada';
    await cuota.save();

    // Comprobante + mail + Cloudinary, mismo patrón que en el pago manual.
    try {
      const pdfBuffer = await generarComprobantePago({
        socio: cuota.socio,
        cuota: { mes_anio: cuota.mes_anio },
        pago: nuevoPago,
      });

      try {
        await enviarMailComprobantePago(
          cuota.socio.email,
          { razonSocial: cuota.socio.razonSocial, mesAnio: cuota.mes_anio, monto: nuevoPago.montoAbonado },
          pdfBuffer
        );
      } catch (errorMail) {
        console.error('Error al enviar el mail de comprobante (pago online):', errorMail.message);
      }

      try {
        const resultadoCloudinary = await subirPDFCloudinary(pdfBuffer, {
          folder: 'capymef_comprobantes_pago',
          public_id: `comprobante-${nuevoPago.id}`,
        });
        nuevoPago.urlComprobante = resultadoCloudinary.secure_url;
        await nuevoPago.save();
      } catch (errorCloudinary) {
        console.error('Error al subir el comprobante a Cloudinary (pago online):', errorCloudinary.message);
      }
    } catch (errorComprobante) {
      console.error('Error al generar el comprobante (pago online):', errorComprobante.message);
    }

    res.status(200).json({ recibido: true });
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error);
    // Igual respondemos 200: si devolvemos error, Mercado Pago reintenta el webhook
    // indefinidamente, y como ya logueamos el error, preferimos investigarlo manualmente.
    res.status(200).json({ recibido: true });
  }
};