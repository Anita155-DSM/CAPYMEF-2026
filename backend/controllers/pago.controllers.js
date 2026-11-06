import { Cuota } from '../models/cuota.models.js';
import { User } from '../models/user.models.js';
import { Pago } from '../models/pago.models.js';
import { crearOrdenDePago, procesarNotificacionPago } from '../services/pasarela.service.js';
import { generarComprobantePago } from '../services/comprobante.service.js';
import { enviarMailComprobantePago } from '../config/mailer.js';
import { subirPDFCloudinary } from '../services/cloudinary.service.js';
import {
  crearNotificacion,
  notificarAdmins,
  formatearMonto,
  formatearPeriodo,
} from '../services/notificacion.service.js';
import { evaluarCategoriaSocio } from '../services/categoria.service.js';
import { descargarPdfGuardado } from '../services/comprobanteGuardado.service.js';
import { CODIGOS_AUTH } from '../middlewares/codigosAuth.js';
import { esCuentaDeGestion } from '../services/abonaCuota.service.js';

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
    // Una cuenta de gestión (admin) no paga cuota (ver abonaCuota.service.js): aunque haya quedado con
    // una cuota vieja a su nombre, no puede iniciar el pago. Misma respuesta que una cuota ajena.
    if (cuota.usuario_id !== usuarioId || esCuentaDeGestion(req.usuario)) {
      // SIN_PERMISOS: la sesión es válida (solo que la cuota es de otro), así que no hay que cerrarla.
      return res.status(403).json({ exito: false, mensaje: 'No tenés permiso para pagar esta cuota.', codigo: CODIGOS_AUTH.SIN_PERMISOS });
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
// RETORNO DEL PAGO — puente hacia el frontend (pensado para desarrollo local)
// ==========================================
// Mercado Pago no acepta direcciones locales en back_urls. En desarrollo las back_urls apuntan acá
// (al backend, que tiene dirección pública https) y esta ruta redirige al frontend local.
// Ver armarRetornoPago en services/pasarela.service.js.
//
// OJO: lo que llega en la query (por ejemplo status=approved) NO es de fiar: lo puede escribir
// cualquiera en la barra de direcciones. Solo se reenvía para que el frontend lo MUESTRE. La que
// decide si la cuota está pagada es el webhook, que consulta el pago real en Mercado Pago.
const RESULTADOS_RETORNO = new Set(['exitoso', 'pendiente', 'fallido']);

// Únicos parámetros que se reenvían (los que manda Mercado Pago al volver). Todo lo demás se descarta.
const PARAMETROS_RETORNO = [
  'payment_id', 'status', 'external_reference', 'merchant_order_id', 'collection_id',
  'collection_status', 'payment_type', 'preference_id', 'site_id', 'processing_mode',
  'merchant_account_id',
];
const LARGO_MAXIMO_PARAMETRO = 100;

export const redirigirRetornoPago = (req, res) => {
  const { resultado } = req.params;
  if (!RESULTADOS_RETORNO.has(resultado)) {
    return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada.' });
  }

  // El destino sale SIEMPRE del .env, nunca de la petición: si saliera de la query, cualquiera
  // podría usar nuestra dirección para mandar gente a otro sitio (redirección abierta).
  const frontendUrl = process.env.FRONTEND_URL;
  if (typeof frontendUrl !== 'string' || frontendUrl.trim() === '') {
    console.error('Retorno de pago: FRONTEND_URL no está definido en la configuración del servidor.');
    return res.status(500).json({ exito: false, mensaje: 'Error de configuración del servidor.' });
  }

  // Solo texto de hasta 100 caracteres: un parámetro repetido llega como array y se descarta.
  const parametros = new URLSearchParams();
  for (const nombre of PARAMETROS_RETORNO) {
    const valor = req.query[nombre];
    if (typeof valor === 'string' && valor.length <= LARGO_MAXIMO_PARAMETRO) parametros.append(nombre, valor);
  }

  const query = parametros.toString();
  const destino = `${frontendUrl.trim().replace(/\/+$/, '')}/pago-${resultado}${query ? `?${query}` : ''}`;
  return res.redirect(302, destino);
};

// ==========================================
// 2. WEBHOOK — Mercado Pago nos avisa que cambió el estado de un pago
// ==========================================

// Lo que se hace DESPUÉS de responderle a Mercado Pago: avisos internos y comprobante (PDF, mail y
// subida a Cloudinary). Antes el webhook esperaba todo esto y tardaba 14 a 20 segundos en responder;
// Mercado Pago espera la respuesta un tiempo limitado y, si no llega, reintenta el aviso.
// El pago ya quedó registrado cuando esto corre, así que nada de lo que pase acá puede deshacerlo.
//
// Orden: primero los avisos y después el comprobante. El aviso a Tesorería ("pago por confirmar") es
// lo operativo importante y no tiene que esperar al mail ni a la subida del PDF. El aviso al socio
// dice "ya podés descargar tu comprobante", y es cierto aunque llegue antes: si el PDF todavía no se
// subió (o falló), descargarMiComprobante lo regenera.
// Los dos avisos van en paralelo y con allSettled: si uno falla, el otro se manda igual, y el
// comprobante se intenta de todos modos.
//
// Si el servidor se reinicia justo después de responder, el comprobante no se pierde:
// descargarMiComprobante lo regenera cuando el pago no tiene urlComprobante.
//
// Se llama sin await, así que NUNCA puede terminar en una promesa rechazada sin capturar (eso puede
// tirar abajo el proceso): todo va dentro de un try/catch que solo deja el error en el log.
const completarPagoEnSegundoPlano = async ({ cuota, nuevoPago }) => {
  try {
    // Los dos textos se arman ANTES de llamar a nada: si armar uno fallara, no queda ningún aviso ya
    // lanzado cuya promesa nadie espera.
    // Al socio: confirmación de que su pago ya figura.
    const avisoSocio = {
      usuarioId: cuota.usuario_id,
      tipo: 'pago_registrado',
      titulo: 'Recibimos tu pago',
      mensaje: `Registramos tu pago de ${formatearMonto(nuevoPago.montoAbonado)} por la cuota de ${formatearPeriodo(cuota.mes_anio)}. Ya podés descargar tu comprobante desde la sección de pagos.`,
      referencia: `pago-registrado:${nuevoPago.id}`,
    };
    // A los administradores: hay un pago online que Tesorería todavía debe verificar contra el banco.
    const avisoAdmins = {
      tipo: 'pago_por_confirmar',
      titulo: 'Pago online por confirmar',
      mensaje: `${cuota.socio.razonSocial} pagó ${formatearMonto(nuevoPago.montoAbonado)} (cuota ${formatearPeriodo(cuota.mes_anio)}). Falta la confirmación de Tesorería.`,
      referencia: `pago-por-confirmar:${nuevoPago.id}`,
    };
    const avisos = await Promise.allSettled([crearNotificacion(avisoSocio), notificarAdmins(avisoAdmins)]);
    for (const aviso of avisos) {
      if (aviso.status === 'rejected') {
        console.error(`Error al crear un aviso del pago online ${nuevoPago.id}:`, aviso.reason);
      }
    }

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
  } catch (error) {
    // Lo que no atrapan los try internos (por ejemplo, una cuota cuyo socio ya no existe, que rompe al
    // armar el texto del aviso) termina acá: queda en el log y el proceso sigue.
    console.error(`Error en el trabajo posterior al pago ${nuevoPago?.id} (el pago ya está registrado):`, error);
  }
};

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

    // El id que se procesa tiene que ser el MISMO que cubre la firma: el middleware de firma
    // (firmaMercadoPago.js) verifica req.query['data.id'] (con respaldo en el cuerpo). Si acá se
    // leyera primero req.query.id, un aviso con ?data.id=A (firmado) y &id=B haría validar A y
    // procesar B. El formato viejo (?id=) queda solo como último respaldo.
    const paymentId = req.query['data.id'] || req.body?.data?.id || req.query.id;

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

    // Mercado Pago a veces manda el MISMO aviso dos veces casi al mismo tiempo. La verificación
    // de arriba (findOne) no alcanza: los dos avisos pueden pasarla antes de que alguno escriba.
    // La que de verdad lo impide es la restricción única de la base (cuota_id e
    // idTransaccionExterna en la tabla pagos): el segundo create falla y lo tratamos como
    // "ya procesado", sin repetir pago, alertas ni mail.
    let nuevoPago;
    try {
      nuevoPago = await Pago.create({
        cuota_id: cuota.id,
        usuario_id: cuota.usuario_id,
        montoAbonado: montoPagado,
        metodoPago: 'Otro', // Mercado Pago puede ser tarjeta, débito, etc. — no mapeamos 1 a 1 todavía
        origenPago: 'pasarela',
        idTransaccionExterna,
        observaciones: 'Pago online vía Mercado Pago',
      });
    } catch (errorCreacion) {
      if (errorCreacion.name === 'SequelizeUniqueConstraintError') {
        console.log(`Aviso duplicado de Mercado Pago ignorado (transacción ${idTransaccionExterna}): ya estaba procesada.`);
        return res.status(200).json({ recibido: true });
      }
      throw errorCreacion; // cualquier otro error lo maneja el catch general de abajo
    }

    cuota.estado = 'pagada';
    await cuota.save();

    // Si el socio estaba Adherente por mora y con este pago quedó sin deuda vencida, vuelve a Activo
    // en el momento. Nunca lanza error: no puede romper el procesamiento del webhook.
    await evaluarCategoriaSocio(cuota.usuario_id);

    // Lo crítico ya quedó guardado (el pago, la cuota pagada y la categoría): se responde YA, para
    // que Mercado Pago no reintente el aviso mientras se arma el comprobante.
    res.status(200).json({ recibido: true });

    // Comprobante, mail, Cloudinary y avisos, después de responder (ver completarPagoEnSegundoPlano).
    completarPagoEnSegundoPlano({ cuota, nuevoPago });
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error);
    // Igual respondemos 200: si devolvemos error, Mercado Pago reintenta el webhook
    // indefinidamente, y como ya logueamos el error, preferimos investigarlo manualmente.
    // Si la respuesta ya salió, no se puede responder dos veces.
    if (!res.headersSent) res.status(200).json({ recibido: true });
  }
};

// ==========================================
// 3. MIS CUOTAS (Socio logueado) — solo lectura
// ==========================================
// Devuelve ÚNICAMENTE las cuotas del socio dueño del token: el id sale de
// req.usuario (firmado por nosotros), nunca de un parámetro que mande el cliente.
export const obtenerMisCuotas = async (req, res) => {
  try {
    const cuotas = await Cuota.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['id', 'mes_anio', 'monto', 'fecha_vencimiento', 'estado'],
      include: [{
        model: Pago,
        as: 'pago',
        // Sin datos internos de Tesorería (confirmadoPor, etc.)
        attributes: ['id', 'montoAbonado', 'fechaPago', 'metodoPago', 'origenPago', 'urlComprobante'],
      }],
      order: [['mes_anio', 'DESC']],
    });

    res.status(200).json({ exito: true, data: cuotas });
  } catch (error) {
    console.error('Error al obtener las cuotas del socio:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al obtener tus cuotas.' });
  }
};

// ==========================================
// 4. DESCARGAR MI COMPROBANTE (Socio logueado)
// ==========================================
// Se entrega el MISMO PDF que se emitió y se guardó en Cloudinary (urlComprobante). Solo si no está
// o no se puede traer, se regenera como plan B.
// Si la cuota no es del socio respondemos 404 (no confirmamos que el id exista).
// El formato del id (UUID) ya lo valida router.param en pago.routes.js, antes de llegar acá.
export const descargarMiComprobante = async (req, res) => {
  try {
    const cuota = await Cuota.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
      include: [
        { model: User, as: 'socio', attributes: ['razonSocial', 'cuit'] },
        { model: Pago, as: 'pago' },
      ],
    });

    if (!cuota) {
      return res.status(404).json({ exito: false, mensaje: 'Cuota no encontrada.' });
    }

    if (cuota.estado !== 'pagada' || !cuota.pago) {
      return res.status(400).json({ exito: false, mensaje: 'Esta cuota todavía no tiene un pago registrado.' });
    }

    let pdfBuffer = await descargarPdfGuardado(cuota.pago.urlComprobante);

    if (!pdfBuffer) {
      pdfBuffer = await generarComprobantePago({
        socio: cuota.socio,
        cuota: { mes_anio: cuota.mes_anio },
        pago: cuota.pago,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprobante-${cuota.mes_anio}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar el comprobante del socio:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al generar el comprobante.' });
  }
};
