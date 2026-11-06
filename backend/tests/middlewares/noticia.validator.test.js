import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validacionNoticia, validacionActualizarNoticia } from '../../middlewares/validator/noticia.validator.js';
import { CATEGORIAS_NOTICIAS } from '../../config/categoriasNoticias.js';

// Los validadores de noticias se prueban delante de un controlador falso, sin base de datos.
const app = express();
app.use(express.json());
const eco = (req, res) => res.status(200).json({ body: req.body });
app.post('/noticia', validacionNoticia, eco);
app.put('/noticia', validacionActualizarNoticia, eco);

const noticiaValida = { titulo: 'Nueva línea de créditos', contenido: 'El Banco anunció una nueva línea para PyMEs.' };
const crear = (datos) => request(app).post('/noticia').send({ ...noticiaValida, ...datos });
const actualizar = (datos) => request(app).put('/noticia').send(datos);
const campos = (respuesta) => respuesta.body.errores.map((e) => e.campo);

describe('validacionNoticia (crear)', () => {
  it('acepta una noticia con título y contenido', async () => {
    expect((await crear({})).status).toBe(200);
  });

  it('sin título ni contenido responde 400 marcando los dos campos', async () => {
    const respuesta = await request(app).post('/noticia').send({});

    expect(respuesta.status).toBe(400);
    expect(campos(respuesta)).toEqual(expect.arrayContaining(['titulo', 'contenido']));
  });

  it('un contenido con solo espacios cuenta como vacío', async () => {
    expect(campos(await crear({ contenido: '    ' }))).toEqual(['contenido']);
  });

  it('el título tiene que tener entre 5 y 200 caracteres', async () => {
    expect(campos(await crear({ titulo: 'Hoy' }))).toEqual(['titulo']);
    expect(campos(await crear({ titulo: 'x'.repeat(201) }))).toEqual(['titulo']);
  });

  it('el subtítulo no puede superar los 300 caracteres', async () => {
    expect(campos(await crear({ subtitulo: 'x'.repeat(301) }))).toEqual(['subtitulo']);
  });

  it.each(CATEGORIAS_NOTICIAS)('acepta la categoría predefinida "%s"', async (categoria) => {
    expect((await crear({ categoria })).status).toBe(200);
  });

  it('rechaza una categoría que no está en la lista, aunque solo cambie una mayúscula', async () => {
    const respuesta = await crear({ categoria: 'institucional' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0].mensaje).toContain('La categoría no es válida. Opciones: Institucional');
  });

  it('quita los espacios de los costados de la categoría antes de compararla', async () => {
    const respuesta = await crear({ categoria: '  Institucional  ' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.body.categoria).toBe('Institucional');
  });

  it.each(['publico', 'socios', 'todos'])('acepta la visibilidad "%s"', async (visibilidad) => {
    expect((await crear({ visibilidad })).status).toBe(200);
  });

  it('rechaza una visibilidad o un estado fuera de la lista', async () => {
    expect(campos(await crear({ visibilidad: 'privada', estado: 'archivado' }))).toEqual(['visibilidad', 'estado']);
  });
});

describe('validacionActualizarNoticia (editar)', () => {
  it('un body vacío es válido: en la edición todo es opcional', async () => {
    expect((await actualizar({})).status).toBe(200);
  });

  it('el contenido, si se manda, no puede quedar vacío', async () => {
    expect(campos(await actualizar({ contenido: '' }))).toEqual(['contenido']);
  });

  it('aplica las mismas reglas que al crear para título, categoría, visibilidad y estado', async () => {
    const respuesta = await actualizar({ titulo: 'Hoy', categoria: 'Deportes', visibilidad: 'nadie', estado: 'oculto' });

    expect(campos(respuesta)).toEqual(['titulo', 'categoria', 'visibilidad', 'estado']);
  });
});
