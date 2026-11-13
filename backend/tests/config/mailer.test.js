import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ningún mail sale de verdad: nodemailer se reemplaza por un transporte falso que guarda lo que se le
// pide enviar. dotenv también se reemplaza, para que el test no lea el .env real: todas las variables
// que usa el mailer se ponen acá, con valores inventados.
const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

vi.stubEnv('SMTP_HOST', 'smtp.prueba.test');
vi.stubEnv('SMTP_PORT', '2525');
vi.stubEnv('SMTP_USER', 'usuario-de-prueba');
vi.stubEnv('SMTP_PASS', 'clave-de-prueba');
// Se carga el módulo como en producción: en NODE_ENV=test usa un transporte que no envía (ver el último bloque).
vi.stubEnv('NODE_ENV', 'production');

const { enviarMailRecuperacion, enviarMailComprobantePago } = await import('../../config/mailer.js');
// La configuración del transporte se lee una sola vez, al importar el módulo: se guarda antes de que
// afterEach limpie los registros de llamadas.
const configuracionTransporte = createTransport.mock.calls[0][0];

beforeEach(() => {
  vi.stubEnv('FRONTEND_URL', 'https://capymef.test');
  vi.stubEnv('EMAIL_FROM', '"CAPYMEF Pruebas" <pruebas@capymef.test>');
  sendMail.mockResolvedValue({ messageId: 'falso' });
});

afterEach(() => {
  sendMail.mockReset();
});

const mailEnviado = () => sendMail.mock.calls[0][0];

describe('transporte SMTP', () => {
  it('se configura con el servidor, el puerto y las credenciales de las variables de entorno', () => {
    expect(configuracionTransporte).toEqual({
      host: 'smtp.prueba.test',
      port: 2525,
      secure: false,
      auth: { user: 'usuario-de-prueba', pass: 'clave-de-prueba' },
    });
  });
});

describe('enviarMailRecuperacion', () => {
  it('manda al socio el link de recuperación con el token SIN hashear', async () => {
    await enviarMailRecuperacion('socio@test.com', 'token-plano-123');

    const mail = mailEnviado();
    expect(mail.to).toBe('socio@test.com');
    expect(mail.subject).toBe('Recuperación de contraseña - CAPYMEF');
    expect(mail.html).toContain('href="https://capymef.test/reset-password/token-plano-123"');
  });

  it('avisa que el link vence en 1 hora y que se puede ignorar si no lo pidió', async () => {
    await enviarMailRecuperacion('socio@test.com', 't');

    expect(mailEnviado().html).toContain('<strong>1 hora</strong>');
    expect(mailEnviado().html).toContain('podés ignorar este correo');
  });

  it('usa el remitente configurado en EMAIL_FROM', async () => {
    await enviarMailRecuperacion('socio@test.com', 't');

    expect(mailEnviado().from).toBe('"CAPYMEF Pruebas" <pruebas@capymef.test>');
  });

  it('sin FRONTEND_URL ni EMAIL_FROM usa los valores por defecto (frontend local y no-responder)', async () => {
    vi.stubEnv('FRONTEND_URL', '');
    vi.stubEnv('EMAIL_FROM', '');

    await enviarMailRecuperacion('socio@test.com', 'abc');

    expect(mailEnviado().html).toContain('href="http://localhost:5173/reset-password/abc"');
    expect(mailEnviado().from).toBe('"CAPYMEF" <no-responder@capymef.ar>');
  });

  it('si el servidor de correo falla, el error sube a quien lo llamó (que decide qué hacer)', async () => {
    sendMail.mockRejectedValue(new Error('SMTP caído'));

    await expect(enviarMailRecuperacion('socio@test.com', 't')).rejects.toThrow('SMTP caído');
  });
});

describe('enviarMailComprobantePago', () => {
  const pdf = Buffer.from('%PDF-1.4 comprobante');

  it('manda el comprobante en PDF adjunto, con el período en el asunto y en el nombre del archivo', async () => {
    await enviarMailComprobantePago('socio@test.com', { razonSocial: 'Empresa SA', mesAnio: '2026-11', monto: 10000 }, pdf);

    const mail = mailEnviado();
    expect(mail.to).toBe('socio@test.com');
    expect(mail.subject).toBe('Comprobante de pago - Cuota 2026-11 - CAPYMEF');
    expect(mail.attachments).toEqual([{ filename: 'comprobante-2026-11.pdf', content: pdf, contentType: 'application/pdf' }]);
  });

  it('saluda al socio por su razón social y muestra el monto con formato argentino', async () => {
    await enviarMailComprobantePago('socio@test.com', { razonSocial: 'Empresa SA', mesAnio: '2026-11', monto: '12500.5' }, pdf);

    expect(mailEnviado().html).toContain('¡Gracias por tu pago, Empresa SA!');
    expect(mailEnviado().html).toContain('$12.500,50');
  });
});

describe('transporte en los tests (red de seguridad)', () => {
  it('con NODE_ENV=test usa jsonTransport: arma el mail pero no lo envía, aunque el .env tenga un SMTP real', async () => {
    vi.resetModules();
    createTransport.mockClear();
    vi.stubEnv('NODE_ENV', 'test');

    await import('../../config/mailer.js');

    expect(createTransport).toHaveBeenCalledWith({ jsonTransport: true });
  });
});
