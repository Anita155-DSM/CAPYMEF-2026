import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Writable } from 'node:stream';
import { DataTypes } from 'sequelize';

// multer sube el archivo a Cloudinary ANTES de que corran los validadores. Si la validación rechaza la petición,
// el archivo se tiene que borrar (validarResultado), para que no quede huérfano. Vale para todas las subidas:
// constancia del registro y comprobante de gasto (privados) e imágenes de noticias y eventos (públicas).
// Cloudinary es falso: el SDK se reemplaza por uno que anota subidas y borrados. Las subidas pasan por el multer
// y el CloudinaryStorage reales. El borrado del servicio se envuelve en un espía que por defecto llama al real.
const { upload_stream, destroy } = vi.hoisted(() => ({ upload_stream: vi.fn(), destroy: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { upload_stream, destroy }, utils: { private_download_url: vi.fn() } } }));
vi.mock('../../config/mailer.js', () => ({ enviarMailRecuperacion: vi.fn(), enviarMailComprobantePago: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, eliminarArchivoDeCloudinary: vi.fn(real.eliminarArchivoDeCloudinary) };
});

const { eliminarArchivoDeCloudinary } = await import('../../services/cloudinary.service.js');
const { User } = await import('../../models/user.models.js');
const { Gasto } = await import('../../models/gasto.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: gastoRoutes } = await import('../../routes/gasto.routes.js');
const { default: noticiaRoutes } = await import('../../routes/noticia.routes.js');
const { default: eventoRoutes } = await import('../../routes/evento.routes.js');
const { manejadorErrores } = await import('../../middlewares/manejadorErrores.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata como
// JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/noticias', noticiaRoutes);
app.use('/api/eventos', eventoRoutes);
app.use(manejadorErrores);

const PDF = Buffer.from('%PDF-1.4 constancia de prueba');
const PNG = Buffer.from('\x89PNG imagen de prueba');
const BORRADO_PRIVADO = { type: 'authenticated', resource_type: 'image', invalidate: true };
const BORRADO_PUBLICO = { type: 'upload', resource_type: 'image', invalidate: true };
const RECHAZO = { exito: false, mensaje: 'Error de validación en los datos enviados.' };

let tokenAdmin;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  destroy.mockResolvedValue({ result: 'ok' });
  // La subida falsa responde como Cloudinary, con el tipo de entrega y la carpeta que se le pidieron.
  upload_stream.mockImplementation((opciones, callback) =>
    new Writable({
      write(chunk, _, listo) { listo(); },
      final(listo) {
        listo();
        const tipo = opciones.type ?? 'upload';
        const firma = tipo === 'authenticated' ? 's--Firma--/' : '';
        callback(null, { secure_url: `https://res.cloudinary.com/demo/image/${tipo}/${firma}v1/${opciones.folder}/subido.pdf`, bytes: 30, public_id: `${opciones.folder}/subido` });
      },
    })
  );
  await reiniciarBase();
  tokenAdmin = `Bearer ${jwt.sign({ id: (await crearUsuario({ rol: 'admin' })).id }, process.env.JWT_SECRET)}`;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const registro = (campos = {}) => {
  const datos = {
    razonSocial: 'Empresa Nueva SRL', cuit: '30-71234567-8', email: 'nueva@empresa.com', password: 'ClaveSegura1',
    telefono: '3704555555', localidad: 'Formosa', rubro: 'Comercio', aceptaTerminos: 'true', ...campos,
  };
  let pedido = request(app).post('/api/auth/registro');
  for (const [nombre, valor] of Object.entries(datos)) if (valor !== undefined) pedido = pedido.field(nombre, valor);
  return pedido;
};
const conConstancia = (pedido) => pedido.attach('constancia', PDF, { filename: 'constancia.pdf', contentType: 'application/pdf' });
const seBorro = (publicId, opciones) => vi.waitFor(() => expect(destroy).toHaveBeenCalledWith(publicId, opciones));
// Para afirmar que NO se borró nada: se espera un momento por si el borrado (que no se espera) llegara tarde.
const noSeBorroNada = async () => {
  await new Promise((resolver) => setTimeout(resolver, 50));
  expect(destroy).not.toHaveBeenCalled();
};

describe('registro rechazado por validación: se borra la constancia ya subida', () => {
  it('con una contraseña débil responde 400 y borra la constancia (privada)', async () => {
    const respuesta = await conConstancia(registro({ password: 'debil' }));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject(RECHAZO);
    await seBorro('capymef_constancias/subido', BORRADO_PRIVADO);
    expect(await User.count({ where: { email: 'nueva@empresa.com' } })).toBe(0);
  });

  it('con los términos no aceptados responde 400 y borra la constancia', async () => {
    const respuesta = await conConstancia(registro({ aceptaTerminos: undefined }));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0].campo).toBe('aceptaTerminos');
    await seBorro('capymef_constancias/subido', BORRADO_PRIVADO);
  });

  it.each([
    ['un CUIT inválido', { cuit: 'abc' }],
    ['un teléfono de más de 20 caracteres', { telefono: '1'.repeat(21) }],
    ['una categoría que asigna la Cámara', { categoria: 'padrino' }],
  ])('con %s también borra la constancia', async (_, campos) => {
    expect((await conConstancia(registro(campos))).status).toBe(400);
    await seBorro('capymef_constancias/subido', BORRADO_PRIVADO);
  });

  it('un registro válido NO borra la constancia', async () => {
    const respuesta = await conConstancia(registro());

    expect(respuesta.status).toBe(201);
    await noSeBorroNada();
  });

  it('un registro rechazado sin archivo no llama a destroy', async () => {
    expect((await registro({ password: 'debil' })).status).toBe(400);
    await noSeBorroNada();
  });
});

describe('gasto rechazado por validación: se borra el comprobante ya subido', () => {
  const gasto = (campos) => {
    let pedido = request(app).post('/api/gastos').set('Authorization', tokenAdmin);
    for (const [nombre, valor] of Object.entries(campos)) pedido = pedido.field(nombre, valor);
    return pedido.attach('comprobante', PDF, { filename: 'factura.pdf', contentType: 'application/pdf' });
  };

  it('con un monto inválido responde 400 y borra el comprobante (privado)', async () => {
    const respuesta = await gasto({ fecha: '2026-11-05', concepto: 'Luz', monto: 'abc' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'monto', mensaje: 'El monto debe ser un número mayor a 0, con hasta 2 decimales.' }]);
    await seBorro('capymef_gastos/subido', BORRADO_PRIVADO);
    expect(await Gasto.count()).toBe(0);
  });

  it.each([
    ['fecha inválida', { fecha: '05/11/2026', concepto: 'Luz', monto: '100' }, 'fecha'],
    ['monto 0', { fecha: '2026-11-05', concepto: 'Luz', monto: '0' }, 'monto'],
    ['monto con 3 decimales', { fecha: '2026-11-05', concepto: 'Luz', monto: '10.125' }, 'monto'],
    ['medio de pago inexistente', { fecha: '2026-11-05', concepto: 'Luz', monto: '100', medio_pago: 'Bitcoin' }, 'medio_pago'],
  ])('con %s responde 400 marcando el campo', async (_, campos, campo) => {
    const respuesta = await gasto(campos);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.map((e) => e.campo)).toContain(campo);
  });

  it('un gasto válido se registra y NO borra el comprobante', async () => {
    expect((await gasto({ fecha: '2026-11-05', concepto: 'Luz', monto: '15400.50', medio_pago: 'Efectivo' })).status).toBe(201);
    await noSeBorroNada();
  });
});

describe('noticias y eventos rechazados por validación: se borra la imagen (pública)', () => {
  const imagen = (pedido) => pedido.set('Authorization', tokenAdmin).attach('imagen', PNG, { filename: 'foto.png', contentType: 'image/png' });

  it('una noticia con un título demasiado corto responde 400 y borra la imagen con type upload', async () => {
    const respuesta = await imagen(request(app).post('/api/noticias/admin').field('titulo', 'Hoy').field('contenido', 'Contenido'));

    expect(respuesta.status).toBe(400);
    await seBorro('capymef_noticias/subido', BORRADO_PUBLICO);
  });

  it('un evento con una fecha inválida responde 400 y borra la imagen con type upload', async () => {
    const respuesta = await imagen(request(app).post('/api/eventos/admin').field('titulo', 'Taller de exportación').field('descripcion', 'Desc').field('fecha', 'mañana'));

    expect(respuesta.status).toBe(400);
    await seBorro('capymef_eventos/subido', BORRADO_PUBLICO);
  });

  it('la edición de un evento rechazada por validación también borra la imagen nueva', async () => {
    const evento = await Evento.create({ titulo: 'Taller de exportación', descripcion: 'Desc', fecha: '2099-12-10' });

    const respuesta = await imagen(request(app).put(`/api/eventos/admin/${evento.id}`).field('modalidad', 'mixta'));

    expect(respuesta.status).toBe(400);
    await seBorro('capymef_eventos/subido', BORRADO_PUBLICO);
  });
});

describe('el borrado no cambia la respuesta', () => {
  it('si Cloudinary falla al borrar, la respuesta sigue siendo el mismo 400', async () => {
    destroy.mockRejectedValue(new Error('Cloudinary no responde'));

    const respuesta = await conConstancia(registro({ password: 'debil' }));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject(RECHAZO);
  });

  it('si el borrado mismo lanza un error, la respuesta sigue siendo el mismo 400 (no un 500)', async () => {
    eliminarArchivoDeCloudinary.mockImplementationOnce(() => Promise.reject(new Error('falla inesperada')));

    const respuesta = await conConstancia(registro({ password: 'debil' }));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject(RECHAZO);
  });

  it('no se espera a que termine el borrado para responder (aunque Cloudinary no conteste nunca)', async () => {
    destroy.mockImplementation(() => new Promise(() => {})); // nunca termina

    const respuesta = await conConstancia(registro({ password: 'debil' })).timeout(2000);

    expect(respuesta.status).toBe(400);
  });
});

describe('si multer mismo rechaza el archivo', () => {
  it('un formato no permitido se rechaza antes de subir nada a Cloudinary', async () => {
    const respuesta = await registro().attach('constancia', Buffer.from('MZ ejecutable'), { filename: 'virus.exe', contentType: 'application/octet-stream' });

    expect(respuesta.status).toBe(400);
    expect(upload_stream).not.toHaveBeenCalled();
    await noSeBorroNada();
  });

  it('un archivo de más de 5 MB responde 413, y si llegó a subirse una parte, se borra como privado', async () => {
    const grande = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024 + 10)]);

    const respuesta = await registro().attach('constancia', grande, { filename: 'grande.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(413);
    // La parte que alcanzó a llegar a Cloudinary la borra multer al abortar, y ahora con el tipo authenticated
    // (el borrado de multer-storage-cloudinary no lo indicaba y el archivo privado quedaba huérfano).
    expect(upload_stream).toHaveBeenCalledOnce();
    await seBorro('capymef_constancias/subido', BORRADO_PRIVADO);
    expect(await User.count({ where: { email: 'nueva@empresa.com' } })).toBe(0);
  });
});
