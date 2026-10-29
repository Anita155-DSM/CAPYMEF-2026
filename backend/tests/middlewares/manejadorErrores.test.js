import '../helpers/entorno.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import multer from 'multer';
import { rutaNoEncontrada, manejadorErrores } from '../../middlewares/manejadorErrores.js';

// Una app mínima con una ruta por cada tipo de error y, al final, los dos middlewares en el mismo
// orden que en app.js. Así se prueba la respuesta que recibe el cliente sin cargar toda la app.
const app = express();
// Límite chico para no tener que mandar megas en el test del cuerpo demasiado grande.
app.use(express.json({ limit: '1kb' }));

app.post('/json', (req, res) => res.json({ recibido: req.body }));
app.get('/cors', () => { throw new Error('Bloqueado por CORS'); });
app.get('/formato', () => {
  throw new Error('Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP.');
});
app.get('/archivo-grande', () => { throw new multer.MulterError('LIMIT_FILE_SIZE'); });
app.get('/con-status-404', () => {
  const error = new Error('detalle interno que no debe salir');
  error.status = 404;
  throw error;
});
app.get('/inesperado', () => {
  throw new Error('relation "users" does not exist en C:\\Users\\servidor\\app.js');
});

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

// La respuesta nunca debe mostrar cómo está armado el servidor.
const esperarSinDetallesInternos = (respuesta) => {
  expect(respuesta.headers['content-type']).toMatch(/application\/json/);
  expect(respuesta.text).not.toMatch(/stack/i);
  expect(respuesta.text).not.toMatch(/at /);
  expect(respuesta.text).not.toMatch(/[A-Za-z]:\\|\/[\w.-]+\/[\w.-]+\.js|node_modules/);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('manejadorErrores', () => {
  it('un JSON mal formado responde 400 y lo explica', async () => {
    const respuesta = await request(app)
      .post('/json')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({ exito: false, mensaje: expect.stringContaining('no es un JSON válido') });
    esperarSinDetallesInternos(respuesta);
  });

  it('un cuerpo mayor al límite responde 413', async () => {
    const respuesta = await request(app)
      .post('/json')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ relleno: 'A'.repeat(2048) }));

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.exito).toBe(false);
    esperarSinDetallesInternos(respuesta);
  });

  it('un origen rechazado por CORS responde 403', async () => {
    const respuesta = await request(app).get('/cors');

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.exito).toBe(false);
  });

  it('un archivo con formato no permitido responde 400 con el mismo mensaje', async () => {
    // Esos mensajes ya están escritos para el usuario, así que se le muestran tal cual.
    const respuesta = await request(app).get('/formato');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP.');
  });

  it('un archivo que supera el tamaño de multer responde 413', async () => {
    const respuesta = await request(app).get('/archivo-grande');

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.exito).toBe(false);
  });

  it('un error con status 4xx responde ese código con un mensaje genérico', async () => {
    const respuesta = await request(app).get('/con-status-404');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Petición inválida.' });
  });

  it('un error inesperado responde 500 genérico, sin stack ni rutas de archivos', async () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {}); // el detalle va solo al log

    const respuesta = await request(app).get('/inesperado');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error interno del servidor.' });
    expect(respuesta.text).not.toMatch(/relation|users/);
    esperarSinDetallesInternos(respuesta);
    expect(espia).toHaveBeenCalled();
  });
});

describe('rutaNoEncontrada', () => {
  it('una URL inexistente responde 404 en formato JSON', async () => {
    const respuesta = await request(app).get('/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Ruta no encontrada.' });
  });
});
