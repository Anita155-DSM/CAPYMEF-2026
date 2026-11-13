import '../helpers/entorno.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Writable } from 'node:stream';

// Subida a Cloudinary con multer en memoria + upload_stream (reemplazo de multer-storage-cloudinary al pasar a
// Cloudinary 2.x). Lo importante: req.file llega al controlador con los MISMOS campos que antes, un archivo
// rechazado (formato o tamaño) no se sube, y si Cloudinary falla el controlador no corre y la respuesta es un
// 502 claro. Cloudinary es falso: el SDK se reemplaza por uno que anota lo que se le manda.
const { upload_stream, destroy } = vi.hoisted(() => ({ upload_stream: vi.fn(), destroy: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { upload_stream, destroy }, utils: { private_download_url: vi.fn() } } }));

const { uploadConstancia, uploadGasto } = await import('../../middlewares/multer/multerCloudinary.js');
const { uploadNoticia } = await import('../../middlewares/multer/multerNoticias.js');
const { uploadEvento } = await import('../../middlewares/multer/multerEventos.js');
const { ErrorDeSubidaACloudinary, TAMANO_MAXIMO_ARCHIVO } = await import('../../middlewares/multer/subirACloudinary.js');
const { manejadorErrores } = await import('../../middlewares/manejadorErrores.js');

const PDF = Buffer.from('%PDF-1.4 constancia de prueba');
const PNG = Buffer.from('\x89PNG imagen de prueba');
// Los campos que dejaba multer-storage-cloudinary en req.file, en el mismo orden.
const CAMPOS_DE_ANTES = ['fieldname', 'originalname', 'encoding', 'mimetype', 'path', 'size', 'filename'];

let recibido; // lo que Cloudinary "recibió" en la última subida
let controlador;

// Subida falsa que responde como Cloudinary: URL con el tipo de entrega y la carpeta que se le pidieron.
const cloudinaryResponde = () => upload_stream.mockImplementation((opciones, callback) => {
  const partes = [];
  return new Writable({
    write(chunk, _, listo) { partes.push(chunk); listo(); },
    final(listo) {
      listo();
      recibido = Buffer.concat(partes);
      const tipo = opciones.type ?? 'upload';
      const firma = tipo === 'authenticated' ? 's--Firma--/' : '';
      callback(null, {
        secure_url: `https://res.cloudinary.com/demo/image/${tipo}/${firma}v1/${opciones.folder}/subido.pdf`,
        bytes: recibido.length,
        public_id: `${opciones.folder}/subido`,
      });
    },
  });
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  recibido = undefined;
  controlador = vi.fn((req, res) => res.status(201).json({ archivo: req.file ?? null }));
  cloudinaryResponde();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// App mínima: la subida real, un controlador espía y el manejador de errores de la app.
const subirCon = (upload, campo, archivo) => {
  const app = express();
  app.post('/subir', upload.single(campo), controlador);
  app.use(manejadorErrores);
  const pedido = request(app).post('/subir').field('dato', 'algo');
  return archivo ? pedido.attach(campo, archivo.contenido, { filename: archivo.nombre, contentType: archivo.tipo }) : pedido;
};
const pdf = { contenido: PDF, nombre: 'constancia.pdf', tipo: 'application/pdf' };
const png = { contenido: PNG, nombre: 'foto.png', tipo: 'image/png' };

describe('req.file llega al controlador igual que con multer-storage-cloudinary', () => {
  it('constancia: los mismos campos, en el mismo orden, sin el buffer', async () => {
    const respuesta = await subirCon(uploadConstancia, 'constancia', pdf);

    expect(respuesta.status).toBe(201);
    expect(Object.keys(respuesta.body.archivo)).toEqual(CAMPOS_DE_ANTES);
    expect(respuesta.body.archivo).toEqual({
      fieldname: 'constancia',
      originalname: 'constancia.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      path: 'https://res.cloudinary.com/demo/image/authenticated/s--Firma--/v1/capymef_constancias/subido.pdf', // secure_url
      size: PDF.length, // bytes que guardó Cloudinary
      filename: 'capymef_constancias/subido', // public_id
    });
  });

  it('a Cloudinary le llega el archivo entero, tal cual', async () => {
    await subirCon(uploadGasto, 'comprobante', pdf);

    expect(recibido.equals(PDF)).toBe(true);
  });

  it.each([
    ['la constancia', () => uploadConstancia, 'constancia', pdf, { folder: 'capymef_constancias', resource_type: 'auto', type: 'authenticated', allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'] }],
    ['el comprobante de gasto', () => uploadGasto, 'comprobante', pdf, { folder: 'capymef_gastos', resource_type: 'auto', type: 'authenticated', allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'] }],
    ['la imagen de una noticia', () => uploadNoticia, 'imagen', png, { folder: 'capymef_noticias', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }],
    ['la imagen de un evento', () => uploadEvento, 'imagen', png, { folder: 'capymef_eventos', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }],
  ])('%s se sube con las mismas opciones de antes (y nada más)', async (_, upload, campo, archivo, opciones) => {
    await subirCon(upload(), campo, archivo);

    expect(upload_stream).toHaveBeenCalledOnce();
    expect(upload_stream.mock.calls[0][0]).toEqual(opciones);
  });

  it('sin archivo (es opcional en noticias, eventos y gastos) no sube nada y el controlador corre con req.file vacío', async () => {
    const respuesta = await subirCon(uploadNoticia, 'imagen', null);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.archivo).toBeNull();
    expect(upload_stream).not.toHaveBeenCalled();
  });
});

describe('lo que multer rechaza no se sube', () => {
  it('un formato no permitido responde 400 sin llamar a Cloudinary ni al controlador', async () => {
    const respuesta = await subirCon(uploadConstancia, 'constancia', { contenido: Buffer.from('MZ'), nombre: 'virus.exe', tipo: 'application/octet-stream' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/^Formato inválido/);
    expect(upload_stream).not.toHaveBeenCalled();
    expect(controlador).not.toHaveBeenCalled();
  });

  it('un PDF en noticias (solo imágenes) también se rechaza antes de subir', async () => {
    expect((await subirCon(uploadNoticia, 'imagen', pdf)).status).toBe(400);
    expect(upload_stream).not.toHaveBeenCalled();
  });

  it('más de 5 MB responde 413 sin llamar a Cloudinary ni al controlador', async () => {
    const grande = { ...png, contenido: Buffer.alloc(TAMANO_MAXIMO_ARCHIVO + 1) };

    const respuesta = await subirCon(uploadEvento, 'imagen', grande);

    expect(respuesta.status).toBe(413);
    expect(upload_stream).not.toHaveBeenCalled();
    expect(controlador).not.toHaveBeenCalled();
  });

  it('el tope sigue siendo 5 MB', () => {
    expect(TAMANO_MAXIMO_ARCHIVO).toBe(5 * 1024 * 1024);
  });
});

describe('si Cloudinary falla al subir', () => {
  it('responde 502 con un mensaje claro, sin detalles de Cloudinary, y el controlador no corre', async () => {
    upload_stream.mockImplementation((opciones, callback) => new Writable({
      write(chunk, _, listo) { listo(); },
      final(listo) { listo(); callback({ message: 'Invalid Signature abc123. String to sign - folder=capymef', http_code: 401, name: 'Error' }); },
    }));

    const respuesta = await subirCon(uploadConstancia, 'constancia', pdf);

    expect(respuesta.status).toBe(502);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'No se pudo guardar el archivo. Probá de nuevo en unos minutos.' });
    expect(respuesta.text).not.toMatch(/Signature|String to sign|cloudinary/i);
    expect(controlador).not.toHaveBeenCalled();
  });

  it('si el stream mismo da error, también 502 (no se queda colgado)', async () => {
    upload_stream.mockImplementation(() => new Writable({
      write(chunk, _, listo) { listo(new Error('se cortó la conexión')); },
    }));

    const respuesta = await subirCon(uploadNoticia, 'imagen', png).timeout(2000);

    expect(respuesta.status).toBe(502);
    expect(controlador).not.toHaveBeenCalled();
  });

  it('el error que sigue tiene status 502 y la causa, y req.file queda vacío (validarResultado no borra nada)', async () => {
    upload_stream.mockImplementation((opciones, callback) => new Writable({
      write(chunk, _, listo) { listo(); },
      final(listo) { listo(); callback({ message: 'Request Timeout', http_code: 499 }); },
    }));
    let visto;
    const app = express();
    app.post('/subir', uploadGasto.single('comprobante'), controlador);
    app.use((err, req, res, next) => { visto = { err, archivo: req.file }; res.status(err.status).end(); });

    const respuesta = await request(app).post('/subir').attach('comprobante', PDF, { filename: 'f.pdf', contentType: 'application/pdf' });

    expect(respuesta.status).toBe(502);
    expect(visto.err).toBeInstanceOf(ErrorDeSubidaACloudinary);
    expect(visto.err.causa).toEqual({ message: 'Request Timeout', http_code: 499 });
    expect(visto.archivo).toBeUndefined();
    expect(destroy).not.toHaveBeenCalled();
  });
});
