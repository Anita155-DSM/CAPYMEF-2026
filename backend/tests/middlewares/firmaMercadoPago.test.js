import '../helpers/entorno.js';
import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { verificarOrigenWebhook } from '../../middlewares/firmaMercadoPago.js';

// App mínima con el middleware y un webhook falso que solo responde 200: así se ve si el aviso
// pasó o fue rechazado, sin tocar la base ni Mercado Pago.
const app = express();
app.use(express.json());
app.post('/webhook', verificarOrigenWebhook, (req, res) => res.status(200).json({ recibido: true }));

// Secreto inventado: las firmas se calculan acá, igual que lo haría Mercado Pago.
const SECRETO = 'secreto-falso-solo-para-tests';
const REQUEST_ID = 'b1d2c3e4-0000-4000-8000-000000000001';
const TS = '1730000000000';
const DATA_ID = '123456789';
const V1 = crypto.createHmac('sha256', SECRETO).update(`id:${DATA_ID};request-id:${REQUEST_ID};ts:${TS};`).digest('hex');
const FIRMA_VALIDA = `ts=${TS},v1=${V1}`;

const avisoFirmado = () =>
  request(app)
    .post(`/webhook?data.id=${DATA_ID}&type=payment`)
    .set('x-signature', FIRMA_VALIDA)
    .set('x-request-id', REQUEST_ID)
    .send({});

const avisoFalso = () =>
  request(app)
    .post(`/webhook?data.id=${DATA_ID}&type=payment`)
    .set('x-signature', `ts=${TS},v1=${'0'.repeat(64)}`)
    .set('x-request-id', REQUEST_ID)
    .send({});

const avisoSinFirma = () => request(app).post(`/webhook?data.id=${DATA_ID}&type=payment`).send({});

// Cada test configura el modo y el secreto; después se restaura el entorno como estaba.
const entornoOriginal = { modo: process.env.MP_WEBHOOK_MODE, secreto: process.env.MP_WEBHOOK_SECRET };
// Si no se pasa "secreto" se usa el de prueba; si se pasa explícitamente undefined, se borra.
// (Un valor por defecto en el parámetro no serviría: undefined también lo activaría.)
const configurar = (opciones) => {
  const { modo } = opciones;
  const secreto = 'secreto' in opciones ? opciones.secreto : SECRETO;
  if (modo === undefined) delete process.env.MP_WEBHOOK_MODE;
  else process.env.MP_WEBHOOK_MODE = modo;
  if (secreto === undefined) delete process.env.MP_WEBHOOK_SECRET;
  else process.env.MP_WEBHOOK_SECRET = secreto;
};

let espiaLog;
let espiaWarn;

beforeEach(() => {
  // Silencia la consola y permite revisar qué se escribió.
  espiaLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  espiaWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  configurar({ modo: entornoOriginal.modo, secreto: entornoOriginal.secreto });
});

describe('verificarOrigenWebhook - modo off', () => {
  it.each([
    ['sin definir', undefined],
    ['vacío', ''],
    ['"off"', 'off'],
  ])('con MP_WEBHOOK_MODE %s deja pasar un aviso sin firma', async (_, modo) => {
    configurar({ modo });

    expect((await avisoSinFirma()).status).toBe(200);
  });
});

describe('verificarOrigenWebhook - modo log', () => {
  it('deja pasar un aviso con firma válida y anota "ok"', async () => {
    configurar({ modo: 'log' });

    expect((await avisoFirmado()).status).toBe(200);
    expect(espiaLog.mock.calls.flat().join(' ')).toContain('ok');
  });

  it('deja pasar un aviso con firma incorrecta, pero anota el motivo', async () => {
    configurar({ modo: 'log' });

    expect((await avisoFalso()).status).toBe(200);
    expect(espiaLog.mock.calls.flat().join(' ')).toContain('firma_incorrecta');
  });

  it('deja pasar aunque falte el secreto, y anota "sin_secreto"', async () => {
    configurar({ modo: 'log', secreto: undefined });

    expect((await avisoFirmado()).status).toBe(200);
    expect(espiaLog.mock.calls.flat().join(' ')).toContain('sin_secreto');
  });

  it('nunca escribe en la consola el secreto, la firma ni el encabezado x-signature', async () => {
    configurar({ modo: 'log' });

    await avisoFirmado();
    await avisoFalso();

    const todoLoEscrito = [...espiaLog.mock.calls, ...espiaWarn.mock.calls].flat().map(String).join(' ');
    expect(todoLoEscrito).not.toContain(SECRETO);
    expect(todoLoEscrito).not.toContain(V1);
    expect(todoLoEscrito).not.toContain(FIRMA_VALIDA);
    expect(todoLoEscrito).not.toContain('v1=');
  });
});

describe('verificarOrigenWebhook - modo enforce', () => {
  it('deja pasar un aviso con firma válida', async () => {
    configurar({ modo: 'enforce' });

    expect((await avisoFirmado()).status).toBe(200);
  });

  it('acepta el data.id del cuerpo si no viene en la query', async () => {
    configurar({ modo: 'enforce' });

    const respuesta = await request(app)
      .post('/webhook?type=payment')
      .set('x-signature', FIRMA_VALIDA)
      .set('x-request-id', REQUEST_ID)
      .send({ data: { id: DATA_ID } });

    expect(respuesta.status).toBe(200);
  });

  it('rechaza con 401 un aviso con firma incorrecta', async () => {
    configurar({ modo: 'enforce' });

    const respuesta = await avisoFalso();

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Firma no válida.' });
  });

  it('rechaza con 401 un aviso sin firma', async () => {
    configurar({ modo: 'enforce' });

    expect((await avisoSinFirma()).status).toBe(401);
  });

  it('rechaza con 401 aunque la firma sea correcta si falta el secreto (error de configuración)', async () => {
    // Un secreto sin cargar no puede terminar dejando el webhook abierto.
    configurar({ modo: 'enforce', secreto: undefined });

    expect((await avisoFirmado()).status).toBe(401);
  });

  it('rechaza con 401 si el secreto está vacío', async () => {
    configurar({ modo: 'enforce', secreto: '' });

    expect((await avisoFirmado()).status).toBe(401);
  });

  it('acepta el modo escrito con mayúsculas o espacios', async () => {
    configurar({ modo: ' ENFORCE ' });

    expect((await avisoFalso()).status).toBe(401);
  });
});

describe('verificarOrigenWebhook - el modo ignora mayúsculas y espacios', () => {
  // Con "enforce" no alcanza para probarlo (un modo desconocido también se trata como enforce):
  // hacen falta "off" y "log" escritos distinto, que solo funcionan si se normaliza el texto.
  it.each([' off ', 'OFF', 'Off'])('MP_WEBHOOK_MODE="%s" funciona como off', async (modo) => {
    configurar({ modo });

    expect((await avisoSinFirma()).status).toBe(200);
  });

  it.each(['LOG', ' log ', 'Log'])('MP_WEBHOOK_MODE="%s" funciona como log', async (modo) => {
    configurar({ modo });

    expect((await avisoFalso()).status).toBe(200);
    expect(espiaLog.mock.calls.flat().join(' ')).toContain('firma_incorrecta');
  });
});

describe('verificarOrigenWebhook - modo desconocido', () => {
  it.each(['enforced', 'on', 'true', 'cualquiera'])('MP_WEBHOOK_MODE="%s" se trata como enforce (falla cerrado)', async (modo) => {
    configurar({ modo });

    expect((await avisoFalso()).status).toBe(401);
    expect((await avisoFirmado()).status).toBe(200);
  });
});
