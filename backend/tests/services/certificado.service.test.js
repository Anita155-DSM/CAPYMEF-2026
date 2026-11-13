import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { generarCertificadoAsistencia } from '../../services/certificado.service.js';
import { extraerTextoPdf, esPdf } from '../helpers/pdf.js';
import { crearHttpsFalso, crearDnsFalso, respuestaPng, imagenesEnPdf } from '../helpers/httpsFalso.js';

// Se genera el PDF de verdad y se lee el texto que quedó adentro. La única parte que saldría a internet
// (bajar los logos de entidades externas) usa https y DNS falsos (ver tests/helpers/httpsFalso.js). Las reglas
// de seguridad de la descarga tienen su propio archivo: tests/services/logosExternos.test.js.
// Un PNG real de 1x1 píxel, para que pdfkit lo pueda insertar.
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const zonaOriginal = process.env.TZ;
const socio = { razonSocial: 'Empresa Formoseña SRL' };
const evento = { titulo: 'Taller de exportación', fecha: '2026-12-10', modalidad: 'presencial', logosExternos: [] };

beforeAll(() => {
  // La fecha del evento es un día sin hora: en hora argentina es donde podía correrse al día anterior.
  process.env.TZ = 'America/Argentina/Buenos_Aires';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(() => {
  if (zonaOriginal === undefined) delete process.env.TZ;
  else process.env.TZ = zonaOriginal;
});

const respuestaImagen = (buffer) => ({ ok: true, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length) });

describe('generarCertificadoAsistencia: contenido', () => {
  it('genera un PDF', async () => {
    expect(esPdf(await generarCertificadoAsistencia({ socio, evento }))).toBe(true);
  });

  it('dice que es un certificado de asistencia de CAPYMEF', async () => {
    const texto = extraerTextoPdf(await generarCertificadoAsistencia({ socio, evento }));

    expect(texto).toContain('CAPYMEF');
    expect(texto).toContain('CERTIFICADO DE ASISTENCIA');
  });

  it('lleva el nombre del socio y el título del evento entre comillas', async () => {
    const texto = extraerTextoPdf(await generarCertificadoAsistencia({ socio, evento }));

    expect(texto).toContain('Empresa Formoseña SRL');
    expect(texto).toContain('"Taller de exportación"');
  });

  it('muestra la fecha del evento completa y sin correrla un día', async () => {
    const texto = extraerTextoPdf(await generarCertificadoAsistencia({ socio, evento }));

    expect(texto).toContain('realizada el 10 de diciembre de 2026, en modalidad presencial.');
  });

  it('indica la modalidad virtual cuando corresponde', async () => {
    const texto = extraerTextoPdf(await generarCertificadoAsistencia({ socio, evento: { ...evento, modalidad: 'virtual' } }));

    expect(texto).toContain('en modalidad virtual.');
  });

  it('tiene los espacios de firma del Presidente y del Secretario', async () => {
    const texto = extraerTextoPdf(await generarCertificadoAsistencia({ socio, evento }));

    expect(texto).toContain('Presidente');
    expect(texto).toContain('Secretario');
  });
});

describe('generarCertificadoAsistencia: logos externos', () => {
  it('sin logos no descarga nada', async () => {
    const https = crearHttpsFalso();

    await generarCertificadoAsistencia({ socio, evento }, { requestFn: https.request, lookupFn: crearDnsFalso().lookup });

    expect(https.pedidos).toHaveLength(0);
  });

  it('descarga cada logo y lo inserta en el PDF', async () => {
    const urls = ['https://logos.test/gobierno.png', 'https://logos.test/sponsor.png'];
    const https = crearHttpsFalso(Object.fromEntries(urls.map((url) => [url, respuestaPng()])));

    const conLogos = await generarCertificadoAsistencia({ socio, evento: { ...evento, logosExternos: urls } }, { requestFn: https.request, lookupFn: crearDnsFalso().lookup });

    expect(https.pedidos.map((p) => p.url)).toEqual(urls);
    expect(imagenesEnPdf(conLogos)).toBe(2);
    expect(imagenesEnPdf(await generarCertificadoAsistencia({ socio, evento }))).toBe(0);
  });

  it('un logo que no se puede descargar (error de conexión o respuesta no OK) se saltea sin romper el certificado', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const https = crearHttpsFalso({ 'https://a.test/2.png': { status: 500, headers: {} } });
    const dnsQueFalla = (hostname, opciones, callback) => setImmediate(() =>
      hostname === 'a.test' ? callback(null, [{ address: '93.184.216.34', family: 4 }]) : callback(Object.assign(new Error('sin conexión'), { code: 'ENOTFOUND' })));

    const pdf = await generarCertificadoAsistencia(
      { socio, evento: { ...evento, logosExternos: ['https://no-existe.test/1.png', 'https://a.test/2.png'] } },
      { requestFn: https.request, lookupFn: dnsQueFalla }
    );

    expect(esPdf(pdf)).toBe(true);
    expect(imagenesEnPdf(pdf)).toBe(0);
  });

  it('una imagen que pasa los controles pero pdfkit no puede leer se saltea sin romper el certificado', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Empieza con la firma PNG pero el resto está roto: llega a pdfkit, que no la puede insertar.
    const rota = Buffer.concat([PNG_1x1.subarray(0, 8), Buffer.from('esto no es el resto de un png')]);
    const https = crearHttpsFalso({ 'https://a.test/roto.png': respuestaPng(rota) });

    const pdf = await generarCertificadoAsistencia(
      { socio, evento: { ...evento, logosExternos: ['https://a.test/roto.png'] } },
      { requestFn: https.request, lookupFn: crearDnsFalso().lookup }
    );

    expect(esPdf(pdf)).toBe(true);
    expect(errorLog).toHaveBeenCalledWith('Error al insertar un logo en el certificado:', expect.any(String));
  });
});
