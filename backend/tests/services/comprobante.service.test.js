import '../helpers/entorno.js';
import zlib from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generarComprobantePago } from '../../services/comprobante.service.js';

// El PDF se genera con la máquina en hora argentina: ahí era donde la fecha de pago salía un día antes.
// Así el test detecta ese error aunque se corra en un servidor en UTC.
const zonaOriginal = process.env.TZ;

// Se genera el PDF de verdad y se lee el texto que quedó adentro (no solo lo que se le pidió a pdfkit).
// pdfkit comprime cada página con zlib y escribe el texto en hexadecimal dentro de operadores TJ:
// [<4361...> 30 <6d...>] TJ. Alcanza con descomprimir y decodificar, sin librerías nuevas.
const extraerTexto = (pdf) => {
  const binario = pdf.toString('latin1');
  const lineas = [];
  for (const stream of binario.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let contenido;
    try {
      contenido = zlib.inflateSync(Buffer.from(stream[1], 'latin1')).toString('latin1');
    } catch {
      continue; // no es un stream comprimido de texto (por ejemplo, una fuente)
    }
    for (const tj of contenido.matchAll(/\[(.*?)\]\s*TJ/g)) {
      lineas.push([...tj[1].matchAll(/<([0-9a-fA-F]*)>/g)].map((h) => Buffer.from(h[1], 'hex').toString('latin1')).join(''));
    }
  }
  // Una frase larga puede quedar partida en dos renglones: se une todo con espacios.
  return lineas.join(' ').replace(/\s+/g, ' ');
};

let pdf;
let texto;

beforeAll(async () => {
  process.env.TZ = 'America/Argentina/Buenos_Aires';
  pdf = await generarComprobantePago({
    socio: { razonSocial: 'Empresa de prueba', cuit: '20-00000001-1' },
    cuota: { mes_anio: '2026-11' },
    pago: { id: 'pago-123', fechaPago: '2026-11-05', montoAbonado: 10000, metodoPago: 'Efectivo', observaciones: 'Pagó en la sede' },
  });
  texto = extraerTexto(pdf);
});

afterAll(() => {
  if (zonaOriginal === undefined) delete process.env.TZ;
  else process.env.TZ = zonaOriginal;
});

describe('generarComprobantePago', () => {
  it('genera un PDF', () => {
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('se presenta como "Constancia de Pago" con "Constancia N°"', () => {
    expect(texto).toContain('Constancia de Pago');
    expect(texto).toContain('Constancia N°: pago-123');
  });

  it('lleva la leyenda de que no es válido como factura', () => {
    // La Cámara factura por ARCA: el PDF no puede pasar por factura.
    expect(texto).toContain('Documento no válido como factura.');
    expect(texto).toContain('La factura correspondiente es emitida por la Cámara a través de ARCA.');
  });

  it('muestra la fecha de pago correcta: "2026-11-05" → "5/11/2026" (no el día anterior)', () => {
    expect(texto).toContain('Fecha de pago: 5/11/2026');
  });

  it('el pie dice cuándo se generó, en hora argentina de 24 horas', () => {
    expect(texto).toMatch(/generado automáticamente por el sistema de CAPYMEF el \d{1,2}\/\d{1,2}\/\d{4}, \d{2}:\d{2}\./);
  });

  it('no dice "recibo" en ningún lado', () => {
    expect(texto).not.toMatch(/recibo/i);
  });

  it('mantiene los datos del socio y del pago', () => {
    expect(texto).toContain('Razón Social: Empresa de prueba');
    expect(texto).toContain('CUIT: 20-00000001-1');
    expect(texto).toContain('Período de la cuota: 2026-11');
    expect(texto).toContain('Monto abonado: $10.000,00');
    expect(texto).toContain('Método de pago: Efectivo');
    expect(texto).toContain('Observaciones: Pagó en la sede');
  });
});
