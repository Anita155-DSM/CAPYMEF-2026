import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Notificacion } from '../../models/notificacion.models.js';
import notificacionRoutes from '../../routes/notificacion.routes.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Router real de notificaciones en una app mínima, como en app.js.
const app = express();
app.use(express.json());
app.use('/api/notificaciones', notificacionRoutes);

let yo;
let otro;
let token;

beforeEach(async () => {
  await reiniciarBase();
  yo = await crearUsuario();
  otro = await crearUsuario();
  token = jwt.sign({ id: yo.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

let numero = 0;
const notificacion = (usuario, datos = {}) =>
  Notificacion.create({ usuario_id: usuario.id, tipo: 'cuota_nueva', titulo: `Aviso ${++numero}`, mensaje: 'Mensaje', ...datos });
const conToken = (req) => req.set('Authorization', `Bearer ${token}`);
const listar = (query = '') => conToken(request(app).get(`/api/notificaciones${query}`));

describe('acceso', () => {
  it('sin token responde 401', async () => {
    expect((await request(app).get('/api/notificaciones')).status).toBe(401);
  });

  it('un socio común puede ver sus notificaciones (no hace falta ser admin)', async () => {
    expect((await listar()).status).toBe(200);
  });
});

describe('GET /api/notificaciones', () => {
  it('devuelve solo las notificaciones del dueño del token, nunca las de otro usuario', async () => {
    await notificacion(yo, { titulo: 'Mía' });
    await notificacion(otro, { titulo: 'De otro' });

    const respuesta = await listar();

    expect(respuesta.body.data.map((n) => n.titulo)).toEqual(['Mía']);
    expect(respuesta.body.total).toBe(1);
  });

  it('un ?usuario_id en la URL no permite ver las de otro (el usuario sale siempre del token)', async () => {
    await notificacion(otro, { titulo: 'De otro' });

    expect((await listar(`?usuario_id=${otro.id}`)).body.data).toEqual([]);
  });

  it('ordena de la más nueva a la más vieja', async () => {
    const vieja = await notificacion(yo, { titulo: 'Vieja' });
    await Notificacion.sequelize.query('UPDATE notificaciones SET createdAt = :fecha WHERE id = :id', {
      replacements: { fecha: '2020-01-01 00:00:00.000 +00:00', id: vieja.id },
    });
    await notificacion(yo, { titulo: 'Nueva' });

    expect((await listar()).body.data.map((n) => n.titulo)).toEqual(['Nueva', 'Vieja']);
  });

  it('informa cuántas hay sin leer, aunque se pidan solo algunas por página', async () => {
    await notificacion(yo);
    await notificacion(yo);
    await notificacion(yo, { leida: true });

    const respuesta = await listar('?limit=1');

    expect(respuesta.body).toMatchObject({ total: 3, noLeidas: 2, totalPaginas: 3, paginaActual: 1 });
    expect(respuesta.body.data).toHaveLength(1);
  });

  it('con ?soloNoLeidas=true trae solo las no leídas', async () => {
    await notificacion(yo, { titulo: 'Sin leer' });
    await notificacion(yo, { titulo: 'Leída', leida: true });

    expect((await listar('?soloNoLeidas=true')).body.data.map((n) => n.titulo)).toEqual(['Sin leer']);
  });

  it('pagina con page y limit', async () => {
    for (let i = 0; i < 5; i++) await notificacion(yo);

    const respuesta = await listar('?page=3&limit=2');

    expect(respuesta.body.paginaActual).toBe(3);
    expect(respuesta.body.data).toHaveLength(1);
  });

  it('un page o limit inválido usa el valor por defecto y el límite no pasa de 100', async () => {
    await notificacion(yo);

    expect((await listar('?page=abc&limit=xyz')).body.paginaActual).toBe(1);
    expect((await listar('?limit=5000')).status).toBe(200);
  });

  it('cada notificación trae solo los campos que usa la campanita (sin datos internos como la referencia)', async () => {
    await notificacion(yo, { referencia: 'cuota-nueva:123', enlace: '/socios/pagos' });

    const [aviso] = (await listar()).body.data;

    expect(Object.keys(aviso).sort()).toEqual(['createdAt', 'enlace', 'id', 'leida', 'leidaAt', 'mensaje', 'tipo', 'titulo']);
  });
});

describe('GET /api/notificaciones/contador', () => {
  it('devuelve cuántas notificaciones propias hay sin leer', async () => {
    await notificacion(yo);
    await notificacion(yo, { leida: true });
    await notificacion(otro);

    const respuesta = await conToken(request(app).get('/api/notificaciones/contador'));

    expect(respuesta.body).toEqual({ exito: true, noLeidas: 1 });
  });
});

describe('PUT /api/notificaciones/:id/leer', () => {
  const leer = (id) => conToken(request(app).put(`/api/notificaciones/${id}/leer`));

  it('marca como leída una notificación propia y guarda cuándo', async () => {
    const aviso = await notificacion(yo);

    const respuesta = await leer(aviso.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.leida).toBe(true);
    await aviso.reload();
    expect(aviso.leida).toBe(true);
    expect(aviso.leidaAt).toBeInstanceOf(Date);
  });

  it('marcarla de nuevo no cambia la fecha en que se leyó por primera vez', async () => {
    const aviso = await notificacion(yo);
    await leer(aviso.id);
    const primeraLectura = (await aviso.reload()).leidaAt.getTime();

    await new Promise((resolver) => setTimeout(resolver, 10));
    await leer(aviso.id);

    expect((await aviso.reload()).leidaAt.getTime()).toBe(primeraLectura);
  });

  it('la notificación de otro usuario responde 404 (sin confirmar que existe) y no se marca', async () => {
    const ajena = await notificacion(otro);

    const respuesta = await leer(ajena.id);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('Notificación no encontrada.');
    expect((await ajena.reload()).leida).toBe(false);
  });

  it('un id que no es UUID responde 400', async () => {
    expect((await leer('abc')).status).toBe(400);
  });
});

describe('PUT /api/notificaciones/leer-todas', () => {
  it('marca como leídas todas las propias e informa cuántas cambió', async () => {
    await notificacion(yo);
    await notificacion(yo);
    await notificacion(yo, { leida: true });

    const respuesta = await conToken(request(app).put('/api/notificaciones/leer-todas'));

    expect(respuesta.body).toMatchObject({ exito: true, actualizadas: 2, mensaje: '2 notificación(es) marcada(s) como leída(s).' });
    expect(await Notificacion.count({ where: { usuario_id: yo.id, leida: false } })).toBe(0);
  });

  it('no toca las notificaciones de otros usuarios', async () => {
    await notificacion(otro);

    await conToken(request(app).put('/api/notificaciones/leer-todas'));

    expect(await Notificacion.count({ where: { usuario_id: otro.id, leida: false } })).toBe(1);
  });
});
