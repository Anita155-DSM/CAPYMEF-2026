import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Writable } from 'node:stream';
import { DataTypes } from 'sequelize';

// Etapa 2 de archivos privados: la constancia de AFIP/DGR del registro y los comprobantes de gastos se suben a
// Cloudinary como privados ("authenticated"), ningún JSON devuelve su URL, y hay endpoints que entregan una URL
// temporal (al dueño o a un admin). Las imágenes de noticias y eventos siguen públicas.
// Cloudinary es falso: el SDK se reemplaza por uno que anota subidas, firmas y borrados. Las subidas pasan por el
// multer y el CloudinaryStorage reales, así se comprueba lo que de verdad le llegaría a Cloudinary.
const { upload_stream, destroy, private_download_url } = vi.hoisted(() => ({
  upload_stream: vi.fn(), destroy: vi.fn(), private_download_url: vi.fn(),
}));
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { upload_stream, destroy }, utils: { private_download_url } } }));
vi.mock('../../config/mailer.js', () => ({ enviarMailRecuperacion: vi.fn(), enviarMailComprobantePago: vi.fn() }));

const { uploadConstancia, uploadGasto } = await import('../../middlewares/multer/multerCloudinary.js');
const { uploadNoticia } = await import('../../middlewares/multer/multerNoticias.js');
const { uploadEvento } = await import('../../middlewares/multer/multerEventos.js');
const { urlTemporalDeArchivo, eliminarArchivoDeCloudinary, MINUTOS_URL_TEMPORAL } = await import('../../services/cloudinary.service.js');
const { User } = await import('../../models/user.models.js');
const { Gasto } = await import('../../models/gasto.models.js');
const { Auditoria } = await import('../../models/auditoria.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { default: gastoRoutes } = await import('../../routes/gasto.routes.js');
const { interceptorAuditoria } = await import('../../middlewares/auditoria.middleware.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Igual que en app.js: el interceptor de auditoría delante de /api.
const app = express();
app.use(express.json());
app.use('/api', interceptorAuditoria);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gastos', gastoRoutes);

// URLs inventadas con la forma real de Cloudinary (cuenta "demo"): ninguna es de un archivo de verdad.
const CONSTANCIA_PRIVADA = 'https://res.cloudinary.com/demo/image/authenticated/s--Firma123--/v1731000000/capymef_constancias/constancia-1.pdf';
const CONSTANCIA_PUBLICA_VIEJA = 'https://res.cloudinary.com/demo/image/upload/v1700000000/capymef_comprobantes/constancia-vieja.pdf';
const TICKET_PRIVADO = 'https://res.cloudinary.com/demo/image/authenticated/s--Firma456--/v1731000000/capymef_gastos/ticket-1.jpg';
const URL_TEMPORAL = 'https://api.cloudinary.com/v1_1/demo/image/download?public_id=algo&signature=firma-inventada';
const PDF = Buffer.from('%PDF-1.4 constancia de prueba');

let admin;
let socio;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  private_download_url.mockReturnValue(URL_TEMPORAL);
  destroy.mockResolvedValue({ result: 'ok' });
  // La subida falsa responde como Cloudinary: URL con el tipo de entrega y la carpeta que se le pidieron.
  upload_stream.mockImplementation((opciones, callback) =>
    new Writable({
      write(chunk, _, listo) { listo(); },
      final(listo) {
        listo();
        const tipo = opciones.type ?? 'upload';
        const firma = tipo === 'authenticated' ? 's--FirmaSubida--/' : '';
        callback(null, { secure_url: `https://res.cloudinary.com/demo/image/${tipo}/${firma}v1/${opciones.folder}/archivo-subido.pdf`, bytes: 30, public_id: `${opciones.folder}/archivo-subido` });
      },
    })
  );
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin' });
  socio = await crearUsuario({ constanciaUrl: CONSTANCIA_PRIVADA });
  tokenAdmin = `Bearer ${jwt.sign({ id: admin.id }, process.env.JWT_SECRET)}`;
  tokenSocio = `Bearer ${jwt.sign({ id: socio.id }, process.env.JWT_SECRET)}`;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const sinUrlsDeArchivos = (cuerpo) => {
  const texto = JSON.stringify(cuerpo);
  expect(texto).not.toContain('constanciaUrl');
  expect(texto).not.toContain('url_comprobante');
  expect(texto).not.toContain('res.cloudinary.com');
};

// ==========================================
// Subidas
// ==========================================
describe('subidas: constancias y gastos privados, noticias y eventos públicos', () => {
  // App mínima con un middleware de subida real: devuelve qué archivo quedó en req.file.
  const subirCon = (middleware, campo, archivo) => {
    const mini = express();
    mini.post('/subir', middleware.single(campo), (req, res) => res.json({ archivo: req.file }));
    return request(mini).post('/subir').attach(campo, archivo.contenido, { filename: archivo.nombre, contentType: archivo.tipo });
  };
  const pdf = { contenido: PDF, nombre: 'constancia.pdf', tipo: 'application/pdf' };
  const png = { contenido: Buffer.from('\x89PNG imagen'), nombre: 'foto.png', tipo: 'image/png' };
  const opcionesDeLaSubida = () => upload_stream.mock.calls[0][0];

  it('la constancia del registro se sube como privada (authenticated) a capymef_constancias', async () => {
    const respuesta = await subirCon(uploadConstancia, 'constancia', pdf);

    expect(opcionesDeLaSubida()).toMatchObject({ folder: 'capymef_constancias', type: 'authenticated', resource_type: 'auto' });
    expect(respuesta.body.archivo.path).toContain('/authenticated/');
  });

  it('el comprobante de un gasto se sube como privado (authenticated) a capymef_gastos', async () => {
    await subirCon(uploadGasto, 'comprobante', pdf);

    expect(opcionesDeLaSubida()).toMatchObject({ folder: 'capymef_gastos', type: 'authenticated' });
  });

  it.each([
    ['noticias', () => uploadNoticia, 'capymef_noticias'],
    ['eventos', () => uploadEvento, 'capymef_eventos'],
  ])('las imágenes de %s siguen públicas (sin type authenticated)', async (_, middleware, carpeta) => {
    await subirCon(middleware(), 'imagen', png);

    expect(opcionesDeLaSubida().folder).toBe(carpeta);
    expect(opcionesDeLaSubida().type).toBeUndefined();
  });
});

// ==========================================
// URL temporal
// ==========================================
describe('urlTemporalDeArchivo', () => {
  it(`URL privada de un PDF: firma una descarga que vence en ${MINUTOS_URL_TEMPORAL} minutos y avisa que es PDF`, () => {
    const ahora = Date.now();

    const resultado = urlTemporalDeArchivo(CONSTANCIA_PRIVADA);

    expect(resultado.url).toBe(URL_TEMPORAL);
    expect(resultado.esPdf).toBe(true);
    const [publicId, formato, opciones] = private_download_url.mock.calls[0];
    expect(publicId).toBe('capymef_constancias/constancia-1');
    expect(formato).toBe('pdf');
    expect(opciones).toMatchObject({ resource_type: 'image', type: 'authenticated' });
    const vence = new Date(resultado.expiraEn).getTime();
    expect(vence).toBe(opciones.expires_at * 1000);
    expect(vence - ahora).toBeGreaterThan((MINUTOS_URL_TEMPORAL * 60 - 5) * 1000);
    expect(vence - ahora).toBeLessThanOrEqual((MINUTOS_URL_TEMPORAL * 60 + 1) * 1000);
  });

  it('URL privada de una imagen: esPdf false y el formato de la imagen', () => {
    const resultado = urlTemporalDeArchivo(TICKET_PRIVADO);

    expect(resultado.esPdf).toBe(false);
    expect(private_download_url.mock.calls[0][1]).toBe('jpg');
  });

  it('URL pública vieja: devuelve la misma URL (sigue funcionando hasta la migración), sin vencimiento', () => {
    expect(urlTemporalDeArchivo(CONSTANCIA_PUBLICA_VIEJA)).toEqual({ url: CONSTANCIA_PUBLICA_VIEJA, expiraEn: null, esPdf: true });
    expect(private_download_url).not.toHaveBeenCalled();
  });

  it.each([null, '', 'uploads/constancias/vieja.pdf', 'https://otro-sitio.com/archivo.pdf'])('una URL que no es de Cloudinary (%j) devuelve null', (url) => {
    expect(urlTemporalDeArchivo(url)).toBeNull();
  });
});

// ==========================================
// Endpoints con la URL temporal
// ==========================================
describe('GET /api/auth/perfil/constancia (el socio, la suya)', () => {
  const pedir = (token) => request(app).get('/api/auth/perfil/constancia').set('Authorization', token);

  it('devuelve la URL temporal de su constancia', async () => {
    const respuesta = await pedir(tokenSocio);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ exito: true, data: { url: URL_TEMPORAL, expiraEn: expect.any(String), esPdf: true } });
  });

  it('un socio sin constancia recibe 404 (no la de otro socio: el id sale de su token)', async () => {
    const otro = await crearUsuario({ constanciaUrl: null });

    const respuesta = await pedir(`Bearer ${jwt.sign({ id: otro.id }, process.env.JWT_SECRET)}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('No hay ninguna constancia cargada.');
    expect(private_download_url).not.toHaveBeenCalled();
  });

  it('sin token responde 401', async () => {
    expect((await request(app).get('/api/auth/perfil/constancia')).status).toBe(401);
  });
});

describe('GET /api/admin/socios/:id/constancia (solo admin)', () => {
  const pedir = (id, token = tokenAdmin) => request(app).get(`/api/admin/socios/${id}/constancia`).set('Authorization', token);

  it('el admin recibe la URL temporal de la constancia del socio', async () => {
    const respuesta = await pedir(socio.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual({ url: URL_TEMPORAL, expiraEn: expect.any(String), esPdf: true });
  });

  it('un socio no puede pedir la constancia de otro por esta ruta: 403', async () => {
    const otro = await crearUsuario({ constanciaUrl: CONSTANCIA_PRIVADA });

    const respuesta = await pedir(otro.id, tokenSocio);

    expect(respuesta.status).toBe(403);
    expect(private_download_url).not.toHaveBeenCalled();
  });

  it('sin token responde 401', async () => {
    expect((await request(app).get(`/api/admin/socios/${socio.id}/constancia`)).status).toBe(401);
  });

  it('un socio sin constancia responde 404', async () => {
    const sinConstancia = await crearUsuario({ constanciaUrl: null });

    expect((await pedir(sinConstancia.id)).status).toBe(404);
  });

  it('un socio que no existe responde 404', async () => {
    expect((await pedir(99999)).status).toBe(404);
  });

  it('una constancia vieja pública se sigue pudiendo abrir (devuelve su misma URL)', async () => {
    const viejo = await crearUsuario({ constanciaUrl: CONSTANCIA_PUBLICA_VIEJA });

    expect((await pedir(viejo.id)).body.data).toEqual({ url: CONSTANCIA_PUBLICA_VIEJA, expiraEn: null, esPdf: true });
  });

  it('una constancia guardada fuera de Cloudinary (archivo local viejo) responde 404 "no disponible"', async () => {
    const local = await crearUsuario({ constanciaUrl: 'uploads/constancias/vieja.pdf' });

    const respuesta = await pedir(local.id);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('El archivo no está disponible.');
  });
});

describe('GET /api/gastos/:id/comprobante (solo admin)', () => {
  const crearGasto = (url) => Gasto.create({ fecha: '2026-11-05', concepto: 'Factura REFSA', monto: 1000, url_comprobante: url });
  const pedir = (id, token = tokenAdmin) => request(app).get(`/api/gastos/${id}/comprobante`).set('Authorization', token);

  it('el admin recibe la URL temporal del comprobante (imagen)', async () => {
    const gasto = await crearGasto(TICKET_PRIVADO);

    const respuesta = await pedir(gasto.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual({ url: URL_TEMPORAL, expiraEn: expect.any(String), esPdf: false });
  });

  it('un gasto sin comprobante responde 404', async () => {
    const gasto = await crearGasto(null);

    const respuesta = await pedir(gasto.id);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('Este gasto no tiene comprobante.');
  });

  it('con token de socio responde 403 y sin token 401', async () => {
    const gasto = await crearGasto(TICKET_PRIVADO);

    expect((await pedir(gasto.id, tokenSocio)).status).toBe(403);
    expect((await request(app).get(`/api/gastos/${gasto.id}/comprobante`)).status).toBe(401);
  });
});

describe('pedir una URL temporal no queda en la auditoría (es una consulta)', () => {
  it('ninguno de los tres endpoints crea registros de auditoría', async () => {
    const gasto = await Gasto.create({ fecha: '2026-11-05', concepto: 'Luz', monto: 1, url_comprobante: TICKET_PRIVADO });

    await request(app).get('/api/auth/perfil/constancia').set('Authorization', tokenSocio);
    await request(app).get(`/api/admin/socios/${socio.id}/constancia`).set('Authorization', tokenAdmin);
    await request(app).get(`/api/gastos/${gasto.id}/comprobante`).set('Authorization', tokenAdmin);
    // Una operación que sí se audita, para saber que el interceptor ya procesó las anteriores.
    await request(app).put(`/api/admin/socios/${socio.id}`).set('Authorization', tokenAdmin).send({ telefono: '3704111111' });

    await vi.waitFor(async () => expect(await Auditoria.count()).toBe(1));
    expect((await Auditoria.findOne()).codigoTecnico).toBe('SOCIO_ACTUALIZADO');
  });
});

// ==========================================
// Ningún JSON expone la URL
// ==========================================
describe('ningún JSON devuelve la URL de un archivo privado', () => {
  it('GET /api/auth/perfil: sin constanciaUrl y con tieneConstancia', async () => {
    const conConstancia = await request(app).get('/api/auth/perfil').set('Authorization', tokenSocio);
    const sinConstancia = await crearUsuario({ constanciaUrl: null });
    const sinElla = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${jwt.sign({ id: sinConstancia.id }, process.env.JWT_SECRET)}`);

    sinUrlsDeArchivos(conConstancia.body);
    expect(conConstancia.body.data.tieneConstancia).toBe(true);
    expect(sinElla.body.data.tieneConstancia).toBe(false);
  });

  it('GET /api/admin/usuarios: sin constanciaUrl y con tieneConstancia correcto en cada uno', async () => {
    const respuesta = await request(app).get('/api/admin/usuarios').set('Authorization', tokenAdmin);

    sinUrlsDeArchivos(respuesta.body);
    const porId = Object.fromEntries(respuesta.body.data.map((u) => [u.id, u]));
    expect(porId[socio.id].tieneConstancia).toBe(true);
    expect(porId[admin.id].tieneConstancia).toBe(false);
  });

  it('GET /api/gastos: sin url_comprobante y con tieneComprobante correcto', async () => {
    await Gasto.create({ fecha: '2026-11-05', concepto: 'Con ticket', monto: 1, url_comprobante: TICKET_PRIVADO });
    await Gasto.create({ fecha: '2026-11-04', concepto: 'Sin ticket', monto: 1 });

    const respuesta = await request(app).get('/api/gastos').set('Authorization', tokenAdmin);

    sinUrlsDeArchivos(respuesta.body);
    const porConcepto = Object.fromEntries(respuesta.body.data.map((g) => [g.concepto, g]));
    expect(porConcepto['Con ticket'].tieneComprobante).toBe(true);
    expect(porConcepto['Sin ticket'].tieneComprobante).toBe(false);
  });

  it('POST /api/gastos (con comprobante subido de verdad por multer): la respuesta no trae la URL', async () => {
    const respuesta = await request(app).post('/api/gastos').set('Authorization', tokenAdmin)
      .field('fecha', '2026-11-05').field('concepto', 'Mantenimiento').field('monto', '15400.50')
      .attach('comprobante', PDF, { filename: 'factura.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(201);
    sinUrlsDeArchivos(respuesta.body);
    expect(respuesta.body.data.tieneComprobante).toBe(true);
    // La URL privada sí queda guardada en la base, para poder pedir después la URL temporal.
    expect((await Gasto.findByPk(respuesta.body.data.id)).url_comprobante).toContain('/authenticated/');
  });
});

// ==========================================
// Borrado de archivos privados
// ==========================================
describe('borrado de un archivo que ya se subió', () => {
  it('eliminarArchivoDeCloudinary con una URL privada llama a destroy con el public_id y type authenticated', async () => {
    await eliminarArchivoDeCloudinary(CONSTANCIA_PRIVADA);

    expect(destroy).toHaveBeenCalledWith('capymef_constancias/constancia-1', { type: 'authenticated', resource_type: 'image', invalidate: true });
  });

  it('con una URL pública vieja llama a destroy con type upload', async () => {
    await eliminarArchivoDeCloudinary(CONSTANCIA_PUBLICA_VIEJA);

    expect(destroy).toHaveBeenCalledWith('capymef_comprobantes/constancia-vieja', { type: 'upload', resource_type: 'image', invalidate: true });
  });

  it('con una URL que no es de Cloudinary no llama a destroy', async () => {
    await eliminarArchivoDeCloudinary('uploads/x.pdf');

    expect(destroy).not.toHaveBeenCalled();
  });

  it('si destroy falla no lanza el error (se llama desde los catch)', async () => {
    destroy.mockRejectedValue(new Error('Cloudinary no responde'));

    await expect(eliminarArchivoDeCloudinary(CONSTANCIA_PRIVADA)).resolves.toBeUndefined();
  });

  it('un registro con email repetido borra la constancia privada recién subida (antes quedaba huérfana)', async () => {
    const respuesta = await request(app).post('/api/auth/registro')
      .field('razonSocial', 'Empresa Repetida SRL').field('cuit', '30-71234567-8').field('email', socio.email)
      .field('password', 'ClaveSegura1').field('telefono', '3704555555').field('localidad', 'Formosa')
      .field('rubro', 'Comercio').field('aceptaTerminos', 'true')
      .attach('constancia', PDF, { filename: 'constancia.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(400);
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledWith('capymef_constancias/archivo-subido', { type: 'authenticated', resource_type: 'image', invalidate: true }));
  });

  it('un gasto rechazado (sin concepto) borra el comprobante privado recién subido', async () => {
    const respuesta = await request(app).post('/api/gastos').set('Authorization', tokenAdmin)
      .field('fecha', '2026-11-05').field('monto', '100')
      .attach('comprobante', PDF, { filename: 'factura.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(400);
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledWith('capymef_gastos/archivo-subido', { type: 'authenticated', resource_type: 'image', invalidate: true }));
  });

  it('un registro exitoso guarda la constancia privada y el perfil la marca con tieneConstancia', async () => {
    const respuesta = await request(app).post('/api/auth/registro')
      .field('razonSocial', 'Empresa Nueva SRL').field('cuit', '30-79999999-1').field('email', 'nueva@empresa.com')
      .field('password', 'ClaveSegura1').field('telefono', '3704555555').field('localidad', 'Formosa')
      .field('rubro', 'Comercio').field('aceptaTerminos', 'true')
      .attach('constancia', PDF, { filename: 'constancia.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(201);
    sinUrlsDeArchivos(respuesta.body);
    const nueva = await User.findOne({ where: { email: 'nueva@empresa.com' } });
    expect(nueva.constanciaUrl).toContain('/authenticated/');
    expect(destroy).not.toHaveBeenCalled();
  });
});
