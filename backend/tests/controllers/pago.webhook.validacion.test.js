import '../helpers/entorno.js';
import crypto from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Nada sale a internet: la consulta del pago a Mercado Pago, el mail, Cloudinary y el PDF son falsos.
// Todo lo demás es real: el router de pagos con el middleware de firma, el controlador y la base (SQLite).
vi.mock('../../services/pasarela.service.js', () => ({
  crearOrdenDePago: vi.fn(),
  procesarNotificacionPago: vi.fn(),
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(async () => {}) }));
vi.mock('../../services/cloudinary.service.js', () => ({
  subirPDFCloudinary: vi.fn(async () => ({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/comprobante' })),
}));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn(async () => Buffer.from('%PDF-1.4')) }));

const { procesarNotificacionPago } = await import('../../services/pasarela.service.js');
const { default: pagoRoutes } = await import('../../routes/pago.routes.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { Notificacion } = await import('../../models/notificacion.models.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
app.use(express.json());
app.use('/api/pagos', pagoRoutes);

// Firma como la de Mercado Pago, con un secreto inventado (ver firmaMercadoPago.test.js).
const SECRETO = 'secreto-falso-solo-para-tests';
const entornoOriginal = { modo: process.env.MP_WEBHOOK_MODE, secreto: process.env.MP_WEBHOOK_SECRET };

const avisoFirmado = (paymentId) => {
  const requestId = `req-${paymentId}`;
  const ts = '1730000000000';
  const v1 = crypto.createHmac('sha256', SECRETO).update(`id:${paymentId};request-id:${requestId};ts:${ts};`).digest('hex');
  return request(app)
    .post(`/api/pagos/webhook?data.id=${paymentId}&type=payment`)
    .set('x-signature', `ts=${ts},v1=${v1}`)
    .set('x-request-id', requestId)
    .send({});
};

let socio;
let cuota;
let admins;

beforeEach(async () => {
  process.env.MP_WEBHOOK_MODE = 'enforce';
  process.env.MP_WEBHOOK_SECRET = SECRETO;
  await reiniciarBase();
  socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
  admins = [await crearUsuario({ rol: 'admin' }), await crearUsuario({ rol: 'admin' })];
  cuota = await Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente' });
  procesarNotificacionPago.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [clave, valor] of [['MP_WEBHOOK_MODE', entornoOriginal.modo], ['MP_WEBHOOK_SECRET', entornoOriginal.secreto]]) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
});

afterAll(async () => {
  await cerrarBase();
});

// Lo que devolvería la API de Mercado Pago (ya normalizado por procesarNotificacionPago).
const pagoDeMP = (cambios = {}) => ({
  aprobado: true,
  estado: 'approved',
  moneda: 'ARS',
  cuotaId: cuota.id,
  montoPagado: 10000,
  idTransaccionExterna: 'mp-1001',
  ...cambios,
});

const avisosNoCoincide = () => Notificacion.count({ where: { tipo: 'pago_mp_no_coincide' } });

describe('webhook firmado: el pago tiene que coincidir con la cuota', () => {
  it('con el monto correcto marca la cuota pagada y crea el Pago', async () => {
    procesarNotificacionPago.mockResolvedValue(pagoDeMP());

    const respuesta = await avisoFirmado('mp-1001');

    expect(respuesta.status).toBe(200);
    expect((await Cuota.findByPk(cuota.id)).estado).toBe('pagada');
    const pago = await Pago.findOne({ where: { cuota_id: cuota.id } });
    expect(pago).not.toBeNull();
    expect(Number(pago.montoAbonado)).toBe(10000);
    // Se espera a que termine el segundo plano (su último paso es guardar la URL del comprobante).
    // No se cuentan los avisos de "pago por confirmar": salen en paralelo con el del socio, cada uno con su
    // transacción, y SQLite en memoria (una sola conexión) no admite dos transacciones a la vez. En
    // Postgres cada una usa su propia conexión del pool. Eso no es lo que prueba este test.
    await vi.waitFor(async () => expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).urlComprobante).toBeTruthy());
    expect(await avisosNoCoincide()).toBe(0);
  });

  it('con un monto menor responde 200, NO crea el Pago, la cuota sigue pendiente y avisa a los admins', async () => {
    procesarNotificacionPago.mockResolvedValue(pagoDeMP({ montoPagado: 1, idTransaccionExterna: 'mp-2002' }));

    const respuesta = await avisoFirmado('mp-2002');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(await Pago.count()).toBe(0);
    expect((await Cuota.findByPk(cuota.id)).estado).toBe('pendiente');

    await vi.waitFor(async () => expect(await avisosNoCoincide()).toBe(2));
    const aviso = await Notificacion.findOne({ where: { usuario_id: admins[0].id, tipo: 'pago_mp_no_coincide' } });
    expect(aviso.titulo).toBe('Pago de Mercado Pago que no coincide con la cuota: revisar');
    expect(aviso.mensaje).toContain('el monto no coincide con el de la cuota');
    expect(aviso.mensaje).toContain('mp-2002');
    // Al socio no le llega nada: no se registró ningún pago.
    expect(await Notificacion.count({ where: { usuario_id: socio.id } })).toBe(0);
  });

  it('el log del rechazo tiene ids y montos, sin datos personales del socio', async () => {
    procesarNotificacionPago.mockResolvedValue(pagoDeMP({ montoPagado: 1, idTransaccionExterna: 'mp-2003' }));

    await avisoFirmado('mp-2003');

    const log = console.warn.mock.calls.flat().join(' ');
    expect(log).toContain('mp-2003');
    expect(log).toContain(cuota.id);
    expect(log).not.toContain(socio.email);
    expect(log).not.toContain(socio.razonSocial);
    await vi.waitFor(async () => expect(await avisosNoCoincide()).toBe(2));
  });

  it('un pago en dólares por el mismo número tampoco se registra', async () => {
    procesarNotificacionPago.mockResolvedValue(pagoDeMP({ moneda: 'USD', idTransaccionExterna: 'mp-3003' }));

    expect((await avisoFirmado('mp-3003')).status).toBe(200);
    expect(await Pago.count()).toBe(0);
    expect((await Cuota.findByPk(cuota.id)).estado).toBe('pendiente');
    await vi.waitFor(async () => expect(await avisosNoCoincide()).toBe(2));
  });

  it('si Mercado Pago reenvía el mismo aviso inválido, no se duplican los avisos ni se registra nada', async () => {
    procesarNotificacionPago.mockResolvedValue(pagoDeMP({ montoPagado: 1, idTransaccionExterna: 'mp-4004' }));
    const intentos = vi.spyOn(Notificacion, 'findOrCreate');

    await avisoFirmado('mp-4004');
    await vi.waitFor(async () => expect(await avisosNoCoincide()).toBe(2));
    const segunda = await avisoFirmado('mp-4004');
    // Se espera a que el segundo aviso termine de intentar notificar (una vez por admin) antes de contar.
    await vi.waitFor(() => expect(intentos).toHaveBeenCalledTimes(4));

    expect(segunda.status).toBe(200);
    expect(await avisosNoCoincide()).toBe(2);
    expect(await Pago.count()).toBe(0);
    expect((await Cuota.findByPk(cuota.id)).estado).toBe('pendiente');
  });
});
