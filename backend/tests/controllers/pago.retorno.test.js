import '../helpers/entorno.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mismos reemplazos que en pago.webhook.test.js: nada sale del test (Mercado Pago, mail, Cloudinary).
vi.mock('../../services/pasarela.service.js', () => ({
  crearOrdenDePago: vi.fn(),
  procesarNotificacionPago: vi.fn(),
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({ subirPDFCloudinary: vi.fn() }));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));

// Se monta el router REAL de pagos, igual que en app.js: así también se prueba que la ruta
// no pide token.
const { default: pagoRoutes } = await import('../../routes/pago.routes.js');
const app = express();
app.use('/api/pagos', pagoRoutes);

const FRONTEND = 'http://localhost:5173';
const frontendOriginal = process.env.FRONTEND_URL;

beforeEach(() => {
  process.env.FRONTEND_URL = FRONTEND;
});

afterEach(() => {
  if (frontendOriginal === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = frontendOriginal;
  vi.restoreAllMocks();
});

const volver = (ruta) => request(app).get(`/api/pagos/retorno/${ruta}`);
// Separa la dirección de destino en base y parámetros, para revisarlos por separado.
const destino = (respuesta) => new URL(respuesta.headers.location);

describe('GET /api/pagos/retorno/:resultado', () => {
  it.each(['exitoso', 'pendiente', 'fallido'])('"%s" redirige con 302 a FRONTEND_URL/pago-%s', async (resultado) => {
    const respuesta = await volver(resultado);

    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.location).toBe(`${FRONTEND}/pago-${resultado}`);
  });

  it('no pide token (la abre el navegador del socio al volver de Mercado Pago)', async () => {
    // Sin cabecera Authorization: si la ruta tuviera verificarToken, respondería 401.
    const respuesta = await volver('exitoso');

    expect(respuesta.status).toBe(302);
  });

  it('reenvía los parámetros que manda Mercado Pago', async () => {
    const respuesta = await volver(
      'exitoso?payment_id=123&status=approved&external_reference=cuota-1&merchant_order_id=456' +
      '&collection_id=123&collection_status=approved&payment_type=credit_card&preference_id=pref-1' +
      '&site_id=MLA&processing_mode=aggregator&merchant_account_id=null'
    );

    const url = destino(respuesta);
    expect(`${url.origin}${url.pathname}`).toBe(`${FRONTEND}/pago-exitoso`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      payment_id: '123',
      status: 'approved',
      external_reference: 'cuota-1',
      merchant_order_id: '456',
      collection_id: '123',
      collection_status: 'approved',
      payment_type: 'credit_card',
      preference_id: 'pref-1',
      site_id: 'MLA',
      processing_mode: 'aggregator',
      merchant_account_id: 'null',
    });
  });

  it('codifica los valores reenviados', async () => {
    const respuesta = await volver(`exitoso?external_reference=${encodeURIComponent('a&b=c d')}`);

    expect(destino(respuesta).searchParams.get('external_reference')).toBe('a&b=c d');
    expect(destino(respuesta).searchParams.has('b')).toBe(false);
  });

  it.each([
    ['redirect', 'https://malo.com'],
    ['url', 'https://malo.com'],
    ['next', '//malo.com'],
  ])('descarta un parámetro que no está en la lista (%s)', async (nombre, valor) => {
    const respuesta = await volver(`exitoso?status=approved&${nombre}=${encodeURIComponent(valor)}`);

    expect(respuesta.headers.location).not.toContain(nombre);
    expect(respuesta.headers.location).not.toContain('malo.com');
    expect(destino(respuesta).searchParams.get('status')).toBe('approved');
  });

  it('descarta un parámetro repetido (llega como array)', async () => {
    const respuesta = await volver('exitoso?status=approved&status=rejected&payment_id=1');

    expect(destino(respuesta).searchParams.has('status')).toBe(false);
    expect(destino(respuesta).searchParams.get('payment_id')).toBe('1');
  });

  it('descarta un parámetro de más de 100 caracteres y acepta uno de exactamente 100', async () => {
    const respuesta = await volver(`exitoso?payment_id=${'1'.repeat(101)}&external_reference=${'a'.repeat(100)}`);

    expect(destino(respuesta).searchParams.has('payment_id')).toBe(false);
    expect(destino(respuesta).searchParams.get('external_reference')).toBe('a'.repeat(100));
  });

  it('el destino nunca depende de la query (no es una redirección abierta)', async () => {
    const respuesta = await volver(`exitoso?destino=${encodeURIComponent('https://malo.com')}&frontendUrl=https://malo.com`);

    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.location).toBe(`${FRONTEND}/pago-exitoso`);
  });

  it.each(['aprobado', 'exitoso2', 'EXITOSO', '..'])('un resultado desconocido ("%s") responde 404', async (resultado) => {
    const respuesta = await volver(encodeURIComponent(resultado));

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Ruta no encontrada.' });
  });

  it('sin FRONTEND_URL responde 500 sin redirigir', async () => {
    delete process.env.FRONTEND_URL;
    const espiaError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const respuesta = await volver('exitoso');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error de configuración del servidor.' });
    expect(respuesta.headers.location).toBeUndefined();
    expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('FRONTEND_URL'));
  });

  it('con FRONTEND_URL vacío también responde 500', async () => {
    process.env.FRONTEND_URL = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect((await volver('exitoso')).status).toBe(500);
  });
});
