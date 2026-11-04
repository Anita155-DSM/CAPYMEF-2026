import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.models.js';
import { verificarToken, verificarTokenOpcional } from '../../middlewares/authMiddleware.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Una app mínima solo con el middleware y una ruta que devuelve req.usuario. Así se prueba
// el middleware a través de HTTP (como en el repo de práctica) sin cargar toda la app.
const app = express();
app.get('/protegida', verificarToken, (req, res) => res.json({ usuario: req.usuario }));
app.get('/opcional', verificarTokenOpcional, (req, res) => res.json({ usuario: req.usuario ?? null }));

const firmar = (datos, opciones = { expiresIn: '1h' }) => jwt.sign(datos, process.env.JWT_SECRET, opciones);

beforeEach(async () => {
  await reiniciarBase();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

describe('verificarToken', () => {
  it('responde 401 si no se envía token', async () => {
    const respuesta = await request(app).get('/protegida');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.exito).toBe(false);
  });

  it('responde 403 si el token está firmado con otra clave', async () => {
    // Un token falsificado (firmado sin conocer nuestra clave) no puede pasar.
    const tokenFalso = jwt.sign({ id: 1 }, 'otra-clave');

    const respuesta = await request(app).get('/protegida').set('Authorization', `Bearer ${tokenFalso}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe('Token inválido o expirado.');
  });

  it('responde 403 si el token ya venció', async () => {
    const usuario = await crearUsuario();
    // "exp" en el pasado: el token fue válido, pero ya no.
    const tokenVencido = firmar({ id: usuario.id, exp: Math.floor(Date.now() / 1000) - 60 }, {});

    const respuesta = await request(app).get('/protegida').set('Authorization', `Bearer ${tokenVencido}`);

    expect(respuesta.status).toBe(403);
  });

  it('deja pasar a un usuario aprobado y adjunta sus datos en req.usuario', async () => {
    const usuario = await crearUsuario({ categoria: 'activo' });

    const respuesta = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${firmar({ id: usuario.id })}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toMatchObject({ id: usuario.id, rol: 'socio', categoria: 'activo' });
  });

  it('toma rol y categoría de la base y no del token', async () => {
    // Si alguien tuviera un token viejo que dice "admin" (o una categoría que ya cambió por mora),
    // manda lo que está guardado en la base ahora.
    const usuario = await crearUsuario({ rol: 'socio', categoria: 'adherente' });
    const token = firmar({ id: usuario.id, rol: 'admin', categoria: 'activo' });

    const respuesta = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

    expect(respuesta.body.usuario.rol).toBe('socio');
    expect(respuesta.body.usuario.categoria).toBe('adherente');
  });

  it('responde 403 si la cuenta fue dada de baja aunque el token siga vigente', async () => {
    // Es el motivo por el que el middleware consulta la base: un token válido no alcanza.
    const usuario = await crearUsuario({ estado: 'inactivo' });

    const respuesta = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${firmar({ id: usuario.id })}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe('Tu cuenta no está habilitada.');
  });

  it('responde 403 si el usuario del token ya no existe', async () => {
    const respuesta = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${firmar({ id: 9999 })}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe('La cuenta ya no existe.');
  });

  it('responde 500 (y no 403) si falla la base de datos', async () => {
    // Un corte de la base es un problema nuestro: no debe tratarse como "token inválido"
    // ni cerrarle la sesión al usuario. Simulamos la falla con un espía de Vitest.
    vi.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('corte de conexión'));
    vi.spyOn(console, 'error').mockImplementation(() => {}); // evita ensuciar la salida

    const respuesta = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${firmar({ id: 1 })}`);

    expect(respuesta.status).toBe(500);
  });
});

describe('verificarTokenOpcional', () => {
  it('sin token deja pasar como visitante anónimo', async () => {
    const respuesta = await request(app).get('/opcional');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toBeNull();
  });

  it('con un token inválido no bloquea: sigue como visitante anónimo', async () => {
    // A diferencia de verificarToken, acá nunca se responde 401/403: la ruta es pública.
    const respuesta = await request(app).get('/opcional').set('Authorization', 'Bearer cualquier-cosa');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toBeNull();
  });

  it('con un token válido de una cuenta aprobada adjunta req.usuario', async () => {
    const usuario = await crearUsuario({ rol: 'admin' });

    const respuesta = await request(app)
      .get('/opcional')
      .set('Authorization', `Bearer ${firmar({ id: usuario.id })}`);

    expect(respuesta.body.usuario).toMatchObject({ id: usuario.id, rol: 'admin' });
  });

  it('con el token de una cuenta inactiva sigue como anónimo', async () => {
    // Una cuenta dada de baja no debe ver la información extra de los usuarios logueados.
    const usuario = await crearUsuario({ rol: 'admin', estado: 'inactivo' });

    const respuesta = await request(app)
      .get('/opcional')
      .set('Authorization', `Bearer ${firmar({ id: usuario.id })}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toBeNull();
  });
});

describe('verificarToken después de un cambio de contraseña', () => {
  // "iat" es el momento en que se emitió el token, en segundos. Se fija a mano para controlar
  // exactamente si el token es anterior, posterior o del mismo segundo que el cambio de contraseña.
  const iat = Math.floor(Date.now() / 1000) - 120; // emitido hace 2 minutos
  const tokenEmitidoEn = (id) => firmar({ id, iat });
  const pedirCon = (token) => request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

  it('deja pasar el token si la contraseña nunca se cambió', async () => {
    const usuario = await crearUsuario({ passwordChangedAt: null });

    const respuesta = await pedirCon(tokenEmitidoEn(usuario.id));

    expect(respuesta.status).toBe(200);
  });

  it('responde 403 si la contraseña se cambió después de emitido el token', async () => {
    // Es el caso de una sesión robada: el dueño restablece la clave y el token viejo deja de servir.
    const usuario = await crearUsuario({ passwordChangedAt: new Date((iat + 60) * 1000) });

    const respuesta = await pedirCon(tokenEmitidoEn(usuario.id));

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toContain('Iniciá sesión');
  });

  it('deja pasar un token emitido después del cambio de contraseña', async () => {
    // Por ejemplo, el login que el socio hace con su clave nueva.
    const usuario = await crearUsuario({ passwordChangedAt: new Date((iat - 60) * 1000) });

    const respuesta = await pedirCon(tokenEmitidoEn(usuario.id));

    expect(respuesta.status).toBe(200);
  });

  it('deja pasar un token emitido en el mismo segundo del cambio', async () => {
    // "iat" no tiene milisegundos: si el cambio fue a los 500 ms de ese segundo, el login que sigue
    // al restablecimiento queda con el mismo iat y no debe rechazarse.
    const usuario = await crearUsuario({ passwordChangedAt: new Date(iat * 1000 + 500) });

    const respuesta = await pedirCon(tokenEmitidoEn(usuario.id));

    expect(respuesta.status).toBe(200);
  });
});
