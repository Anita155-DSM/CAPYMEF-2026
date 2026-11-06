import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { generarCertificadoAsistencia } from '../../services/certificado.service.js';
import { extraerTextoPdf, esPdf } from '../helpers/pdf.js';

// Se genera el PDF de verdad y se lee el texto que quedó adentro. La única parte que saldría a internet
// (bajar los logos de entidades externas) usa un fetch falso.
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
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);

    await generarCertificadoAsistencia({ socio, evento });

    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('descarga cada logo y lo inserta en el PDF', async () => {
    const fetchFalso = vi.fn(async () => respuestaImagen(PNG_1x1));
    vi.stubGlobal('fetch', fetchFalso);
    const urls = ['https://logos.test/gobierno.png', 'https://logos.test/sponsor.png'];

    const sinLogos = await generarCertificadoAsistencia({ socio, evento });
    const conLogos = await generarCertificadoAsistencia({ socio, evento: { ...evento, logosExternos: urls } });

    expect(fetchFalso.mock.calls.map(([url]) => url)).toEqual(urls);
    // Las imágenes quedan como objetos /XObject dentro del PDF.
    expect(conLogos.toString('latin1')).toContain('/Subtype /Image');
    expect(sinLogos.toString('latin1')).not.toContain('/Subtype /Image');
  });

  it('un logo que no se puede descargar (error de red o respuesta no OK) se saltea sin romper el certificado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new Error('sin conexión'))
      .mockResolvedValueOnce({ ok: false }));

    const pdf = await generarCertificadoAsistencia({ socio, evento: { ...evento, logosExternos: ['https://a.test/1.png', 'https://a.test/2.png'] } });

    expect(esPdf(pdf)).toBe(true);
    expect(pdf.toString('latin1')).not.toContain('/Subtype /Image');
  });

  it('un archivo descargado que no es una imagen válida se saltea sin romper el certificado', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => respuestaImagen(Buffer.from('esto no es una imagen'))));

    const pdf = await generarCertificadoAsistencia({ socio, evento: { ...evento, logosExternos: ['https://a.test/roto.png'] } });

    expect(esPdf(pdf)).toBe(true);
    expect(errorLog).toHaveBeenCalledWith('Error al insertar un logo en el certificado:', expect.any(String));
  });
});
