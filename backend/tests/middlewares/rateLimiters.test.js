import '../helpers/entorno.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Los limitadores se crean una sola vez al importar el módulo y guardan los contadores en memoria.
// Para que un test no arrastre los intentos del anterior, antes de cada uno se descarta el módulo
// (vi.resetModules) y se vuelve a importar: así cada test arranca con contadores en cero.
let limitadores;

beforeEach(async () => {
  vi.resetModules();
  limitadores = await import('../../middlewares/rateLimiters.js');
});

// App mínima con los limitadores en el mismo orden que la ruta real y un login falso:
// 401 si la contraseña es "mal", 200 si es "bien". No hay base de datos.
const armarAppLogin = () => {
  const app = express();
  app.use(express.json());
  app.post('/login', limitadores.limitadorLoginPorIp, limitadores.limitadorLoginPorCuenta, (req, res) =>
    req.body?.password === 'bien'
      ? res.status(200).json({ exito: true })
      : res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas.' })
  );
  return app;
};

const intentar = (app, email, password) => request(app).post('/login').send({ email, password });

describe('limitadores de login', () => {
  it('después de 5 fallos del mismo email, el sexto intento responde 429', async () => {
    const app = armarAppLogin();

    for (let i = 0; i < 5; i++) {
      expect((await intentar(app, 'a@test.com', 'mal')).status).toBe(401);
    }
    const sexto = await intentar(app, 'a@test.com', 'mal');

    expect(sexto.status).toBe(429);
    expect(sexto.body).toEqual({ exito: false, mensaje: expect.stringContaining('Demasiados intentos') });
  });

  it('cuenta el email sin distinguir mayúsculas ni espacios', async () => {
    // Si no se normalizara, alguien podría esquivar el límite escribiendo "A@test.com" o "a@test.com ".
    const app = armarAppLogin();
    const variantes = ['a@test.com', 'A@test.com', ' a@test.com', 'a@TEST.com ', 'A@TEST.COM'];

    for (const email of variantes) await intentar(app, email, 'mal');

    expect((await intentar(app, 'a@test.com', 'mal')).status).toBe(429);
  });

  it('con el email A bloqueado, un fallo con el email B desde la misma IP responde 401', async () => {
    // Es el motivo del límite por cuenta: varios socios pueden compartir la IP de una oficina.
    const app = armarAppLogin();
    for (let i = 0; i < 6; i++) await intentar(app, 'a@test.com', 'mal');

    const otroEmail = await intentar(app, 'b@test.com', 'mal');

    expect(otroEmail.status).toBe(401);
  });

  it('10 logins exitosos seguidos nunca responden 429', async () => {
    // Solo cuentan los fallos: entrar y salir varias veces no puede bloquear a nadie.
    const app = armarAppLogin();

    for (let i = 0; i < 10; i++) {
      expect((await intentar(app, 'c@test.com', 'bien')).status).toBe(200);
    }
  });

  it.each([
    ['un objeto', { $ne: null }],
    ['un array', ['a@test.com', 'b@test.com']],
  ])('un email que llega como %s no rompe el limitador', async (_, email) => {
    // El limitador corre antes que las validaciones: el body puede traer cualquier cosa.
    const app = armarAppLogin();

    const respuesta = await intentar(app, email, 'mal');

    expect(respuesta.status).toBe(401);
  });

  it('con muchos emails distintos desde la misma IP, el límite por IP corta en el intento 31', async () => {
    const app = armarAppLogin();

    for (let i = 0; i < 30; i++) {
      expect((await intentar(app, `usuario${i}@test.com`, 'mal')).status).toBe(401);
    }

    expect((await intentar(app, 'otro@test.com', 'mal')).status).toBe(429);
  });
});

describe('limitadorRestablecer', () => {
  it('deja hacer 10 intentos y el 11º responde 429', async () => {
    // Handler falso que siempre rechaza el token, como pasa con un token inventado.
    const app = express();
    app.use(express.json());
    app.put('/restablecer-password/:token', limitadores.limitadorRestablecer, (req, res) =>
      res.status(400).json({ exito: false, mensaje: 'El link de recuperación es inválido o ya venció.' })
    );
    const intentarRestablecer = () =>
      request(app).put('/restablecer-password/tokenfalso').send({ password: 'ClaveValida123' });

    for (let i = 0; i < 10; i++) {
      expect((await intentarRestablecer()).status).toBe(400);
    }
    const undecimo = await intentarRestablecer();

    expect(undecimo.status).toBe(429);
    expect(undecimo.body).toEqual({ exito: false, mensaje: 'Demasiados intentos. Por favor, intentá de nuevo en 15 minutos.' });
  });
});
