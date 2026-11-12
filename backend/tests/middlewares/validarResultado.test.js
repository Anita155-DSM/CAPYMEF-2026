import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { body } from 'express-validator';
import { validarResultado } from '../../middlewares/validator/validarResultado.js';

// validarResultado es el paso final de todos los validadores (usuario, evento, noticia, tarifa): decide
// si la petición sigue al controlador o se corta con un 400. Acá se prueba con dos reglas inventadas.
const app = express();
app.use(express.json());
app.post(
  '/probar',
  body('nombre').notEmpty().withMessage('El nombre es obligatorio.'),
  body('edad').optional().isInt().withMessage('La edad debe ser un número.'),
  validarResultado,
  (req, res) => res.status(200).json({ llegoAlControlador: true })
);

describe('validarResultado', () => {
  it('si no hay errores deja seguir hasta el controlador', async () => {
    const respuesta = await request(app).post('/probar').send({ nombre: 'Ana', edad: 30 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ llegoAlControlador: true });
  });

  it('si hay un error responde 400 con el formato común de todo el proyecto', async () => {
    const respuesta = await request(app).post('/probar').send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      exito: false,
      mensaje: 'Error de validación en los datos enviados.',
      errores: [{ campo: 'nombre', mensaje: 'El nombre es obligatorio.' }],
    });
  });

  it('informa todos los campos con error a la vez, no solo el primero', async () => {
    const respuesta = await request(app).post('/probar').send({ edad: 'abc' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.map((e) => e.campo)).toEqual(['nombre', 'edad']);
  });

  it('no devuelve el valor que mandó el cliente (solo campo y mensaje)', async () => {
    const respuesta = await request(app).post('/probar').send({ nombre: 'Ana', edad: 'valor-secreto' });

    expect(JSON.stringify(respuesta.body)).not.toContain('valor-secreto');
    expect(Object.keys(respuesta.body.errores[0])).toEqual(['campo', 'mensaje']);
  });
});
