import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import { armarDominiosPermitidos } from '../../config/cors.js';

// Direcciones inventadas: ninguna es real.
const FRONT_PUBLICO = 'https://capymef.ejemplo.test';
const FRONT_LOCAL = 'http://localhost:5173';

describe('armarDominiosPermitidos - desarrollo', () => {
  it('con FRONTEND_URL incluye su origen y además el frontend local', () => {
    const dominios = armarDominiosPermitidos({ frontendUrl: FRONT_PUBLICO, produccion: false });

    expect(dominios).toEqual(expect.arrayContaining([FRONT_PUBLICO, FRONT_LOCAL]));
    expect(dominios).toHaveLength(2);
  });

  it('sin FRONTEND_URL incluye solo el frontend local (como antes)', () => {
    expect(armarDominiosPermitidos({ produccion: false })).toEqual([FRONT_LOCAL]);
  });

  it('con FRONTEND_URL igual al frontend local no lo repite', () => {
    expect(armarDominiosPermitidos({ frontendUrl: `${FRONT_LOCAL}/`, produccion: false })).toEqual([FRONT_LOCAL]);
  });

  it('sin el parámetro produccion se toma como desarrollo', () => {
    expect(armarDominiosPermitidos({})).toEqual([FRONT_LOCAL]);
  });
});

describe('armarDominiosPermitidos - producción', () => {
  it('con FRONTEND_URL https incluye solo ese origen (nada de localhost)', () => {
    expect(armarDominiosPermitidos({ frontendUrl: FRONT_PUBLICO, produccion: true })).toEqual([FRONT_PUBLICO]);
  });

  it('quita la barra final', () => {
    expect(armarDominiosPermitidos({ frontendUrl: `${FRONT_PUBLICO}/`, produccion: true })).toEqual([FRONT_PUBLICO]);
  });

  it('descarta la ruta y deja solo el origen (como lo manda el navegador)', () => {
    expect(armarDominiosPermitidos({ frontendUrl: `${FRONT_PUBLICO}/socios/pagos?x=1#arriba`, produccion: true })).toEqual([FRONT_PUBLICO]);
  });

  it('conserva un puerto que no es el estándar', () => {
    expect(armarDominiosPermitidos({ frontendUrl: 'https://capymef.ejemplo.test:8443/', produccion: true }))
      .toEqual(['https://capymef.ejemplo.test:8443']);
  });

  it('tolera espacios alrededor del valor', () => {
    expect(armarDominiosPermitidos({ frontendUrl: `  ${FRONT_PUBLICO}  `, produccion: true })).toEqual([FRONT_PUBLICO]);
  });

  it.each([
    'http://localhost:5173',
    'http://localhost',
    'https://localhost:3000/',
    'http://127.0.0.1:5173',
    'http://[::1]:5173',
  ])('con FRONTEND_URL local (%s) NO incluye localhost: la lista queda vacía', (frontendUrl) => {
    const dominios = armarDominiosPermitidos({ frontendUrl, produccion: true });

    expect(dominios).toEqual([]);
    expect(dominios.some((d) => d.includes('localhost') || d.includes('127.0.0.1'))).toBe(false);
  });

  it('sin FRONTEND_URL la lista queda vacía (solo pasan las peticiones sin origen)', () => {
    expect(armarDominiosPermitidos({ produccion: true })).toEqual([]);
  });
});

describe('armarDominiosPermitidos - entradas inválidas', () => {
  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['texto que no es URL', 'capymef.ejemplo.test'],
    ['otro esquema', 'ftp://capymef.ejemplo.test'],
    ['javascript:', 'javascript:alert(1)'],
    ['null', null],
    ['un número', 12345],
    ['un objeto', { url: FRONT_PUBLICO }],
    ['un array', [FRONT_PUBLICO]],
  ])('FRONTEND_URL %s: se ignora sin lanzar excepción', (_, frontendUrl) => {
    for (const produccion of [true, false]) {
      let dominios;
      expect(() => { dominios = armarDominiosPermitidos({ frontendUrl, produccion }); }).not.toThrow();
      expect(dominios).toEqual(produccion ? [] : [FRONT_LOCAL]);
    }
  });

  it.each([['undefined', undefined], ['null', null], ['un texto', 'cualquier cosa']])('con argumentos %s no lanza excepción y se toma como desarrollo', (_, entrada) => {
    let dominios;
    expect(() => { dominios = armarDominiosPermitidos(entrada); }).not.toThrow();
    expect(dominios).toEqual([FRONT_LOCAL]);
  });
});
