import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Noticia } from '../../models/noticia.models.js';
import noticiaRoutes from '../../routes/noticia.routes.js';
import { CATEGORIAS_NOTICIAS } from '../../config/categoriasNoticias.js';
import { reiniciarBase, cerrarBase, crearUsuario, crearNoticia } from '../helpers/baseDeDatos.js';

// Se monta el router real de noticias (con sus middlewares de token, rol y validación) en una
// app mínima, en la misma ruta que en app.js. No se usa app.js porque al importarlo arranca el
// servidor, los crons y se conecta a la base.
const app = express();
app.use(express.json());
app.use('/api/noticias', noticiaRoutes);

let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  await reiniciarBase();
  const admin = await crearUsuario({ rol: 'admin' });
  const socio = await crearUsuario({ rol: 'socio' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await cerrarBase();
});

const titulos = (respuesta) => respuesta.body.data.map((n) => n.titulo);

describe('GET /api/noticias/categorias', () => {
  it('devuelve la lista de categorías predefinidas', async () => {
    const respuesta = await request(app).get('/api/noticias/categorias');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual(CATEGORIAS_NOTICIAS);
  });
});

describe('GET /api/noticias/publicas (landing)', () => {
  it('muestra solo noticias publicadas con visibilidad "publico" o "todos"', async () => {
    await crearNoticia({ titulo: 'Pública', visibilidad: 'publico' });
    await crearNoticia({ titulo: 'Para todos', visibilidad: 'todos' });
    await crearNoticia({ titulo: 'Solo socios', visibilidad: 'socios' });
    await crearNoticia({ titulo: 'Borrador', estado: 'borrador', visibilidad: 'todos' });

    const respuesta = await request(app).get('/api/noticias/publicas');

    expect(respuesta.status).toBe(200);
    // Lo importante es lo que NO aparece: ni borradores ni noticias exclusivas de socios.
    expect(titulos(respuesta).sort()).toEqual(['Para todos', 'Pública']);
  });

  it('ordena de la más reciente a la más vieja', async () => {
    await crearNoticia({ titulo: 'Vieja', fechaPublicacion: new Date('2026-01-01') });
    await crearNoticia({ titulo: 'Nueva', fechaPublicacion: new Date('2026-10-01') });

    const respuesta = await request(app).get('/api/noticias/publicas');

    expect(titulos(respuesta)).toEqual(['Nueva', 'Vieja']);
  });

  it('filtra por categoría cuando se pasa ?categoria=', async () => {
    await crearNoticia({ titulo: 'Institucional', categoria: 'Institucional' });
    await crearNoticia({ titulo: 'Otra cosa', categoria: 'Otras' });

    const respuesta = await request(app).get('/api/noticias/publicas').query({ categoria: 'Institucional' });

    expect(titulos(respuesta)).toEqual(['Institucional']);
  });
});

describe('GET /api/noticias/socios', () => {
  it('responde 401 si no hay sesión iniciada', async () => {
    const respuesta = await request(app).get('/api/noticias/socios');

    expect(respuesta.status).toBe(401);
  });

  it('a un socio logueado le muestra las noticias "socios" y "todos", pero no las solo públicas', async () => {
    await crearNoticia({ titulo: 'Solo socios', visibilidad: 'socios' });
    await crearNoticia({ titulo: 'Para todos', visibilidad: 'todos' });
    await crearNoticia({ titulo: 'Solo landing', visibilidad: 'publico' });

    const respuesta = await request(app).get('/api/noticias/socios').set('Authorization', `Bearer ${tokenSocio}`);

    expect(respuesta.status).toBe(200);
    expect(titulos(respuesta).sort()).toEqual(['Para todos', 'Solo socios']);
  });
});

describe('GET /api/noticias/:id', () => {
  it('un visitante ve una noticia publicada', async () => {
    const noticia = await crearNoticia({ titulo: 'Visible' });

    const respuesta = await request(app).get(`/api/noticias/${noticia.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.titulo).toBe('Visible');
  });

  it('un visitante recibe 404 al pedir un borrador', async () => {
    // 404 y no 403: así no se revela que la noticia existe.
    const borrador = await crearNoticia({ estado: 'borrador' });

    const respuesta = await request(app).get(`/api/noticias/${borrador.id}`);

    expect(respuesta.status).toBe(404);
  });

  it('un visitante recibe 404 al pedir una noticia exclusiva de socios', async () => {
    const exclusiva = await crearNoticia({ visibilidad: 'socios' });

    const respuesta = await request(app).get(`/api/noticias/${exclusiva.id}`);

    expect(respuesta.status).toBe(404);
  });

  it('un admin sí puede ver un borrador (lo necesita para editarlo en el panel)', async () => {
    const borrador = await crearNoticia({ estado: 'borrador' });

    const respuesta = await request(app).get(`/api/noticias/${borrador.id}`).set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
  });

  it('responde 404 si la noticia no existe', async () => {
    const respuesta = await request(app).get('/api/noticias/9999');

    expect(respuesta.status).toBe(404);
  });
});

describe('GET /api/noticias/admin', () => {
  it('a un admin le muestra todas las noticias, incluidos los borradores', async () => {
    await crearNoticia({ titulo: 'Publicada' });
    await crearNoticia({ titulo: 'Borrador', estado: 'borrador' });

    const respuesta = await request(app).get('/api/noticias/admin').set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(titulos(respuesta).sort()).toEqual(['Borrador', 'Publicada']);
  });

  it('a un socio común le responde 403', async () => {
    const respuesta = await request(app).get('/api/noticias/admin').set('Authorization', `Bearer ${tokenSocio}`);

    expect(respuesta.status).toBe(403);
  });
});

describe('POST /api/noticias/admin (crear)', () => {
  it('un admin crea una noticia y se completan los valores por defecto', async () => {
    const respuesta = await request(app)
      .post('/api/noticias/admin')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'Nueva noticia', contenido: 'Texto de la noticia' });

    expect(respuesta.status).toBe(201);
    // Sin categoría, visibilidad ni estado, el controlador asigna estos valores.
    expect(respuesta.body.data).toMatchObject({
      titulo: 'Nueva noticia',
      categoria: 'Otras',
      visibilidad: 'todos',
      estado: 'publicado',
      imagenUrl: null,
    });
    expect(await Noticia.count()).toBe(1);
  });

  it('un socio común no puede crear noticias', async () => {
    const respuesta = await request(app)
      .post('/api/noticias/admin')
      .set('Authorization', `Bearer ${tokenSocio}`)
      .send({ titulo: 'Nueva noticia', contenido: 'Texto' });

    expect(respuesta.status).toBe(403);
    expect(await Noticia.count()).toBe(0);
  });

  it('rechaza con 400 una categoría que no está en la lista y no guarda nada', async () => {
    const respuesta = await request(app)
      .post('/api/noticias/admin')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'Nueva noticia', contenido: 'Texto', categoria: 'Inventada' });

    expect(respuesta.status).toBe(400);
    expect(await Noticia.count()).toBe(0);
  });
});

describe('PUT /api/noticias/admin/:id (actualizar)', () => {
  it('actualiza solo los campos enviados y deja el resto como estaba', async () => {
    const noticia = await crearNoticia({ titulo: 'Título original', contenido: 'Contenido original' });

    const respuesta = await request(app)
      .put(`/api/noticias/admin/${noticia.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'Título corregido' });

    expect(respuesta.status).toBe(200);
    await noticia.reload();
    expect(noticia.titulo).toBe('Título corregido');
    expect(noticia.contenido).toBe('Contenido original');
  });

  it('responde 404 si la noticia no existe', async () => {
    const respuesta = await request(app)
      .put('/api/noticias/admin/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'Título corregido' });

    expect(respuesta.status).toBe(404);
  });
});

describe('DELETE /api/noticias/admin/:id (eliminar)', () => {
  it('hace un borrado lógico: deja de mostrarse pero sigue guardada en la base', async () => {
    // El modelo es "paranoid": destroy() solo completa deletedAt, no borra la fila.
    const noticia = await crearNoticia();

    const respuesta = await request(app)
      .delete(`/api/noticias/admin/${noticia.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(await Noticia.findByPk(noticia.id)).toBeNull();
    const enLaBase = await Noticia.findByPk(noticia.id, { paranoid: false });
    expect(enLaBase.deletedAt).not.toBeNull();
  });
});
