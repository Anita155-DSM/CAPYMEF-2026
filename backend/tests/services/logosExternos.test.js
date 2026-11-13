import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  motivoUrlDeLogoInvalida,
  esIpPublica,
  crearLookupSeguro,
  MAXIMO_LOGOS_EXTERNOS,
  LARGO_MAXIMO_URL_LOGO,
} from '../../services/urlSegura.service.js';
import { descargarLogoExterno, generarCertificadoAsistencia, TAMANO_MAXIMO_LOGO_BYTES } from '../../services/certificado.service.js';
import { validacionEvento, validacionActualizarEvento } from '../../middlewares/validator/evento.validator.js';
import { crearHttpsFalso, crearDnsFalso, respuestaPng, imagenesEnPdf, PNG_1x1 } from '../helpers/httpsFalso.js';
import { esPdf } from '../helpers/pdf.js';

// Logos externos de los certificados: el servidor los descarga, así que no puede pedir direcciones internas
// (SSRF). Se prueban las reglas al cargar el evento (validador) y al descargar (certificado). Nada sale a
// internet: https y DNS son falsos (tests/helpers/httpsFalso.js).

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const URL_LOGO = 'https://logos.test/gobierno.png';
const socio = { razonSocial: 'Empresa Formoseña SRL' };
const evento = (logosExternos) => ({ titulo: 'Taller de exportación', fecha: '2026-12-10', modalidad: 'presencial', logosExternos });

// ==========================================
// Reglas de la URL (funciones puras)
// ==========================================
describe('motivoUrlDeLogoInvalida', () => {
  it.each(['https://logos.test/gobierno.png', 'https://www.formosa.gob.ar/img/escudo.jpg?v=2', 'https://cdn.ejemplo.com:443/logo.png'])(
    '%s es aceptable',
    (url) => {
      expect(motivoUrlDeLogoInvalida(url)).toBeNull();
    }
  );

  it.each([
    ['http (no https)', 'http://logos.test/a.png', 'tiene que empezar con https://'],
    ['otro protocolo', 'ftp://logos.test/a.png', 'tiene que empezar con https://'],
    ['con usuario y contraseña', 'https://usuario:clave@logos.test/a.png', 'no puede incluir usuario ni contraseña'],
    ['solo con usuario', 'https://usuario@logos.test/a.png', 'no puede incluir usuario ni contraseña'],
    ['con puerto 8080', 'https://logos.test:8080/a.png', 'no puede usar un puerto distinto del 443'],
    ['con una IPv4 literal', 'https://10.0.0.5/a.png', 'tiene que ser un dominio público, no una dirección IP'],
    ['con la IP del servicio de metadatos', 'https://169.254.169.254/latest/meta-data', 'tiene que ser un dominio público, no una dirección IP'],
    ['con una IP escrita en decimal', 'https://2130706433/a.png', 'tiene que ser un dominio público, no una dirección IP'],
    ['con una IP escrita en hexadecimal', 'https://0x7f.1/a.png', 'tiene que ser un dominio público, no una dirección IP'],
    ['con una IPv6 literal', 'https://[::1]/a.png', 'tiene que ser un dominio público, no una dirección IP'],
    ['localhost', 'https://localhost/a.png', 'tiene que ser un dominio público, no localhost'],
    ['localhost con punto final', 'https://localhost./a.png', 'tiene que ser un dominio público, no localhost'],
    ['un subdominio de localhost', 'https://algo.localhost/a.png', 'tiene que ser un dominio público, no localhost'],
    ['un nombre interno sin punto', 'https://intranet/a.png', 'tiene que ser un dominio público'],
    ['demasiado larga', `https://logos.test/${'a'.repeat(LARGO_MAXIMO_URL_LOGO)}.png`, `supera los ${LARGO_MAXIMO_URL_LOGO} caracteres`],
    ['que no es un link', 'no es un link', 'no es un link válido'],
    ['que no es texto', 123, 'no es un link válido'],
  ])('una URL %s se rechaza', (_, url, motivo) => {
    expect(motivoUrlDeLogoInvalida(url)).toBe(motivo);
  });

  it('el máximo de logos es 5 y el largo máximo 255 (el de la columna)', () => {
    expect(MAXIMO_LOGOS_EXTERNOS).toBe(5);
    expect(LARGO_MAXIMO_URL_LOGO).toBe(255);
  });
});

describe('esIpPublica', () => {
  it.each([
    '127.0.0.1', '127.8.8.8', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0',
    '100.64.0.1', '224.0.0.1', '255.255.255.255', '192.0.2.10', '::1', '::', '::ffff:127.0.0.1', '::ffff:7f00:1',
    '::ffff:8.8.8.8', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'fe80::1%eth0', 'ff02::1', '2001:db8::1', '64:ff9b::a00:1',
  ])('%s NO es pública', (ip) => {
    expect(esIpPublica(ip)).toBe(false);
  });

  it.each(['8.8.8.8', '93.184.216.34', '172.32.0.1', '200.45.12.1', '2606:4700::1111', '2800:810::1'])('%s es pública', (ip) => {
    expect(esIpPublica(ip)).toBe(true);
  });

  it.each(['', 'nada', '999.1.1.1', null, undefined])('lo que no es una IP (%j) no cuenta como pública', (valor) => {
    expect(esIpPublica(valor)).toBe(false);
  });
});

describe('crearLookupSeguro', () => {
  const resolver = (direcciones, opciones = {}) =>
    new Promise((resolve) => {
      const lookupSeguro = crearLookupSeguro(crearDnsFalso({ 'host.test': direcciones }).lookup);
      lookupSeguro('host.test', opciones, (error, ...resto) => resolve({ error, resto }));
    });

  it('con direcciones públicas responde como dns.lookup (una dirección, o todas si se piden)', async () => {
    expect((await resolver(['93.184.216.34'])).resto).toEqual(['93.184.216.34', 4]);
    expect((await resolver(['93.184.216.34', '2606:4700::1111'], { all: true })).resto[0]).toHaveLength(2);
  });

  it('si UNA de las direcciones no es pública, rechaza la conexión', async () => {
    const { error } = await resolver(['93.184.216.34', '10.0.0.5'], { all: true });

    expect(error.code).toBe('EDIRECCIONNOPUBLICA');
  });

  it('si el DNS falla, pasa el error tal cual', async () => {
    const lookupQueFalla = (host, opciones, cb) => cb(Object.assign(new Error('no existe'), { code: 'ENOTFOUND' }));

    const error = await new Promise((resolve) => crearLookupSeguro(lookupQueFalla)('x.test', {}, resolve));

    expect(error.code).toBe('ENOTFOUND');
  });
});

// ==========================================
// Validador al cargar o editar un evento
// ==========================================
describe('validador de eventos: logos externos', () => {
  const app = express();
  app.use(express.json());
  app.post('/evento', validacionEvento, (req, res) => res.json({ ok: true }));
  app.put('/evento', validacionActualizarEvento, (req, res) => res.json({ ok: true }));
  const eventoValido = { titulo: 'Capacitación en exportación', descripcion: 'Descripción', fecha: '2026-12-10' };
  const crear = (logos) => request(app).post('/evento').send({ ...eventoValido, logosExternos: JSON.stringify(logos) });

  it('con URLs https válidas responde OK', async () => {
    expect((await crear([URL_LOGO, 'https://sponsor.test/logo.jpg'])).status).toBe(200);
  });

  it(`acepta hasta ${MAXIMO_LOGOS_EXTERNOS} logos`, async () => {
    expect((await crear(Array.from({ length: 5 }, (_, i) => `https://logos.test/${i}.png`))).status).toBe(200);
  });

  it.each([
    ['http', ['http://logos.test/a.png'], 'El logo 1 no es válido: tiene que empezar con https://.'],
    ['una IP literal', [URL_LOGO, 'https://192.168.1.1/a.png'], 'El logo 2 no es válido: tiene que ser un dominio público, no una dirección IP.'],
    ['localhost', ['https://localhost/a.png'], 'El logo 1 no es válido: tiene que ser un dominio público, no localhost.'],
    ['usuario:clave', ['https://usuario:clave@logos.test/a.png'], 'El logo 1 no es válido: no puede incluir usuario ni contraseña.'],
    ['puerto 8080', ['https://logos.test:8080/a.png'], 'El logo 1 no es válido: no puede usar un puerto distinto del 443.'],
    ['más logos que el máximo', Array.from({ length: 6 }, (_, i) => `https://logos.test/${i}.png`), 'Podés cargar como máximo 5 logos externos.'],
    ['una URL demasiado larga', [`https://logos.test/${'a'.repeat(300)}.png`], 'El logo 1 no es válido: supera los 255 caracteres.'],
  ])('con %s responde 400 con un mensaje claro', async (_, logos, mensaje) => {
    const respuesta = await crear(logos);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'logosExternos', mensaje }]);
  });

  it('la edición del evento aplica las mismas reglas', async () => {
    const respuesta = await request(app).put('/evento').send({ logosExternos: JSON.stringify(['http://logos.test/a.png']) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0].mensaje).toBe('El logo 1 no es válido: tiene que empezar con https://.');
  });

  it('también acepta el array directo (pedido JSON, no multipart)', async () => {
    expect((await request(app).post('/evento').send({ ...eventoValido, logosExternos: [URL_LOGO] })).status).toBe(200);
  });
});

// ==========================================
// Descarga al generar el certificado
// ==========================================
describe('descargarLogoExterno: el DNS tiene que apuntar a una IP pública', () => {
  it.each(['127.0.0.1', '10.0.0.5', '192.168.1.1', '169.254.169.254', '::1', '::ffff:127.0.0.1'])(
    'un dominio que resuelve a %s no se descarga y el certificado se genera sin ese logo',
    async (ip) => {
      const https = crearHttpsFalso({ [URL_LOGO]: respuestaPng() });
      const dns = crearDnsFalso({ 'logos.test': [ip] });

      const pdf = await generarCertificadoAsistencia({ socio, evento: evento([URL_LOGO]) }, { requestFn: https.request, lookupFn: dns.lookup });

      expect(esPdf(pdf)).toBe(true);
      expect(imagenesEnPdf(pdf)).toBe(0);
      expect(https.pedidos[0].respondio).toBe(false); // la conexión no llegó a hacerse
      expect(console.warn).toHaveBeenCalledWith('Logo externo descartado (logos.test): el dominio apunta a una dirección que no es pública.');
    }
  );

  it('si el dominio resuelve a una IP pública y a una privada a la vez, tampoco se descarga', async () => {
    const https = crearHttpsFalso({ [URL_LOGO]: respuestaPng() });

    expect(await descargarLogoExterno(URL_LOGO, { requestFn: https.request, lookupFn: crearDnsFalso({ 'logos.test': ['93.184.216.34', '10.0.0.5'] }).lookup })).toBeNull();
  });

  it('un logo viejo guardado con una URL que hoy no pasa el validador (http) no se descarga', async () => {
    const https = crearHttpsFalso();

    expect(await descargarLogoExterno('http://logos.test/a.png', { requestFn: https.request, lookupFn: crearDnsFalso().lookup })).toBeNull();
    expect(https.pedidos).toHaveLength(0);
  });
});

describe('descargarLogoExterno: lo que se descarga', () => {
  const descargar = (respuesta, opciones = {}) => {
    const https = crearHttpsFalso({ [URL_LOGO]: respuesta });
    return { https, resultado: descargarLogoExterno(URL_LOGO, { requestFn: https.request, lookupFn: crearDnsFalso().lookup, ...opciones }) };
  };

  it('un PNG válido se descarga', async () => {
    const { resultado } = descargar(respuestaPng());

    expect((await resultado).equals(PNG_1x1)).toBe(true);
  });

  it('un JPEG (content-type y primeros bytes de JPEG) se acepta', async () => {
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('resto del jpeg')]);
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'image/jpeg' }, body: jpeg });

    expect((await resultado).equals(jpeg)).toBe(true);
  });

  it('acepta el content-type con parámetros ("image/png; charset=binary")', async () => {
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'image/png; charset=binary' }, body: PNG_1x1 });

    expect(await resultado).not.toBeNull();
  });

  it('una redirección no se sigue: se hace un solo pedido y el logo se descarta', async () => {
    const https = crearHttpsFalso({
      [URL_LOGO]: { status: 302, headers: { location: 'https://otro.test/logo.png' } },
      'https://otro.test/logo.png': respuestaPng(),
    });

    const resultado = await descargarLogoExterno(URL_LOGO, { requestFn: https.request, lookupFn: crearDnsFalso().lookup });

    expect(resultado).toBeNull();
    expect(https.pedidos.map((p) => p.url)).toEqual([URL_LOGO]);
    expect(console.warn).toHaveBeenCalledWith('Logo externo descartado (logos.test): respondió con una redirección (no se sigue).');
  });

  it('un content-type text/html se descarta', async () => {
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'text/html' }, body: Buffer.from('<html></html>') });

    expect(await resultado).toBeNull();
  });

  it('un archivo que dice ser PNG pero no empieza con la firma PNG se descarta', async () => {
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'image/png' }, body: Buffer.from('<?php echo "no soy un png"; ?>') });

    expect(await resultado).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Logo externo descartado (logos.test): el contenido no es la imagen que dice ser.');
  });

  it('un PNG que se declara como JPEG también se descarta (el tipo y la firma tienen que coincidir)', async () => {
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'image/jpeg' }, body: PNG_1x1 });

    expect(await resultado).toBeNull();
  });

  it(`más grande que el máximo (${TAMANO_MAXIMO_LOGO_BYTES} bytes) y avisado en content-length: se descarta sin descargarlo`, async () => {
    const { resultado } = descargar({ status: 200, headers: { 'content-type': 'image/png', 'content-length': String(TAMANO_MAXIMO_LOGO_BYTES + 1) }, body: PNG_1x1 });

    expect(await resultado).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Logo externo descartado (logos.test): supera el tamaño máximo.');
  });

  it('más grande que el máximo sin avisarlo: se corta la descarga apenas se pasa', async () => {
    const parte = Buffer.alloc(512 * 1024);
    const partes = [PNG_1x1.subarray(0, 8), ...Array.from({ length: 5 }, () => parte)]; // ~2,5 MB
    const { https, resultado } = descargar({ status: 200, headers: { 'content-type': 'image/png' }, partes });

    expect(await resultado).toBeNull();
    expect(https.pedidos[0].destruido).toBe(true);
  });

  it('un servidor que no responde se descarta al pasar el tiempo máximo', async () => {
    const { https, resultado } = descargar({ nuncaResponde: true }, { tiempoMaximoMs: 30 });

    expect(await resultado).toBeNull();
    expect(https.pedidos[0].destruido).toBe(true);
    expect(console.warn).toHaveBeenCalledWith('Logo externo descartado (logos.test): tardó demasiado.');
  });

  it('una respuesta de error (404) se descarta', async () => {
    const { resultado } = descargar({ status: 404, headers: {} });

    expect(await resultado).toBeNull();
  });

  it('el aviso del log no incluye la ruta ni los parámetros de la URL (pueden traer un token)', async () => {
    const https = crearHttpsFalso();

    await descargarLogoExterno('https://logos.test/privado/logo.png?token=secreto123', { requestFn: https.request, lookupFn: crearDnsFalso().lookup });

    const avisos = console.warn.mock.calls.flat().join(' ');
    expect(avisos).toContain('logos.test');
    expect(avisos).not.toContain('secreto123');
    expect(avisos).not.toContain('privado');
  });
});

describe('generarCertificadoAsistencia con logos buenos y malos', () => {
  it('un logo malo no impide que se incluya otro bueno', async () => {
    const malo = 'https://malo.test/logo.png';
    const https = crearHttpsFalso({ [malo]: respuestaPng(), [URL_LOGO]: respuestaPng() });
    const dns = crearDnsFalso({ 'malo.test': ['169.254.169.254'] });

    const pdf = await generarCertificadoAsistencia({ socio, evento: evento([malo, URL_LOGO, 'http://viejo.test/a.png']) }, { requestFn: https.request, lookupFn: dns.lookup });

    expect(imagenesEnPdf(pdf)).toBe(1);
  });

  it(`de un evento viejo con más de ${MAXIMO_LOGOS_EXTERNOS} logos guardados solo se descargan los primeros ${MAXIMO_LOGOS_EXTERNOS}`, async () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://logos.test/${i}.png`);
    const https = crearHttpsFalso(Object.fromEntries(urls.map((url) => [url, respuestaPng()])));

    const pdf = await generarCertificadoAsistencia({ socio, evento: evento(urls) }, { requestFn: https.request, lookupFn: crearDnsFalso().lookup });

    expect(https.pedidos).toHaveLength(5);
    expect(imagenesEnPdf(pdf)).toBe(5);
  });
});
