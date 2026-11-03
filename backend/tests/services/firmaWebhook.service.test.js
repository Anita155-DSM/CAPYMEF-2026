import '../helpers/entorno.js';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verificarFirmaMercadoPago } from '../../services/firmaWebhook.service.js';

// Las firmas se calculan acá mismo, igual que lo haría Mercado Pago, con un secreto inventado.
// Así el test no depende de ningún dato real.
const SECRETO = 'secreto-falso-solo-para-tests';
const REQUEST_ID = 'b1d2c3e4-0000-4000-8000-000000000001';
const TS = '1730000000000';
const DATA_ID = '123456789';

const firmarComoMercadoPago = ({ dataId = DATA_ID, requestId = REQUEST_ID, ts = TS, secreto = SECRETO } = {}) =>
  crypto.createHmac('sha256', secreto).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');

const encabezado = (v1, ts = TS) => `ts=${ts},v1=${v1}`;

// Arma los datos de un aviso válido; cada test pisa solo lo que le importa.
const aviso = (datos = {}) => ({
  firma: encabezado(firmarComoMercadoPago()),
  requestId: REQUEST_ID,
  dataId: DATA_ID,
  secreto: SECRETO,
  ...datos,
});

describe('verificarFirmaMercadoPago', () => {
  it('acepta una firma válida', () => {
    expect(verificarFirmaMercadoPago(aviso())).toEqual({ valida: true, motivo: 'ok' });
  });

  it('acepta el encabezado con las partes en otro orden y con espacios', () => {
    const firma = ` v1=${firmarComoMercadoPago()} , ts=${TS} `;

    expect(verificarFirmaMercadoPago(aviso({ firma })).valida).toBe(true);
  });

  it('acepta un data.id numérico (como puede venir en el cuerpo JSON)', () => {
    expect(verificarFirmaMercadoPago(aviso({ dataId: 123456789 })).valida).toBe(true);
  });

  it('acepta la firma si Mercado Pago firmó el data.id en minúsculas', () => {
    // La documentación no aclara si el id se firma en minúsculas: si llega "ABC123" y la firma se
    // hizo con "abc123", el aviso igual es válido.
    const firma = encabezado(firmarComoMercadoPago({ dataId: 'abc123' }));

    expect(verificarFirmaMercadoPago(aviso({ dataId: 'ABC123', firma }))).toEqual({ valida: true, motivo: 'ok' });
  });

  it('acepta la firma hecha con el data.id tal cual llega, aunque tenga mayúsculas', () => {
    const firma = encabezado(firmarComoMercadoPago({ dataId: 'ABC123' }));

    expect(verificarFirmaMercadoPago(aviso({ dataId: 'ABC123', firma })).valida).toBe(true);
  });

  it.each([
    ['vacío', ''],
    ['con solo espacios', '   '],
    ['undefined', undefined],
    ['null', null],
  ])('rechaza con "sin_secreto" si el secreto está %s', (_, secreto) => {
    // Sin secreto no hay forma de verificar: nunca se da por válido.
    expect(verificarFirmaMercadoPago(aviso({ secreto }))).toEqual({ valida: false, motivo: 'sin_secreto' });
  });

  it.each([
    ['falta x-signature', { firma: undefined }],
    ['x-signature vacío', { firma: '' }],
    ['falta x-request-id', { requestId: undefined }],
    ['falta data.id', { dataId: undefined }],
    ['data.id null', { dataId: null }],
  ])('rechaza con "faltan_encabezados" si %s', (_, datos) => {
    expect(verificarFirmaMercadoPago(aviso(datos))).toEqual({ valida: false, motivo: 'faltan_encabezados' });
  });

  it.each([
    ['falta ts', `v1=${firmarComoMercadoPago()}`],
    ['falta v1', `ts=${TS}`],
    ['v1 vacío', `ts=${TS},v1=`],
    ['v1 no es hexadecimal', `ts=${TS},v1=${'z'.repeat(64)}`],
    ['v1 con largo impar', `ts=${TS},v1=abc`],
    ['texto sin el formato esperado', 'cualquier-cosa'],
  ])('rechaza con "formato_invalido" si %s', (_, firma) => {
    expect(verificarFirmaMercadoPago(aviso({ firma }))).toEqual({ valida: false, motivo: 'formato_invalido' });
  });

  it('rechaza una firma de distinto largo sin lanzar error', () => {
    // timingSafeEqual lanza error si los largos difieren: el servicio tiene que verificarlo antes.
    const corta = firmarComoMercadoPago().slice(0, 32);

    expect(verificarFirmaMercadoPago(aviso({ firma: encabezado(corta) }))).toEqual({ valida: false, motivo: 'firma_incorrecta' });
  });

  it('rechaza una firma incorrecta del mismo largo', () => {
    const otra = firmarComoMercadoPago({ secreto: 'otro-secreto' });

    expect(verificarFirmaMercadoPago(aviso({ firma: encabezado(otra) }))).toEqual({ valida: false, motivo: 'firma_incorrecta' });
  });

  it('rechaza una firma que difiere en un solo carácter', () => {
    const correcta = firmarComoMercadoPago();
    const alterada = correcta.slice(0, -1) + (correcta.endsWith('0') ? '1' : '0');

    expect(verificarFirmaMercadoPago(aviso({ firma: encabezado(alterada) })).motivo).toBe('firma_incorrecta');
  });

  it('rechaza si cambia el data.id (aviso firmado para otro pago)', () => {
    expect(verificarFirmaMercadoPago(aviso({ dataId: '999' })).motivo).toBe('firma_incorrecta');
  });

  it('rechaza si cambia el x-request-id', () => {
    expect(verificarFirmaMercadoPago(aviso({ requestId: 'otro-request-id' })).motivo).toBe('firma_incorrecta');
  });

  it('rechaza si cambia el ts del encabezado', () => {
    const firma = encabezado(firmarComoMercadoPago(), '1730000000001');

    expect(verificarFirmaMercadoPago(aviso({ firma })).motivo).toBe('firma_incorrecta');
  });

  it('rechaza una firma calculada sin el ";" final del texto', () => {
    // El texto exacto termina en ";": una firma hecha sin él no tiene que coincidir.
    const sinPuntoFinal = crypto
      .createHmac('sha256', SECRETO)
      .update(`id:${DATA_ID};request-id:${REQUEST_ID};ts:${TS}`)
      .digest('hex');

    expect(verificarFirmaMercadoPago(aviso({ firma: encabezado(sinPuntoFinal) })).motivo).toBe('firma_incorrecta');
  });

  it('acepta un aviso con un ts muy viejo si la firma es correcta (no hay límite de tiempo)', () => {
    // Mercado Pago reintenta durante días: un ts antiguo con firma correcta sigue siendo válido.
    const tsViejo = '1600000000000';
    const firma = encabezado(firmarComoMercadoPago({ ts: tsViejo }), tsViejo);

    expect(verificarFirmaMercadoPago(aviso({ firma })).valida).toBe(true);
  });

  it.each([
    ['sin argumentos', undefined],
    ['un objeto vacío', {}],
    ['null en todo', { firma: null, requestId: null, dataId: null, secreto: null }],
    ['números en todo', { firma: 1, requestId: 2, dataId: 3, secreto: 4 }],
    ['números con secreto válido', { firma: 1, requestId: 2, dataId: 3, secreto: SECRETO }],
    ['un array como data.id', { ...aviso(), dataId: ['1', '2'] }],
    ['un objeto como firma', { ...aviso(), firma: { ts: TS } }],
  ])('nunca lanza excepción con %s', (_, entrada) => {
    let resultado;
    expect(() => { resultado = verificarFirmaMercadoPago(entrada); }).not.toThrow();
    expect(resultado.valida).toBe(false);
    expect(typeof resultado.motivo).toBe('string');
  });

  it('si falla algo interno al calcular la firma, no lanza error y da el aviso por NO válido', () => {
    // Las entradas raras se frenan antes, así que para llegar al "catch" se simula una falla de crypto.
    // Lo importante: ante un error inesperado nunca se acepta el aviso.
    // El aviso se arma ANTES de simular la falla, porque armarlo también usa createHmac.
    const datos = aviso();
    vi.spyOn(crypto, 'createHmac').mockImplementation(() => {
      throw new Error('falla simulada');
    });

    let resultado;
    expect(() => { resultado = verificarFirmaMercadoPago(datos); }).not.toThrow();
    expect(resultado.valida).toBe(false);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
