import '../helpers/entorno.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Nada de esto puede salir del test: la consulta a Mercado Pago, los mails y las subidas a
// Cloudinary se reemplazan por funciones falsas. procesarNotificacionPago devuelve un pago "no
// aprobado", así el controlador responde 200 justo después y no llega a tocar la base.
vi.mock('../../services/pasarela.service.js', () => ({
  crearOrdenDePago: vi.fn(),
  procesarNotificacionPago: vi.fn(async () => ({ aprobado: false })),
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({ subirPDFCloudinary: vi.fn() }));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));

const { procesarNotificacionPago } = await import('../../services/pasarela.service.js');
const { recibirWebhook } = await import('../../controllers/pago.controllers.js');

// App mínima solo con el controlador (sin el middleware de firma, que tiene sus propios tests):
// acá se prueba qué id procesa el controlador.
const app = express();
app.use(express.json());
app.post('/webhook', recibirWebhook);

beforeEach(() => {
  procesarNotificacionPago.mockClear();
});

describe('recibirWebhook - qué id de pago procesa', () => {
  it('con data.id e id distintos en la query, procesa data.id (el que cubre la firma) y nunca id', async () => {
    // Si se procesara "id", un aviso firmado para A podría usarse para hacer procesar B.
    const respuesta = await request(app).post('/webhook?type=payment&data.id=AAA111&id=BBB222').send({});

    expect(respuesta.status).toBe(200);
    expect(procesarNotificacionPago).toHaveBeenCalledTimes(1);
    expect(procesarNotificacionPago).toHaveBeenCalledWith('AAA111');
    expect(procesarNotificacionPago).not.toHaveBeenCalledWith('BBB222');
  });

  it('con solo data.id en la query, procesa ese id', async () => {
    await request(app).post('/webhook?type=payment&data.id=123456').send({});

    expect(procesarNotificacionPago).toHaveBeenCalledWith('123456');
  });

  it('con solo id en la query (formato viejo), procesa ese id', async () => {
    await request(app).post('/webhook?topic=payment&id=654321').send({});

    expect(procesarNotificacionPago).toHaveBeenCalledWith('654321');
  });

  it('con el id solo en el cuerpo (body.data.id), procesa ese id', async () => {
    await request(app).post('/webhook').send({ type: 'payment', data: { id: '777888' } });

    expect(procesarNotificacionPago).toHaveBeenCalledWith('777888');
  });

  it('con data.id en el cuerpo e id en la query, procesa el del cuerpo', async () => {
    // El cuerpo es el respaldo que usa el middleware de firma: va antes que el formato viejo.
    await request(app).post('/webhook?id=BBB222').send({ type: 'payment', data: { id: 'AAA111' } });

    expect(procesarNotificacionPago).toHaveBeenCalledWith('AAA111');
  });
});

describe('recibirWebhook - avisos que no se procesan', () => {
  it('sin ningún id responde 200 { recibido: true } y no consulta el pago', async () => {
    const respuesta = await request(app).post('/webhook?type=payment').send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(procesarNotificacionPago).not.toHaveBeenCalled();
  });

  it('con un topic distinto de payment (merchant_order) responde 200 y no consulta el pago', async () => {
    const respuesta = await request(app).post('/webhook?topic=merchant_order&id=999').send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(procesarNotificacionPago).not.toHaveBeenCalled();
  });
});
