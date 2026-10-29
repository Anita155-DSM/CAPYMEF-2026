import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { paramUuid, paramEntero } from '../../middlewares/validarParametros.js';

// Una app mínima con dos routers, igual que en las rutas reales: router.param se ejecuta antes del
// handler, así que si el id tiene un formato inválido el handler (que en la app real consulta la
// base) nunca llega a correr.
const armarRouter = (validador) => {
  const router = express.Router();
  router.param('id', validador);
  // Ruta de texto fijo ANTES que '/:id', como '/pendientes' o '/contador' en las rutas reales.
  router.get('/fija', (req, res) => res.json({ ruta: 'fija' }));
  router.get('/:id', (req, res) => res.json({ id: req.params.id }));
  router.get('/:id/detalle', (req, res) => res.json({ id: req.params.id, detalle: true }));
  return router;
};

const app = express();
app.use('/uuid', armarRouter(paramUuid));
app.use('/entero', armarRouter(paramEntero));

const UUID = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';

// El rechazo siempre tiene el formato de la API y no da pistas de cómo es la base.
const esperarRechazo = (respuesta) => {
  expect(respuesta.status).toBe(400);
  expect(respuesta.body.exito).toBe(false);
  expect(respuesta.body.mensaje).toMatch(/identificador/i);
};

describe('paramUuid', () => {
  it('deja pasar un UUID válido en minúsculas', async () => {
    const respuesta = await request(app).get(`/uuid/${UUID}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.id).toBe(UUID);
  });

  it('deja pasar un UUID válido en MAYÚSCULAS', async () => {
    // Postgres acepta los UUID en cualquier combinación de mayúsculas, así que no hay motivo para rechazarlos.
    const respuesta = await request(app).get(`/uuid/${UUID.toUpperCase()}`);

    expect(respuesta.status).toBe(200);
  });

  it('valida también el id cuando la ruta tiene una subruta', async () => {
    const valido = await request(app).get(`/uuid/${UUID}/detalle`);
    const invalido = await request(app).get('/uuid/abc/detalle');

    expect(valido.status).toBe(200);
    esperarRechazo(invalido);
  });

  it.each([
    ['texto cualquiera', 'abc'],
    ['un número (id de otro tipo)', '999999'],
    ['un UUID truncado', UUID.slice(0, 30)],
    ['un UUID con un carácter inválido', `${UUID.slice(0, -1)}g`],
    ['un UUID con texto extra al final', `${UUID}x`],
    ['un intento de inyección SQL', encodeURIComponent("' OR 1=1--")],
  ])('rechaza con 400 %s', async (_, id) => {
    esperarRechazo(await request(app).get(`/uuid/${id}`));
  });

  it('una ruta de texto fijo declarada antes que /:id sigue respondiendo 200', async () => {
    // router.param solo corre en las rutas que tienen el parámetro: '/fija' no debe validarse como id.
    const respuesta = await request(app).get('/uuid/fija');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.ruta).toBe('fija');
  });
});

describe('paramEntero', () => {
  it.each(['1', '42', '007', '2147483647'])('deja pasar el id "%s"', async (id) => {
    // 2147483647 es el máximo de un INTEGER de Postgres; "007" son solo dígitos y vale 7.
    const respuesta = await request(app).get(`/entero/${id}`);

    expect(respuesta.status).toBe(200);
  });

  it.each([
    ['cero (los ids empiezan en 1)', '0'],
    ['un negativo', '-1'],
    ['un decimal', '1.5'],
    ['texto', 'abc'],
    ['uno más que el máximo de un INTEGER de Postgres', '2147483648'],
    // 10 dígitos pasan el control de formato, pero igual superan el máximo: lo frena la comparación.
    ['un número de 10 dígitos muy superior al máximo', '9999999999'],
    ['tres mil millones (10 dígitos, mayor al máximo)', '3000000000'],
    ['un número de 11 dígitos', '99999999999'],
    ['notación científica', '1e3'],
    ['dígitos seguidos de texto', '12abc'],
  ])('rechaza con 400 %s', async (_, id) => {
    esperarRechazo(await request(app).get(`/entero/${id}`));
  });

  it('una ruta de texto fijo declarada antes que /:id sigue respondiendo 200', async () => {
    const respuesta = await request(app).get('/entero/fija');

    expect(respuesta.status).toBe(200);
  });
});
