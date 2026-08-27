import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Transportador SMTP. Completá estas variables en tu .env:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
// Si usás Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, y generá una
// "contraseña de aplicación" (no la contraseña normal de la cuenta).
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true solo si usás el puerto 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía el correo con el link para restablecer la contraseña.
 * @param {string} destinatario - Email del socio
 * @param {string} tokenSinHashear - El token plano (va en el link, NO el hasheado de la DB)
 */
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

