import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import { aCentavos, validarPagoContraCuota } from '../../services/validarPagoMP.service.js';

// Una cuota de $10.000 (DECIMAL: Sequelize la devuelve como texto) y un pago legítimo para ella.
const CUOTA = { id: 'cuota-1', monto: '10000.00' };
const pagoValido = (cambios = {}) => ({ estado: 'approved', moneda: 'ARS', montoPagado: 10000, cuotaId: 'cuota-1', ...cambios });

describe('validarPagoContraCuota', () => {
  it('un pago aprobado, en pesos, por el monto exacto y con la referencia de la cuota es válido', () => {
    expect(validarPagoContraCuota(pagoValido(), CUOTA)).toEqual({ valido: true, motivos: [] });
  });

  it('$1 contra una cuota de $10.000 es inválido', () => {
    const resultado = validarPagoContraCuota(pagoValido({ montoPagado: 1 }), CUOTA);

    expect(resultado.valido).toBe(false);
    expect(resultado.motivos).toEqual(['el monto no coincide con el de la cuota']);
  });

  it('$9.999,99 contra $10.000 es inválido (falta un centavo)', () => {
    expect(validarPagoContraCuota(pagoValido({ montoPagado: 9999.99 }), CUOTA).valido).toBe(false);
  });

  it('pagar de más también es inválido (hay que revisarlo a mano)', () => {
    expect(validarPagoContraCuota(pagoValido({ montoPagado: 10000.01 }), CUOTA).valido).toBe(false);
  });

  it('el monto de la cuota como texto "10000.00" contra 10000 es válido', () => {
    expect(validarPagoContraCuota(pagoValido({ montoPagado: 10000 }), { id: 'cuota-1', monto: '10000.00' }).valido).toBe(true);
  });

  it('compara en centavos: 10.1 * 3 (30.299999999999997) contra "30.30" es válido', () => {
    // Con números con decimales directos estos dos montos "no serían iguales" y se rechazaría un pago correcto.
    expect(validarPagoContraCuota(pagoValido({ montoPagado: 10.1 * 3 }), { id: 'cuota-1', monto: '30.30' }).valido).toBe(true);
  });

  it('un pago en dólares es inválido', () => {
    const resultado = validarPagoContraCuota(pagoValido({ moneda: 'USD' }), CUOTA);

    expect(resultado.valido).toBe(false);
    expect(resultado.motivos).toEqual(['la moneda no es pesos (USD)']);
  });

  it('un pago sin moneda es inválido', () => {
    expect(validarPagoContraCuota(pagoValido({ moneda: undefined }), CUOTA).valido).toBe(false);
  });

  it('la referencia de otra cuota es inválida', () => {
    const resultado = validarPagoContraCuota(pagoValido({ cuotaId: 'otra-cuota' }), CUOTA);

    expect(resultado.valido).toBe(false);
    expect(resultado.motivos).toEqual(['la referencia no corresponde a esta cuota']);
  });

  it.each(['pending', 'rejected', 'in_process', undefined])('un pago con estado %s es inválido', (estado) => {
    expect(validarPagoContraCuota(pagoValido({ estado }), CUOTA).valido).toBe(false);
  });

  it('informa todos los motivos a la vez', () => {
    const resultado = validarPagoContraCuota({ estado: 'rejected', moneda: 'USD', montoPagado: 1, cuotaId: 'otra' }, CUOTA);

    expect(resultado.motivos).toHaveLength(4);
  });

  it.each([
    ['sin pago', undefined, CUOTA],
    ['sin cuota', pagoValido(), undefined],
    ['monto del pago vacío', pagoValido({ montoPagado: null }), CUOTA],
    ['monto de la cuota inválido', pagoValido(), { id: 'cuota-1', monto: 'abc' }],
  ])('%s: inválido, sin lanzar error', (_, pago, cuota) => {
    let resultado;
    expect(() => { resultado = validarPagoContraCuota(pago, cuota); }).not.toThrow();
    expect(resultado.valido).toBe(false);
  });
});

describe('aCentavos', () => {
  it.each([
    [10000, 1000000],
    ['10000.00', 1000000],
    [9999.99, 999999],
    [10.1 * 3, 3030],
    [0.1 + 0.2, 30],
    [null, null],
    ['', null],
    ['abc', null],
    [Infinity, null],
  ])('aCentavos(%s) = %s', (valor, esperado) => {
    expect(aCentavos(valor)).toBe(esperado);
  });
});
