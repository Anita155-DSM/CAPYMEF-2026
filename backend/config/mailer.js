import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { formatearFechaArgentina } from '../utils/fechas.js';
dotenv.config();

// Transportador SMTP. Completá estas variables en tu .env:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
// Si usás Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, y generá una
// "contraseña de aplicación" (no la contraseña normal de la cuenta).
// En los tests (NODE_ENV=test) se usa el transporte "jsonTransport" de nodemailer, que arma el mail pero NO lo
// envía. Es una red de seguridad: en los tests dotenv carga el .env real (con el SMTP real), y un test que se
// olvidara de simular el mailer mandaría mails de verdad a direcciones inventadas.
const transporter = process.env.NODE_ENV === 'test'
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true solo si usás el puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// ¿Está configurado el SMTP? Sin servidor, usuario y contraseña no se puede mandar nada: el cron de cuotas lo
// consulta para no intentar (y fallar) un mail por cada socio.
const falta = (valor) => typeof valor !== 'string' || valor.trim() === '';
export const smtpConfigurado = () => !falta(process.env.SMTP_HOST) && !falta(process.env.SMTP_USER) && !falta(process.env.SMTP_PASS);

/**
 * Envía el correo con el link para restablecer la contraseña.
 * @param {string} destinatario - Email del socio
 * @param {string} tokenSinHashear - El token plano (va en el link, NO el hasheado de la DB)
 */
export const enviarMailRecuperacion = async (destinatario, tokenSinHashear) => {
  const urlFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${urlFrontend}/reset-password/${tokenSinHashear}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"CAPYMEF" <no-responder@capymef.ar>',
    to: destinatario,
    subject: 'Recuperación de contraseña - CAPYMEF',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #132A46;">Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en CAPYMEF.</p>
        <p>Hacé click en el siguiente botón para elegir una nueva contraseña. Este link vence en <strong>1 hora</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #1D7BB6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">
          Si vos no pediste este cambio, podés ignorar este correo — tu contraseña no va a modificarse.
        </p>
      </div>
    `,
  });
};

/**
 * Envía el comprobante de pago en PDF adjunto al mail del socio.
 * @param {string} destinatario - Email del socio
 * @param {Object} datos - { razonSocial, mesAnio, monto }
 * @param {Buffer} pdfBuffer - El PDF ya generado (ver services/comprobante.service.js)
 */
export const enviarMailComprobantePago = async (destinatario, { razonSocial, mesAnio, monto }, pdfBuffer) => {
  const montoFormateado = Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"CAPYMEF" <no-responder@capymef.ar>',
    to: destinatario,
    subject: `Comprobante de pago - Cuota ${mesAnio} - CAPYMEF`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #132A46;">¡Gracias por tu pago, ${razonSocial}!</h2>
        <p>Registramos correctamente el pago de tu cuota correspondiente a <strong>${mesAnio}</strong> por un monto de <strong>$${montoFormateado}</strong>.</p>
        <p>Te adjuntamos tu comprobante de pago en formato PDF.</p>
      </div>
    `,
    attachments: [
      {
        filename: `comprobante-${mesAnio}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

// ==========================================
// Recordatorio de cuota por mail (cuota por vencer y cuota vencida)
// ==========================================
// Lo manda el cron de cuotas (services/cuota.service.js) además de la notificación interna: el día 7 para las
// cuotas pendientes y al cerrar la ventana de pago para las que vencieron. Sin datos sensibles: ni el CUIT ni
// links firmados; solo la razón social, el período, el monto y el vencimiento.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-11" -> "noviembre de 2026"
export const periodoEnPalabras = (mesAnio) => {
  const [anio, mes] = String(mesAnio).split('-').map(Number);
  return MESES[mes - 1] ? `${MESES[mes - 1]} de ${anio}` : String(mesAnio);
};

// 10000 o "10000.00" -> "$10.000,00" (formato argentino, con centavos, igual que el mail del comprobante)
export const montoEnPesos = (monto) =>
  `$${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// La razón social la escribe el socio al registrarse: se escapa para que no pueda meter HTML en el mail.
const escaparHtml = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Arma el mail (sin enviarlo). tipo: 'por_vencer' (recordatorio del día 7) o 'vencida'.
// La línea de cómo pagar usa FRONTEND_URL si está; si no, solo dice que ingrese a la plataforma (no se inventan
// rutas internas que podrían cambiar).
export const armarMailRecordatorioCuota = ({ tipo, razonSocial, mesAnio, monto, fechaVencimiento }) => {
  const periodo = periodoEnPalabras(mesAnio);
  const importe = montoEnPesos(monto);
  const vence = formatearFechaArgentina(fechaVencimiento, { day: 'numeric', month: 'long', year: 'numeric' });
  const plataforma = typeof process.env.FRONTEND_URL === 'string' ? process.env.FRONTEND_URL.trim() : '';
  const vencida = tipo === 'vencida';

  const subject = vencida
    ? `Tu cuota de ${periodo} está vencida - CAPYMEF`
    : `Recordatorio: tu cuota de ${periodo} vence el ${vence} - CAPYMEF`;
  const situacion = vencida
    ? `La cuota de ${periodo} por ${importe} venció el ${vence} y todavía figura impaga.`
    : `Te recordamos que la cuota de ${periodo} por ${importe} vence el ${vence}.`;
  const comoPagar = `${vencida ? 'Para regularizarla' : 'Para pagarla'}, ingresá a la plataforma de CAPYMEF${plataforma ? ` (${plataforma})` : ''} con tu usuario y entrá a la sección de pagos.`;
  const cierre = vencida
    ? 'Si ya la pagaste, no tengas en cuenta este mensaje.'
    : 'Si ya la pagaste, no tengas en cuenta este mensaje. ¡Gracias por estar al día!';

  const text = [`Hola, ${razonSocial}:`, '', situacion, '', comoPagar, '', cierre, '', 'CAPYMEF - Cámara de Pequeñas y Medianas Empresas de Formosa'].join('\n');
  const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #132A46;">${vencida ? 'Tu cuota está vencida' : 'Recordatorio de cuota'}</h2>
        <p>Hola, <strong>${escaparHtml(razonSocial)}</strong>:</p>
        <p>${escaparHtml(situacion)}</p>
        <p>${escaparHtml(comoPagar)}</p>
        <p style="font-size: 13px; color: #666;">${escaparHtml(cierre)}</p>
      </div>
    `;
  return { subject, text, html };
};

export const enviarMailRecordatorioCuota = async (destinatario, datos) => {
  const { subject, text, html } = armarMailRecordatorioCuota(datos);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"CAPYMEF" <no-responder@capymef.ar>',
    to: destinatario,
    subject,
    text,
    html,
  });
};
