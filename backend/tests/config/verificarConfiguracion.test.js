import '../helpers/entorno.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluarConfiguracion, verificarConfiguracion } from '../../config/verificarConfiguracion.js';

// Un entorno de producción completo y correcto, con valores inventados. Cada test cambia solo lo que
// le importa. Ningún valor es real.
const entornoCorrecto = () => ({
  DB_HOST: 'base.ejemplo.test',
  DB_USER: 'usuario_prueba',
  DB_PASSWORD: 'clave-de-base-inventada',
  DB_DATABASE: 'capymef_prueba',
  JWT_SECRET: 'clave-de-sesion-inventada-de-mas-de-32-caracteres',
  FRONTEND_URL: 'https://capymef.ejemplo.test',
  BACKEND_URL: 'https://api.capymef.ejemplo.test',
  MERCADOPAGO_ACCESS_TOKEN: 'token-de-mp-inventado',
  MP_WEBHOOK_SECRET: 'secreto-de-webhook-inventado',
  MP_WEBHOOK_MODE: 'enforce',
  PAGO_RETORNO_VIA_BACKEND: 'false',
  SMTP_HOST: 'smtp.ejemplo.test',
  SMTP_USER: 'mailer',
  SMTP_PASS: 'clave-de-mail-inventada',
  CLOUDINARY_CLOUD_NAME: 'nube',
  CLOUDINARY_API_KEY: 'api-key-inventada',
  CLOUDINARY_API_SECRET: 'api-secret-inventado',
});
const enProduccion = (entorno) => evaluarConfiguracion(entorno, { produccion: true });
const enDesarrollo = (entorno) => evaluarConfiguracion(entorno, { produccion: false });
const todosLosTextos = ({ errores, avisos }) => [...errores, ...avisos].join('\n');

describe('evaluarConfiguracion - producción', () => {
  it('con todo bien configurado no da errores ni avisos', () => {
    expect(enProduccion(entornoCorrecto())).toEqual({ errores: [], avisos: [] });
  });

  it.each([
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL', 'MERCADOPAGO_ACCESS_TOKEN',
  ])('falta la obligatoria %s: es un error que la nombra', (nombre) => {
    const entorno = entornoCorrecto();
    delete entorno[nombre];

    const { errores } = enProduccion(entorno);

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain(nombre);
  });

  it('una obligatoria vacía o con solo espacios cuenta como faltante', () => {
    expect(enProduccion({ ...entornoCorrecto(), DB_HOST: '' }).errores[0]).toContain('DB_HOST');
    expect(enProduccion({ ...entornoCorrecto(), DB_HOST: '   ' }).errores[0]).toContain('DB_HOST');
  });

  it('JWT_SECRET con menos de 32 caracteres es un error', () => {
    const { errores } = enProduccion({ ...entornoCorrecto(), JWT_SECRET: 'a'.repeat(31) });

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('JWT_SECRET');
  });

  it('JWT_SECRET de exactamente 32 caracteres está bien', () => {
    expect(enProduccion({ ...entornoCorrecto(), JWT_SECRET: 'a'.repeat(32) }).errores).toEqual([]);
  });

  it.each([
    ['off', 'off'],
    ['log', 'log'],
    ['vacío', ''],
    ['sin definir', undefined],
    ['un valor cualquiera', 'enforced'],
  ])('MP_WEBHOOK_MODE %s (distinto de enforce) es un error', (_, modo) => {
    const { errores } = enProduccion({ ...entornoCorrecto(), MP_WEBHOOK_MODE: modo });

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('MP_WEBHOOK_MODE');
  });

  it('MP_WEBHOOK_MODE con mayúsculas o espacios se acepta (igual que en el middleware)', () => {
    expect(enProduccion({ ...entornoCorrecto(), MP_WEBHOOK_MODE: ' ENFORCE ' }).errores).toEqual([]);
  });

  it('falta MP_WEBHOOK_SECRET: es un error', () => {
    const entorno = entornoCorrecto();
    delete entorno.MP_WEBHOOK_SECRET;

    const { errores } = enProduccion(entorno);

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('MP_WEBHOOK_SECRET');
  });

  it("PAGO_RETORNO_VIA_BACKEND en 'true' es un error (es solo de desarrollo local)", () => {
    const { errores } = enProduccion({ ...entornoCorrecto(), PAGO_RETORNO_VIA_BACKEND: 'true' });

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('PAGO_RETORNO_VIA_BACKEND');
  });

  it.each(['BACKEND_URL', 'FRONTEND_URL'])('%s sin https:// es un error', (nombre) => {
    const { errores } = enProduccion({ ...entornoCorrecto(), [nombre]: 'http://capymef.ejemplo.test' });

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain(nombre);
  });

  it('una variable obligatoria que falta se informa una sola vez (no también por la regla de https)', () => {
    const entorno = entornoCorrecto();
    delete entorno.BACKEND_URL;

    expect(enProduccion(entorno).errores).toHaveLength(1);
  });

  it('varios problemas a la vez se informan todos', () => {
    const { errores } = enProduccion({
      ...entornoCorrecto(), JWT_SECRET: 'corta', MP_WEBHOOK_MODE: 'off', FRONTEND_URL: 'http://localhost:5173',
    });

    expect(errores).toHaveLength(3);
  });
});

describe('evaluarConfiguracion - desarrollo', () => {
  // Una configuración típica de desarrollo local: todo lo que en producción es error acá es aviso.
  it('las mismas reglas dan avisos y nunca errores', () => {
    const entorno = {
      ...entornoCorrecto(),
      JWT_SECRET: 'corta',
      MP_WEBHOOK_MODE: 'off',
      MP_WEBHOOK_SECRET: '',
      PAGO_RETORNO_VIA_BACKEND: 'true',
      FRONTEND_URL: 'http://localhost:5173',
      BACKEND_URL: 'http://localhost:3000',
    };
    delete entorno.MERCADOPAGO_ACCESS_TOKEN;

    const { errores, avisos } = enDesarrollo(entorno);

    expect(errores).toEqual([]);
    for (const nombre of ['JWT_SECRET', 'MP_WEBHOOK_MODE', 'MP_WEBHOOK_SECRET', 'PAGO_RETORNO_VIA_BACKEND', 'FRONTEND_URL', 'BACKEND_URL', 'MERCADOPAGO_ACCESS_TOKEN']) {
      expect(avisos.some((aviso) => aviso.includes(nombre))).toBe(true);
    }
  });

  it('sin el parámetro de opciones se toma como desarrollo (nunca da errores)', () => {
    expect(evaluarConfiguracion({}).errores).toEqual([]);
  });

  it.each([['null', null], ['un texto', 'production']])('con opciones %s no lanza excepción y se toma como desarrollo', (_, opciones) => {
    let resultado;
    expect(() => { resultado = evaluarConfiguracion({}, opciones); }).not.toThrow();
    expect(resultado.errores).toEqual([]);
  });
});

describe('evaluarConfiguracion - servicios de mail y archivos', () => {
  // Sin Cloudinary falla el registro de socios y sin SMTP no hay mails: en producción no puede arrancar.
  const SERVICIOS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

  it.each(SERVICIOS)('falta %s: en producción es un error que la nombra', (nombre) => {
    const entorno = entornoCorrecto();
    delete entorno[nombre];

    const { errores } = enProduccion(entorno);

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain(nombre);
  });

  it.each(SERVICIOS)('%s vacía (solo espacios): en producción también es un error', (nombre) => {
    const { errores } = enProduccion({ ...entornoCorrecto(), [nombre]: '   ' });

    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain(nombre);
  });

  it.each(SERVICIOS)('falta %s: en desarrollo es solo un aviso', (nombre) => {
    const entorno = entornoCorrecto();
    delete entorno[nombre];

    const { errores, avisos } = enDesarrollo(entorno);

    expect(errores).toEqual([]);
    expect(avisos.some((aviso) => aviso.includes(nombre))).toBe(true);
  });
});

describe('evaluarConfiguracion - opcionales', () => {
  it.each(['PORT', 'DB_PORT', 'DB_SSL', 'SMTP_PORT', 'EMAIL_FROM'])('falta %s: no avisa (tiene un valor por defecto)', (nombre) => {
    const entorno = entornoCorrecto();
    delete entorno[nombre];

    expect(enProduccion(entorno)).toEqual({ errores: [], avisos: [] });
  });
});

describe('evaluarConfiguracion - nunca muestra valores', () => {
  // Valores reconocibles: si alguno aparece en un mensaje, se estaría filtrando una clave al log.
  const VALORES = {
    JWT_SECRET: 'SECRETO-DE-PRUEBA-123',
    FRONTEND_URL: 'http://VALOR-VISIBLE-FRONT.test',
    BACKEND_URL: 'http://VALOR-VISIBLE-BACK.test',
    MP_WEBHOOK_MODE: 'VALOR-VISIBLE-MODO',
    PAGO_RETORNO_VIA_BACKEND: 'true',
    DB_PASSWORD: '   ',
  };

  it.each([['producción', true], ['desarrollo', false]])('en %s, ningún mensaje contiene el valor de una variable', (_, produccion) => {
    const resultado = evaluarConfiguracion({ ...entornoCorrecto(), ...VALORES }, { produccion });
    const textos = todosLosTextos(resultado);

    // Hay mensajes (las reglas se incumplen a propósito)...
    expect(textos).toContain('JWT_SECRET');
    // ...pero ninguno muestra un valor.
    for (const valor of ['SECRETO-DE-PRUEBA-123', 'VALOR-VISIBLE-FRONT', 'VALOR-VISIBLE-BACK', 'VALOR-VISIBLE-MODO']) {
      expect(textos).not.toContain(valor);
    }
    // También los del entorno base, pero solo los reconocibles: palabras como 'enforce' o 'false' son
    // valores posibles que los propios mensajes nombran al explicar la regla.
    const reconocibles = Object.values(entornoCorrecto()).filter((valor) => valor.includes('inventad') || valor.includes('ejemplo.test'));
    expect(reconocibles.length).toBeGreaterThan(5);
    for (const valor of reconocibles) {
      expect(textos).not.toContain(valor);
    }
  });
});

describe('evaluarConfiguracion - entradas raras', () => {
  it.each([
    ['un entorno vacío', {}],
    ['undefined', undefined],
    ['null', null],
    ['un texto', 'cualquier cosa'],
    ['valores que no son texto', { JWT_SECRET: 12345, FRONTEND_URL: { url: 'x' }, MP_WEBHOOK_MODE: ['enforce'], DB_HOST: null }],
  ])('con %s no lanza excepción y devuelve listas', (_, entorno) => {
    for (const produccion of [true, false]) {
      let resultado;
      expect(() => { resultado = evaluarConfiguracion(entorno, { produccion }); }).not.toThrow();
      expect(Array.isArray(resultado.errores)).toBe(true);
      expect(Array.isArray(resultado.avisos)).toBe(true);
    }
  });

  it('un entorno vacío en producción informa todas las obligatorias', () => {
    const { errores } = enProduccion({});

    for (const nombre of [
      'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL', 'MERCADOPAGO_ACCESS_TOKEN',
      'MP_WEBHOOK_SECRET', 'MP_WEBHOOK_MODE',
      'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    ]) {
      expect(errores.some((error) => error.includes(nombre))).toBe(true);
    }
  });
});

describe('verificarConfiguracion', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvOriginal;
    vi.restoreAllMocks();
  });

  it('en los tests (NODE_ENV=test) no hace nada', () => {
    const espiaWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const espiaExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    verificarConfiguracion();

    expect(espiaWarn).not.toHaveBeenCalled();
    expect(espiaExit).not.toHaveBeenCalled();
  });

  it('en producción, con errores, los imprime y termina el proceso con código 1', () => {
    // En el entorno de los tests faltan casi todas las variables: en producción eso son errores.
    process.env.NODE_ENV = 'production';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const espiaError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const espiaExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    verificarConfiguracion();

    expect(espiaError).toHaveBeenCalled();
    expect(espiaExit).toHaveBeenCalledWith(1);
  });

  it('en desarrollo, con problemas, solo avisa y sigue', () => {
    process.env.NODE_ENV = 'development';
    const espiaWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const espiaError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const espiaExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    verificarConfiguracion();

    expect(espiaWarn).toHaveBeenCalled();
    expect(espiaError).not.toHaveBeenCalled();
    expect(espiaExit).not.toHaveBeenCalled();
  });
});
