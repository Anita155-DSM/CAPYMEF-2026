import '../helpers/entorno.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatearFechaArgentina, formatearFechaHoraArgentina, SIN_FECHA } from '../../utils/fechas.js';

// El bug dependía de la zona horaria de la MÁQUINA. Para que los tests lo detecten en cualquier lado
// (también en un servidor en UTC), cada bloque fija la zona horaria del proceso (Node la relee al
// cambiar process.env.TZ) y al final se restaura.
const zonaOriginal = process.env.TZ;
const conZonaHoraria = (zona) => {
  beforeAll(() => { process.env.TZ = zona; });
  afterAll(() => {
    if (zonaOriginal === undefined) delete process.env.TZ;
    else process.env.TZ = zonaOriginal;
  });
};

describe('formatearFechaArgentina - fecha sin hora ("YYYY-MM-DD")', () => {
  // En hora argentina era donde new Date('2026-11-05') daba el día anterior.
  conZonaHoraria('America/Argentina/Buenos_Aires');

  it('"2026-11-05" → "5/11/2026" (no el día anterior)', () => {
    expect(formatearFechaArgentina('2026-11-05')).toBe('5/11/2026');
  });

  it('acepta las opciones de Intl (formato largo del certificado)', () => {
    expect(formatearFechaArgentina('2026-11-20', { day: 'numeric', month: 'long', year: 'numeric' })).toBe('20 de noviembre de 2026');
  });

  it('el primero de enero no se va al año anterior', () => {
    expect(formatearFechaArgentina('2027-01-01')).toBe('1/1/2027');
  });
});

describe('formatearFechaArgentina - momento con hora', () => {
  // Una zona horaria bien distinta de la argentina: si el formato no fija la zona argentina, el día cambia.
  conZonaHoraria('Asia/Tokyo');

  it('2026-11-05T02:00:00Z → "4/11/2026" (en Argentina todavía son las 23 del 4)', () => {
    expect(formatearFechaArgentina(new Date('2026-11-05T02:00:00Z'))).toBe('4/11/2026');
  });

  it('2026-11-05T15:00:00Z → "5/11/2026" (en Tokio ya sería el 6)', () => {
    expect(formatearFechaArgentina(new Date('2026-11-05T15:00:00Z'))).toBe('5/11/2026');
  });

  it('acepta también el texto ISO y un número (milisegundos)', () => {
    expect(formatearFechaArgentina('2026-11-05T02:00:00Z')).toBe('4/11/2026');
    expect(formatearFechaArgentina(Date.parse('2026-11-05T02:00:00Z'))).toBe('4/11/2026');
  });

  it('una fecha sin hora sigue siendo ese día aunque el servidor esté en otra zona', () => {
    expect(formatearFechaArgentina('2026-11-05')).toBe('5/11/2026');
  });

  it('formatearFechaHoraArgentina muestra hora argentina en formato de 24 horas', () => {
    expect(formatearFechaHoraArgentina(new Date('2026-11-05T02:00:00Z'))).toBe('4/11/2026, 23:00');
    expect(formatearFechaHoraArgentina(new Date('2026-11-05T15:30:00Z'))).toBe('5/11/2026, 12:30');
  });
});

describe('valores vacíos o inválidos', () => {
  // Decisión: nunca rompe ni muestra "Invalid Date"; devuelve "-" (igual que el frontend).
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['texto vacío', ''],
    ['texto cualquiera', 'mañana'],
    ['una fecha que no existe', '2026-02-30'],
    ['un mes que no existe', '2026-13-01'],
    ['NaN', NaN],
    ['un Date inválido', new Date('nada')],
  ])('formatearFechaArgentina con %s devuelve "-"', (_, valor) => {
    expect(formatearFechaArgentina(valor)).toBe(SIN_FECHA);
  });

  it.each([null, undefined, 'nada', new Date('nada')])('formatearFechaHoraArgentina(%s) devuelve "-"', (valor) => {
    expect(formatearFechaHoraArgentina(valor)).toBe(SIN_FECHA);
  });
});
