import '../helpers/entorno.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// El SDK de Mercado Pago se reemplaza por uno falso que guarda lo que se le manda: así se ve qué
// orden se arma sin salir a internet.
const ordenesEnviadas = [];
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn(() => ({
    create: vi.fn(async ({ body }) => {
      ordenesEnviadas.push(body);
      return { init_point: 'https://www.mercadopago.com.ar/checkout/falso', id: 'pref-1' };
    }),
  })),
  Payment: vi.fn(),
}));

const { armarRetornoPago, crearOrdenDePago } = await import('../../services/pasarela.service.js');

const FRONT_LOCAL = 'http://localhost:5173';
const FRONT_PUBLICO = 'https://capymef.org.ar';
const BACK_PUBLICO = 'https://ejemplo.ngrok-free.app';

describe('armarRetornoPago', () => {
  it('vía backend: las tres direcciones apuntan a /api/pagos/retorno del backend', () => {
    const { backUrls } = armarRetornoPago({ frontendUrl: FRONT_LOCAL, backendUrl: BACK_PUBLICO, viaBackend: true });

    expect(backUrls).toEqual({
      success: `${BACK_PUBLICO}/api/pagos/retorno/exitoso`,
      pending: `${BACK_PUBLICO}/api/pagos/retorno/pendiente`,
      failure: `${BACK_PUBLICO}/api/pagos/retorno/fallido`,
    });
  });

  it('directo al frontend: las tres direcciones apuntan a las páginas del frontend', () => {
    const { backUrls } = armarRetornoPago({ frontendUrl: FRONT_PUBLICO, backendUrl: BACK_PUBLICO, viaBackend: false });

    expect(backUrls).toEqual({
      success: `${FRONT_PUBLICO}/pago-exitoso`,
      pending: `${FRONT_PUBLICO}/pago-pendiente`,
      failure: `${FRONT_PUBLICO}/pago-fallido`,
    });
  });

  it('activa autoReturn con una dirección https', () => {
    expect(armarRetornoPago({ frontendUrl: FRONT_LOCAL, backendUrl: BACK_PUBLICO, viaBackend: true }).autoReturn).toBe(true);
    expect(armarRetornoPago({ frontendUrl: FRONT_PUBLICO, viaBackend: false }).autoReturn).toBe(true);
  });

  it('no activa autoReturn con una dirección http (local): Mercado Pago rechazaría la orden', () => {
    expect(armarRetornoPago({ frontendUrl: FRONT_LOCAL, backendUrl: BACK_PUBLICO, viaBackend: false }).autoReturn).toBe(false);
    expect(armarRetornoPago({ backendUrl: 'http://localhost:3000', viaBackend: true }).autoReturn).toBe(false);
  });

  it('quita la "/" final de la dirección base para no armar "//"', () => {
    const { backUrls } = armarRetornoPago({ frontendUrl: `${FRONT_PUBLICO}/`, viaBackend: false });

    expect(backUrls.success).toBe(`${FRONT_PUBLICO}/pago-exitoso`);
  });

  // Decisión documentada en armarRetornoPago: si falta la dirección base que corresponde, no se lanza
  // error y se devuelve { backUrls: undefined, autoReturn: false }; la orden se crea sin back_urls.
  it.each([
    ['frontendUrl undefined (directo al frontend)', { frontendUrl: undefined, backendUrl: BACK_PUBLICO, viaBackend: false }],
    ['backendUrl undefined (vía backend)', { frontendUrl: FRONT_LOCAL, backendUrl: undefined, viaBackend: true }],
    ['frontendUrl vacío', { frontendUrl: '', viaBackend: false }],
    ['backendUrl con solo espacios', { backendUrl: '   ', viaBackend: true }],
    ['sin argumentos', undefined],
  ])('con %s no lanza error y devuelve backUrls undefined y autoReturn false', (_, entrada) => {
    let resultado;
    expect(() => { resultado = armarRetornoPago(entrada); }).not.toThrow();
    expect(resultado).toEqual({ backUrls: undefined, autoReturn: false });
  });
});

describe('crearOrdenDePago - back_urls y auto_return', () => {
  const entornoOriginal = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    PAGO_RETORNO_VIA_BACKEND: process.env.PAGO_RETORNO_VIA_BACKEND,
  };
  const cuota = { id: 'cuota-1', mes_anio: '2026-11', monto: '10000.00', socio: { razonSocial: 'Empresa', email: 'socio@test.com' } };

  beforeEach(() => {
    ordenesEnviadas.length = 0;
  });

  afterEach(() => {
    for (const [clave, valor] of Object.entries(entornoOriginal)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  });

  it('en desarrollo (vía backend con https) manda las back_urls del backend y auto_return', async () => {
    Object.assign(process.env, { FRONTEND_URL: FRONT_LOCAL, BACKEND_URL: BACK_PUBLICO, PAGO_RETORNO_VIA_BACKEND: 'true' });

    await crearOrdenDePago(cuota);

    const [orden] = ordenesEnviadas;
    expect(orden.back_urls.success).toBe(`${BACK_PUBLICO}/api/pagos/retorno/exitoso`);
    expect(orden.auto_return).toBe('approved');
    // El resto de la orden no cambia.
    expect(orden.notification_url).toBe(`${BACK_PUBLICO}/api/pagos/webhook`);
    expect(orden.external_reference).toBe('cuota-1');
  });

  it('directo a un frontend local (http) no manda auto_return', async () => {
    Object.assign(process.env, { FRONTEND_URL: FRONT_LOCAL, BACKEND_URL: BACK_PUBLICO, PAGO_RETORNO_VIA_BACKEND: 'false' });

    await crearOrdenDePago(cuota);

    const [orden] = ordenesEnviadas;
    expect(orden.back_urls.success).toBe(`${FRONT_LOCAL}/pago-exitoso`);
    expect(orden).not.toHaveProperty('auto_return');
  });

  it('cualquier valor distinto de "true" se trata como directo al frontend', async () => {
    Object.assign(process.env, { FRONTEND_URL: FRONT_PUBLICO, BACKEND_URL: BACK_PUBLICO, PAGO_RETORNO_VIA_BACKEND: 'TRUE ' });

    await crearOrdenDePago(cuota);

    expect(ordenesEnviadas[0].back_urls.success).toBe(`${FRONT_PUBLICO}/pago-exitoso`);
  });
});
