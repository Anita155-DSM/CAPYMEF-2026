import '../helpers/entorno.js';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  validacionRegistro,
  validacionLogin,
  validacionActualizarSocio,
  CATEGORIAS_DEL_REGISTRO,
  CATEGORIAS_QUE_ASIGNA_LA_CAMARA,
} from '../../middlewares/validator/user.validator.js';

// Cada validador se monta delante de un controlador falso que devuelve el body ya "limpio": así se ve
// qué deja pasar, qué rechaza y cómo normaliza los datos, sin base de datos.
const app = express();
app.use(express.json());
const eco = (req, res) => res.status(200).json({ body: req.body });
app.post('/registro', validacionRegistro, eco);
app.post('/login', validacionLogin, eco);
app.put('/socio', validacionActualizarSocio, eco);

const registroValido = {
  razonSocial: 'Empresa Formoseña SRL',
  cuit: '20-12345678-9',
  email: 'contacto@empresa.com',
  password: 'ClaveSegura1',
  telefono: '3704123456',
  localidad: 'Formosa',
};

const camposConError = (respuesta) => respuesta.body.errores.map((e) => e.campo);

describe('validacionRegistro', () => {
  it('acepta un registro completo y válido', async () => {
    const respuesta = await request(app).post('/registro').send(registroValido);

    expect(respuesta.status).toBe(200);
  });

  it.each(['razonSocial', 'cuit', 'email', 'password', 'telefono', 'localidad'])('sin %s responde 400 marcando ese campo', async (campo) => {
    const { [campo]: _, ...sinCampo } = registroValido;

    const respuesta = await request(app).post('/registro').send(sinCampo);

    expect(respuesta.status).toBe(400);
    expect(camposConError(respuesta)).toContain(campo);
  });

  it('quita los espacios de los costados y normaliza el email a minúsculas', async () => {
    const respuesta = await request(app)
      .post('/registro')
      .send({ ...registroValido, razonSocial: '  Empresa Formoseña SRL  ', email: '  Contacto@Empresa.COM ' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.body.razonSocial).toBe('Empresa Formoseña SRL');
    expect(respuesta.body.body.email).toBe('contacto@empresa.com');
  });

  it('una razón social de menos de 3 caracteres se rechaza', async () => {
    const respuesta = await request(app).post('/registro').send({ ...registroValido, razonSocial: 'AB' });

    expect(respuesta.body.errores).toEqual([{ campo: 'razonSocial', mensaje: 'La Razón Social debe tener entre 3 y 150 caracteres.' }]);
  });

  it.each(['20-12345678-9', '20123456789'])('acepta el CUIT %s (con o sin guiones)', async (cuit) => {
    const respuesta = await request(app).post('/registro').send({ ...registroValido, cuit });

    expect(respuesta.status).toBe(200);
  });

  it.each(['20-1234-9', 'abc', '2012345678'])('rechaza el CUIT mal formado "%s"', async (cuit) => {
    const respuesta = await request(app).post('/registro').send({ ...registroValido, cuit });

    expect(respuesta.status).toBe(400);
    expect(camposConError(respuesta)).toEqual(['cuit']);
  });

  it('un email sin formato de email se rechaza', async () => {
    const respuesta = await request(app).post('/registro').send({ ...registroValido, email: 'no-es-un-email' });

    expect(camposConError(respuesta)).toEqual(['email']);
  });

  it.each([
    ['menos de 8 caracteres', 'Clave1', 'La contraseña debe tener al menos 8 caracteres.'],
    ['sin números', 'ClaveSegura', 'La contraseña debe contener al menos un número.'],
    ['sin mayúsculas', 'clavesegura1', 'La contraseña debe contener al menos una letra mayúscula.'],
  ])('una contraseña %s se rechaza con un mensaje que explica qué le falta', async (_, password, mensaje) => {
    const respuesta = await request(app).post('/registro').send({ ...registroValido, password });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toContainEqual({ campo: 'password', mensaje });
  });

  it('las categorías que se piden en el registro y las que asigna la Cámara no se superponen', () => {
    expect(CATEGORIAS_DEL_REGISTRO).toEqual(['activo', 'adherente']);
    expect(CATEGORIAS_QUE_ASIGNA_LA_CAMARA).toEqual(['padrino', 'honorario']);
    expect(CATEGORIAS_DEL_REGISTRO.some((c) => CATEGORIAS_QUE_ASIGNA_LA_CAMARA.includes(c))).toBe(false);
  });
});

describe('validacionLogin', () => {
  it('acepta email y contraseña, y normaliza el email', async () => {
    const respuesta = await request(app).post('/login').send({ email: ' Socio@Test.com ', password: 'cualquiera' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.body.email).toBe('socio@test.com');
  });

  it('no exige las reglas de fortaleza de la contraseña (eso es solo al crearla)', async () => {
    const respuesta = await request(app).post('/login').send({ email: 'socio@test.com', password: 'x' });

    expect(respuesta.status).toBe(200);
  });

  it('sin email ni contraseña responde 400 marcando los dos campos', async () => {
    const respuesta = await request(app).post('/login').send({});

    expect(respuesta.status).toBe(400);
    expect(camposConError(respuesta)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('un email inválido se rechaza', async () => {
    const respuesta = await request(app).post('/login').send({ email: 'socio', password: 'x' });

    expect(camposConError(respuesta)).toEqual(['email']);
  });
});

describe('validacionActualizarSocio (edición del admin)', () => {
  it('un body vacío es válido: todos los campos son opcionales', async () => {
    const respuesta = await request(app).put('/socio').send({});

    expect(respuesta.status).toBe(200);
  });

  it.each(['activo', 'adherente', 'padrino', 'honorario'])('el admin puede asignar la categoría %s', async (categoria) => {
    const respuesta = await request(app).put('/socio').send({ categoria });

    expect(respuesta.status).toBe(200);
  });

  it.each([
    ['categoria', 'vitalicio', 'La categoría no es válida.'],
    ['rubro', 'Minería', 'El rubro no es válido.'],
    ['tamano_empresa', 'Gigante', 'El tamaño de empresa no es válido.'],
    ['estado', 'suspendido', 'El estado no es válido.'],
  ])('rechaza un valor fuera de la lista en %s', async (campo, valor, mensaje) => {
    const respuesta = await request(app).put('/socio').send({ [campo]: valor });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo, mensaje }]);
  });

  it.each(['telefono', 'localidad'])('no deja vaciar %s (si se manda, tiene que tener contenido)', async (campo) => {
    const respuesta = await request(app).put('/socio').send({ [campo]: '   ' });

    expect(respuesta.status).toBe(400);
    expect(camposConError(respuesta)).toEqual([campo]);
  });

  it('valida el formato del email y el largo de la razón social si se mandan', async () => {
    const respuesta = await request(app).put('/socio').send({ email: 'mal', razonSocial: 'AB' });

    expect(respuesta.status).toBe(400);
    expect(camposConError(respuesta)).toEqual(expect.arrayContaining(['email', 'razonSocial']));
  });
});
