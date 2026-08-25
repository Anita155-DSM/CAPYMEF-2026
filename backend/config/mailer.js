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
