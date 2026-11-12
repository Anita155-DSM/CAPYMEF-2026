import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Writable } from 'node:stream';

// Comprobantes de pago privados: se suben a Cloudinary como "authenticated", el backend los entrega (al socio
// dueño y al admin) bajándolos con una URL temporal firmada, y la URL de Cloudinary ya no sale en ningún JSON.
// Cloudinary es falso en todos estos tests: el SDK se reemplaza por uno que anota las subidas y arma URLs
// temporales inventadas, y fetch (la descarga) también es falso. Nada sale a internet.
const { upload_stream, private_download_url } = vi.hoisted(() => ({ upload_stream: vi.fn(), private_download_url: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { uploader: { upload_stream, destroy: vi.fn() }, utils: { private_download_url }, config: vi.fn() } }));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(async () => {}), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/pasarela.service.js', () => ({ crearOrdenDePago: vi.fn(), procesarNotificacionPago: vi.fn() }));

const { generarComprobantePago } = await import('../../services/comprobante.service.js');
const { enviarMailComprobantePago } = await import('../../config/mailer.js');
const { extraerPublicIdDeUrl, leerUrlDeCloudinary, urlTemporalDeDescarga, MINUTOS_URL_TEMPORAL } = await import('../../services/cloudinary.service.js');
const { descargarPdfGuardado } = await import('../../services/comprobanteGuardado.service.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { default: cuotaRoutes } = await import('../../routes/cuota.routes.js');
const { default: pagoRoutes } = await import('../../routes/pago.routes.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
app.use(express.json());
app.use('/api/cuotas', cuotaRoutes);
app.use('/api/pagos', pagoRoutes);

// URLs inventadas con la forma real de Cloudinary (cuenta "demo"): ninguna es de un archivo de verdad.
const URL_PRIVADA = 'https://res.cloudinary.com/demo/image/authenticated/s--AbC123xy--/v1731000000/capymef_comprobantes_pago/comprobante-1.pdf';
const URL_PUBLICA_VIEJA = 'https://res.cloudinary.com/demo/image/upload/v1700000000/capymef_comprobantes_pago/comprobante-viejo.pdf';
const URL_TEMPORAL = 'https://api.cloudinary.com/v1_1/demo/image/download?public_id=capymef_comprobantes_pago%2Fcomprobante-1&signature=firma-inventada';
const PDF_GUARDADO = Buffer.from('%PDF-1.4 el original guardado');
const PDF_REGENERADO = Buffer.from('%PDF-1.4 regenerado');

const respuestaPdf = (buffer) => ({ ok: true, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length) });

let admin;
let socio;
let otro;
let fetchFalso;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  generarComprobantePago.mockResolvedValue(PDF_REGENERADO);
  private_download_url.mockReturnValue(URL_TEMPORAL);
  // La subida falsa responde como Cloudinary: con la URL del archivo, en este caso privada (authenticated).
  upload_stream.mockImplementation((opciones, callback) =>
    new Writable({
      write(chunk, _, listo) { listo(); },
      final(listo) {
        listo();
        callback(null, { secure_url: `https://res.cloudinary.com/demo/image/${opciones.type ?? 'upload'}/s--Firma--/v1/${opciones.folder}/${opciones.public_id}.pdf` });
      },
    })
  );
  // Descarga falsa: la URL temporal y la pública vieja devuelven el PDF guardado.
  fetchFalso = vi.fn(async (url) => ([URL_TEMPORAL, URL_PUBLICA_VIEJA].includes(url) ? respuestaPdf(PDF_GUARDADO) : { ok: false }));
  vi.stubGlobal('fetch', fetchFalso);
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin' });
  socio = await crearUsuario({ razonSocial: 'Empresa Socia SA' });
  otro = await crearUsuario();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const token = (usuario) => `Bearer ${jwt.sign({ id: usuario.id }, process.env.JWT_SECRET)}`;
const cuota = (usuario, datos = {}) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente', ...datos });
const pagadaCon = async (usuario, urlComprobante) => {
  const pagada = await cuota(usuario, { estado: 'pagada' });
  await Pago.create({ cuota_id: pagada.id, usuario_id: usuario.id, montoAbonado: 10000, urlComprobante });
  return pagada;
};
const descargaSocio = (usuario, cuotaId) =>
  request(app).get(`/api/pagos/mis-cuotas/${cuotaId}/comprobante`).set('Authorization', token(usuario)).buffer(true);
const descargaAdmin = (cuotaId) => request(app).get(`/api/cuotas/${cuotaId}/comprobante`).set('Authorization', token(admin)).buffer(true);

// ==========================================
// URLs de Cloudinary
// ==========================================
describe('extraerPublicIdDeUrl y leerUrlDeCloudinary', () => {
  it.each([
    ['pública con versión', 'https://res.cloudinary.com/demo/image/upload/v1712345678/capymef_noticias/abc123.webp', 'capymef_noticias/abc123'],
    ['pública sin versión', 'https://res.cloudinary.com/demo/image/upload/capymef_noticias/abc123.webp', 'capymef_noticias/abc123'],
    ['privada con firma y versión', URL_PRIVADA, 'capymef_comprobantes_pago/comprobante-1'],
    ['privada con firma, sin versión', 'https://res.cloudinary.com/demo/image/authenticated/s--AbC123xy--/capymef_comprobantes_pago/comprobante-1.pdf', 'capymef_comprobantes_pago/comprobante-1'],
    ['privada sin firma ni versión', 'https://res.cloudinary.com/demo/image/authenticated/capymef_comprobantes_pago/comprobante-1.pdf', 'capymef_comprobantes_pago/comprobante-1'],
    ['con parámetros en la URL', 'https://res.cloudinary.com/demo/image/upload/v1/carpeta/foto.png?_a=xyz', 'carpeta/foto'],
  ])('URL %s → public_id correcto', (_, url, publicId) => {
    expect(extraerPublicIdDeUrl(url)).toBe(publicId);
  });

  it('distingue el tipo de entrega, el tipo de recurso y el formato', () => {
    expect(leerUrlDeCloudinary(URL_PRIVADA)).toEqual({
      resourceType: 'image', tipoEntrega: 'authenticated', publicId: 'capymef_comprobantes_pago/comprobante-1', formato: 'pdf',
    });
    expect(leerUrlDeCloudinary(URL_PUBLICA_VIEJA).tipoEntrega).toBe('upload');
  });

  it.each([
    ['de otro sitio', 'https://otro-sitio.com/demo/image/upload/v1/foto.png'],
    ['con otro tipo de entrega', 'https://res.cloudinary.com/demo/image/private/v1/foto.png'],
    ['vacía', ''],
    ['null', null],
  ])('una URL %s no se reconoce (null)', (_, url) => {
    expect(extraerPublicIdDeUrl(url)).toBeNull();
  });
});

describe('urlTemporalDeDescarga', () => {
  it(`firma una descarga del archivo privado que vence en ${MINUTOS_URL_TEMPORAL} minutos`, () => {
    const ahora = Math.floor(Date.now() / 1000);

    expect(urlTemporalDeDescarga(URL_PRIVADA)).toBe(URL_TEMPORAL);

    const [publicId, formato, opciones] = private_download_url.mock.calls[0];
    expect(publicId).toBe('capymef_comprobantes_pago/comprobante-1');
    expect(formato).toBe('pdf');
    expect(opciones).toMatchObject({ resource_type: 'image', type: 'authenticated' });
    expect(opciones.expires_at).toBeGreaterThanOrEqual(ahora + MINUTOS_URL_TEMPORAL * 60);
    expect(opciones.expires_at).toBeLessThanOrEqual(ahora + MINUTOS_URL_TEMPORAL * 60 + 5);
  });

  it('para una URL pública (o que no es de Cloudinary) devuelve null: no hace falta firmar', () => {
    expect(urlTemporalDeDescarga(URL_PUBLICA_VIEJA)).toBeNull();
    expect(urlTemporalDeDescarga('https://otro-sitio.com/x.pdf')).toBeNull();
    expect(private_download_url).not.toHaveBeenCalled();
  });
});

describe('descargarPdfGuardado con URLs privadas y públicas', () => {
  it('una URL privada se descarga con la URL temporal firmada (y no con la guardada)', async () => {
    const pdf = await descargarPdfGuardado(URL_PRIVADA);

    expect(pdf.equals(PDF_GUARDADO)).toBe(true);
    expect(fetchFalso).toHaveBeenCalledOnce();
    expect(fetchFalso.mock.calls[0][0]).toBe(URL_TEMPORAL);
    expect(fetchFalso.mock.calls[0][1].redirect).toBe('error');
  });

  it('una URL pública vieja se sigue descargando directo, sin firmar', async () => {
    expect((await descargarPdfGuardado(URL_PUBLICA_VIEJA)).equals(PDF_GUARDADO)).toBe(true);
    expect(private_download_url).not.toHaveBeenCalled();
  });

  it('si la URL temporal no es de Cloudinary, no se hace la petición', async () => {
    private_download_url.mockReturnValue('https://otro-sitio.com/robar');

    expect(await descargarPdfGuardado(URL_PRIVADA)).toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('si firmar la URL falla, devuelve null sin lanzar el error', async () => {
    private_download_url.mockImplementation(() => { throw new Error('falta la configuración de Cloudinary'); });

    await expect(descargarPdfGuardado(URL_PRIVADA)).resolves.toBeNull();
  });

  it('si lo que baja no es un PDF, devuelve null (se mantiene el control de %PDF)', async () => {
    fetchFalso.mockResolvedValue(respuestaPdf(Buffer.from('<html>no es un pdf</html>')));

    expect(await descargarPdfGuardado(URL_PRIVADA)).toBeNull();
  });
});

// ==========================================
// Subida
// ==========================================
describe('la subida del comprobante es privada', () => {
  it('al registrar un pago manual, el comprobante se sube con type authenticated y se guarda su URL privada', async () => {
    const pendiente = await cuota(socio);

    await request(app).put(`/api/cuotas/${pendiente.id}/pagar`).set('Authorization', token(admin)).send({ metodoPago: 'Efectivo' });

    expect(upload_stream).toHaveBeenCalledOnce();
    expect(upload_stream.mock.calls[0][0]).toMatchObject({ folder: 'capymef_comprobantes_pago', type: 'authenticated', format: 'pdf' });
    const pago = await Pago.findOne({ where: { cuota_id: pendiente.id } });
    expect(leerUrlDeCloudinary(pago.urlComprobante).tipoEntrega).toBe('authenticated');
  });

  it('el mail al socio sigue llevando el PDF adjunto, como siempre', async () => {
    const pendiente = await cuota(socio);

    await request(app).put(`/api/cuotas/${pendiente.id}/pagar`).set('Authorization', token(admin)).send({});

    expect(enviarMailComprobantePago).toHaveBeenCalledWith(socio.email, expect.any(Object), PDF_REGENERADO);
  });

  it('si la subida privada falla, el pago queda registrado igual', async () => {
    upload_stream.mockImplementation((opciones, callback) =>
      new Writable({ write(c, _, listo) { listo(); }, final(listo) { listo(); callback(new Error('Cloudinary rechazó la subida')); } })
    );
    const pendiente = await cuota(socio);

    const respuesta = await request(app).put(`/api/cuotas/${pendiente.id}/pagar`).set('Authorization', token(admin)).send({});

    expect(respuesta.status).toBe(200);
    expect((await pendiente.reload()).estado).toBe('pagada');
    expect((await Pago.findOne({ where: { cuota_id: pendiente.id } })).urlComprobante).toBeNull();
  });
});

// ==========================================
// Descargas a través del backend
// ==========================================
describe('el socio descarga su comprobante a través del backend', () => {
  it('con URL privada: entrega el PDF guardado, bajado con la URL temporal', async () => {
    const pagada = await pagadaCon(socio, URL_PRIVADA);

    const respuesta = await descargaSocio(socio, pagada.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toBe('application/pdf');
    expect(Buffer.from(respuesta.body).equals(PDF_GUARDADO)).toBe(true);
    expect(fetchFalso.mock.calls[0][0]).toBe(URL_TEMPORAL);
  });

  it('con URL pública vieja: sigue funcionando', async () => {
    const pagada = await pagadaCon(socio, URL_PUBLICA_VIEJA);

    expect(Buffer.from((await descargaSocio(socio, pagada.id)).body).equals(PDF_GUARDADO)).toBe(true);
  });

  it('si la descarga falla (Cloudinary caído), lo regenera', async () => {
    fetchFalso.mockResolvedValue({ ok: false });
    const pagada = await pagadaCon(socio, URL_PRIVADA);

    const respuesta = await descargaSocio(socio, pagada.id);

    expect(respuesta.status).toBe(200);
    expect(Buffer.from(respuesta.body).equals(PDF_REGENERADO)).toBe(true);
  });

  it('el comprobante de una cuota ajena responde 404, como antes, sin tocar Cloudinary', async () => {
    const ajena = await pagadaCon(otro, URL_PRIVADA);

    expect((await descargaSocio(socio, ajena.id)).status).toBe(404);
    expect(fetchFalso).not.toHaveBeenCalled();
    expect(private_download_url).not.toHaveBeenCalled();
  });
});

describe('el admin descarga el comprobante a través del backend', () => {
  it('entrega el PDF directo (200), no redirige a Cloudinary (302)', async () => {
    const pagada = await pagadaCon(socio, URL_PRIVADA);

    const respuesta = await descargaAdmin(pagada.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.location).toBeUndefined();
    expect(Buffer.from(respuesta.body).equals(PDF_GUARDADO)).toBe(true);
  });

  it('con una URL pública vieja también lo entrega directo', async () => {
    const pagada = await pagadaCon(socio, URL_PUBLICA_VIEJA);

    const respuesta = await descargaAdmin(pagada.id);

    expect(respuesta.status).toBe(200);
    expect(Buffer.from(respuesta.body).equals(PDF_GUARDADO)).toBe(true);
  });

  it('si la descarga falla, lo regenera', async () => {
    fetchFalso.mockResolvedValue({ ok: false });
    const pagada = await pagadaCon(socio, URL_PRIVADA);

    expect(Buffer.from((await descargaAdmin(pagada.id)).body).equals(PDF_REGENERADO)).toBe(true);
  });
});

// ==========================================
// Ningún JSON manda la URL
// ==========================================
describe('la URL del comprobante ya no sale en ningún JSON', () => {
  const sinUrl = (cuerpo) => {
    const texto = JSON.stringify(cuerpo);
    expect(texto).not.toContain('urlComprobante');
    expect(texto).not.toContain('res.cloudinary.com');
  };

  it('GET /api/pagos/mis-cuotas: sin URL y con tieneComprobante correcto en cada cuota', async () => {
    await pagadaCon(socio, URL_PRIVADA);
    await cuota(socio, { mes_anio: '2026-12', fecha_vencimiento: '2026-12-10' });

    const respuesta = await request(app).get('/api/pagos/mis-cuotas').set('Authorization', token(socio));

    sinUrl(respuesta.body);
    const porMes = Object.fromEntries(respuesta.body.data.map((c) => [c.mes_anio, c]));
    expect(porMes['2026-11'].tieneComprobante).toBe(true);
    expect(porMes['2026-11'].pago.tieneComprobante).toBe(true);
    expect(porMes['2026-12'].tieneComprobante).toBe(false);
    expect(porMes['2026-12'].pago).toBeNull();
  });

  it('GET /api/cuotas/pagos/sin-confirmar: sin URL y con tieneComprobante', async () => {
    await pagadaCon(socio, URL_PRIVADA);

    const respuesta = await request(app).get('/api/cuotas/pagos/sin-confirmar').set('Authorization', token(admin));

    sinUrl(respuesta.body);
    expect(respuesta.body.data).toHaveLength(1);
    expect(respuesta.body.data[0]).toMatchObject({ tieneComprobante: true, socio: { razonSocial: 'Empresa Socia SA' } });
  });

  it('PUT /api/cuotas/:id/pagar: la respuesta trae el pago sin URL y con tieneComprobante', async () => {
    const pendiente = await cuota(socio);

    const respuesta = await request(app).put(`/api/cuotas/${pendiente.id}/pagar`).set('Authorization', token(admin)).send({});

    sinUrl(respuesta.body);
    expect(respuesta.body.data.pago).toMatchObject({ tieneComprobante: true, cuota_id: pendiente.id });
    // La URL sí queda guardada en la base, para que el backend pueda traer el PDF.
    expect((await Pago.findOne({ where: { cuota_id: pendiente.id } })).urlComprobante).toContain('/authenticated/');
  });
});
