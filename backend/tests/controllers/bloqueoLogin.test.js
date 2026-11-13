import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Bloqueo temporal del login por email: 5 intentos fallidos en 15 minutos bloquean ese email por 15 minutos.
// Se usa el router real de autenticación (con sus limitadores por IP) y solo se simula el reloj (Date).
// Cada pedido sale de una IP distinta: así se prueba el bloqueo POR EMAIL (el que frena a quien ataca una cuenta
// desde muchas IP) sin que el limitador por IP + email de rateLimiters.js se adelante.
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({ uploadConstancia: { single: () => (req, res, next) => next() } }));
vi.mock('../../config/mailer.js', () => ({ enviarMailRecuperacion: vi.fn(async () => {}), enviarMailComprobantePago: vi.fn() }));

const { User } = await import('../../models/user.models.js');
const { Auditoria } = await import('../../models/auditoria.models.js');
const { Notificacion } = await import('../../models/notificacion.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const intentos = await import('../../services/intentosLogin.service.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
app.set('trust proxy', () => true); // la IP sale de X-Forwarded-For (una distinta por pedido)
app.use(express.json());
app.use('/api/auth', authRoutes);

const CLAVE = 'ClaveSegura1';
const EMAIL = 'socio@test.com';
const BLOQUEADO_15 = 'Demasiados intentos fallidos. Probá de nuevo en 15 minutos.';
const INICIO = new Date('2026-11-20T10:00:00-03:00');

let numeroIp = 0;
const ipNueva = () => `10.20.${Math.floor(++numeroIp / 250) % 250}.${numeroIp % 250}`;
const login = (email, password) =>
  request(app).post('/api/auth/login').set('X-Forwarded-For', ipNueva()).set('User-Agent', 'Navegador de prueba').send({ email, password });
const fallar = async (email, veces) => {
  const respuestas = [];
  for (let i = 0; i < veces; i++) respuestas.push(await login(email, 'ClaveIncorrecta9'));
  return respuestas;
};
const avanzar = (milisegundos) => vi.setSystemTime(new Date(Date.now() + milisegundos));
const MINUTO = 60 * 1000;

let admins;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(INICIO);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  intentos.reiniciarIntentosLogin();
  await reiniciarBase();
  await crearUsuario({ email: EMAIL, password: await bcrypt.hash(CLAVE, 4) });
  admins = [await crearUsuario({ rol: 'admin' }), await crearUsuario({ rol: 'admin' })];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

describe('las reglas del bloqueo', () => {
  it('son 5 intentos en 15 minutos y el bloqueo dura 15 minutos', () => {
    expect(intentos.MAXIMO_INTENTOS_FALLIDOS).toBe(5);
    expect(intentos.VENTANA_INTENTOS_MS).toBe(15 * MINUTO);
    expect(intentos.DURACION_BLOQUEO_MS).toBe(15 * MINUTO);
  });
});

describe('login con intentos fallidos', () => {
  it('4 fallidos y el 5° correcto: entra, y el contador se borra (otros 4 fallidos no lo bloquean)', async () => {
    await fallar(EMAIL, 4);

    expect((await login(EMAIL, CLAVE)).status).toBe(200);

    await fallar(EMAIL, 4);
    expect((await login(EMAIL, CLAVE)).status).toBe(200);
  });

  it('5 fallidos: los 5 responden 401 y el 6° responde 429 aunque la contraseña sea correcta', async () => {
    const respuestas = await fallar(EMAIL, 5);

    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
    const sexto = await login(EMAIL, CLAVE);
    expect(sexto.status).toBe(429);
    expect(sexto.body).toEqual({ exito: false, mensaje: BLOQUEADO_15, codigo: 'CUENTA_BLOQUEADA_TEMPORALMENTE' });
    expect(sexto.headers['retry-after']).toBe('900');
    expect(sexto.body.token).toBeUndefined();
  });

  it('mientras está bloqueado no busca la cuenta ni compara la contraseña', async () => {
    await fallar(EMAIL, 5);
    const comparar = vi.spyOn(bcrypt, 'compare');
    const buscar = vi.spyOn(User, 'findOne');

    await login(EMAIL, CLAVE);

    expect(comparar).not.toHaveBeenCalled();
    expect(buscar).not.toHaveBeenCalled();
  });

  it('el mensaje dice cuántos minutos faltan (a los 14 min y 30 s queda 1 minuto)', async () => {
    await fallar(EMAIL, 5);
    avanzar(14 * MINUTO + 30 * 1000);

    const respuesta = await login(EMAIL, CLAVE);

    expect(respuesta.status).toBe(429);
    expect(respuesta.body.mensaje).toBe('Demasiados intentos fallidos. Probá de nuevo en 1 minuto.');
  });

  it('pasados los 15 minutos puede entrar con la contraseña correcta', async () => {
    await fallar(EMAIL, 5);
    avanzar(15 * MINUTO);

    expect((await login(EMAIL, CLAVE)).status).toBe(200);
  });

  it('terminado el bloqueo vuelve a tener sus 5 intentos (no se bloquea al primer error)', async () => {
    await fallar(EMAIL, 5);
    avanzar(15 * MINUTO);

    expect((await fallar(EMAIL, 4)).every((r) => r.status === 401)).toBe(true);
    expect((await login(EMAIL, CLAVE)).status).toBe(200);
  });

  it('intentos espaciados más de 15 minutos no se acumulan', async () => {
    await fallar(EMAIL, 4);
    avanzar(16 * MINUTO);
    await fallar(EMAIL, 4);

    expect((await login(EMAIL, CLAVE)).status).toBe(200);
  });

  it('un email que no existe se bloquea igual y con exactamente la misma respuesta', async () => {
    await fallar(EMAIL, 5);
    await fallar('nadie@test.com', 5);

    const existente = await login(EMAIL, CLAVE);
    const inexistente = await login('nadie@test.com', CLAVE);

    expect(inexistente.status).toBe(429);
    expect(inexistente.body).toEqual(existente.body);
    expect(inexistente.headers['retry-after']).toBe(existente.headers['retry-after']);
  });

  it('antes del bloqueo, email inexistente y contraseña incorrecta siguen dando el mismo 401', async () => {
    const [malaClave] = await fallar(EMAIL, 1);
    const [noExiste] = await fallar('nadie@test.com', 1);

    expect(noExiste.status).toBe(401);
    expect(noExiste.body).toEqual(malaClave.body);
  });

  // Igualar el tiempo: con un email que no existe también se pasa por bcrypt (contra un hash de relleno), para que
  // no responda más rápido que una contraseña incorrecta y no se pueda saber por el tiempo qué emails existen.
  it('con un email inexistente igual compara la contraseña (contra un hash de relleno del mismo costo) y responde el mismo 401', async () => {
    const [malaClave] = await fallar(EMAIL, 1);
    const comparar = vi.spyOn(bcrypt, 'compare');

    const noExiste = await login('nadie@test.com', 'ClaveIncorrecta9');

    expect(comparar).toHaveBeenCalledOnce();
    const [claveRecibida, hashUsado] = comparar.mock.calls[0];
    expect(claveRecibida).toBe('ClaveIncorrecta9');
    expect(hashUsado).toMatch(/^\$2[aby]\$10\$/); // mismo costo (10) que las contraseñas reales
    expect(await comparar.mock.results[0].value).toBe(false);
    expect(noExiste.status).toBe(401);
    expect(noExiste.body).toEqual(malaClave.body);
  });

  it('el intento con un email inexistente sigue sumando: con 4 más queda bloqueado', async () => {
    await fallar('nadie@test.com', 1);
    expect(intentos.consultarBloqueo('nadie@test.com').bloqueado).toBe(false);

    await fallar('nadie@test.com', 4);

    expect(intentos.consultarBloqueo('nadie@test.com').bloqueado).toBe(true);
    expect((await login('nadie@test.com', CLAVE)).status).toBe(429);
  });

  it('mayúsculas y espacios en el email cuentan como el mismo email', async () => {
    for (const variante of ['Socio@Test.com', '  socio@test.com', 'SOCIO@TEST.COM ', 'socio@TEST.com', EMAIL]) {
      await login(variante, 'ClaveIncorrecta9');
    }

    expect((await login(EMAIL, CLAVE)).status).toBe(429);
  });

  it('el bloqueo de un email no afecta a otro', async () => {
    const otro = await crearUsuario({ email: 'otro@test.com', password: await bcrypt.hash(CLAVE, 4) });
    await fallar(EMAIL, 5);

    expect((await login(otro.email, CLAVE)).status).toBe(200);
  });

  it('una cuenta pendiente con la contraseña correcta no suma intentos fallidos (su 403 no cuenta)', async () => {
    await crearUsuario({ email: 'pendiente@test.com', password: await bcrypt.hash(CLAVE, 4), estado: 'pendiente' });

    for (let i = 0; i < 6; i++) expect((await login('pendiente@test.com', CLAVE)).status).toBe(403);
  });
});

describe('restablecer la contraseña desbloquea', () => {
  it('con el email bloqueado, restablecer la contraseña por mail lo desbloquea y entra con la nueva', async () => {
    const tokenPlano = crypto.randomBytes(32).toString('hex');
    await User.update(
      { resetPasswordToken: crypto.createHash('sha256').update(tokenPlano).digest('hex'), resetPasswordExpires: new Date(Date.now() + 60 * MINUTO) },
      { where: { email: EMAIL } }
    );
    await fallar(EMAIL, 5);
    expect((await login(EMAIL, CLAVE)).status).toBe(429);

    const restablecer = await request(app).put(`/api/auth/restablecer-password/${tokenPlano}`).set('X-Forwarded-For', ipNueva()).send({ password: 'ClaveNueva22' });

    expect(restablecer.status).toBe(200);
    expect((await login(EMAIL, 'ClaveNueva22')).status).toBe(200);
  });
});

describe('aviso del bloqueo', () => {
  const registrosDeBloqueo = () => Auditoria.findAll({ where: { codigoTecnico: 'LOGIN_BLOQUEADO' } });
  const avisos = () => Notificacion.findAll({ where: { tipo: 'login_bloqueado' } });

  it('al bloquearse queda en la auditoría con el email y la IP, sin la contraseña', async () => {
    await fallar(EMAIL, 5);

    const [registro] = await registrosDeBloqueo();
    expect(registro).toMatchObject({ modulo: 'AUTH', accionTipo: 'BLOQUEO', usuarioNombre: EMAIL, usuarioRol: 'ANONIMO', usuarioId: null });
    expect(registro.ipAddress).toMatch(/^10\.20\./);
    expect(registro.descripcion).toContain(EMAIL);
    expect(registro.descripcion).toContain(registro.ipAddress);
    expect(registro.userAgent).toBe('Navegador de prueba');
    expect(JSON.stringify(registro.toJSON())).not.toContain('ClaveIncorrecta9');
  });

  it('avisa a cada admin una sola vez, aunque sigan llegando intentos durante el bloqueo', async () => {
    await fallar(EMAIL, 5);
    await fallar(EMAIL, 3); // ya bloqueado: responden 429 y no vuelven a avisar
    await login(EMAIL, CLAVE);

    expect(await registrosDeBloqueo()).toHaveLength(1);
    const notificaciones = await avisos();
    expect(notificaciones.map((n) => n.usuario_id).sort()).toEqual(admins.map((a) => a.id).sort());
    expect(notificaciones[0].titulo).toBe('Inicio de sesión bloqueado por intentos fallidos');
    expect(notificaciones[0].mensaje).toContain(EMAIL);
  });

  it('un bloqueo nuevo del mismo email (en otra ventana) vuelve a avisar', async () => {
    await fallar(EMAIL, 5);
    avanzar(15 * MINUTO);
    await fallar(EMAIL, 5);

    expect(await registrosDeBloqueo()).toHaveLength(2);
    expect(await avisos()).toHaveLength(2 * admins.length);
  });

  it('el bloqueo de un email que no existe también se audita y se avisa', async () => {
    await fallar('nadie@test.com', 5);

    expect((await registrosDeBloqueo())[0].usuarioNombre).toBe('nadie@test.com');
    expect(await avisos()).toHaveLength(admins.length);
  });

  it('si la auditoría falla, el bloqueo igual queda hecho', async () => {
    vi.spyOn(Auditoria, 'create').mockRejectedValue(new Error('base caída'));

    await fallar(EMAIL, 5);

    expect((await login(EMAIL, CLAVE)).status).toBe(429);
  });
});

describe('intentosLogin.service: normalización y memoria', () => {
  it('normaliza el email (minúsculas, sin espacios) en el propio servicio', () => {
    for (let i = 0; i < 5; i++) intentos.registrarIntentoFallido('  Alguien@Ejemplo.COM ');

    expect(intentos.consultarBloqueo('alguien@ejemplo.com').bloqueado).toBe(true);
  });

  it('borra las entradas vencidas para que el Map no crezca sin límite', () => {
    intentos.registrarIntentoFallido('uno@test.com');
    intentos.registrarIntentoFallido('dos@test.com');
    expect(intentos.cantidadEmailsEnMemoria()).toBe(2);

    avanzar(16 * MINUTO);
    intentos.limpiarVencidos();

    expect(intentos.cantidadEmailsEnMemoria()).toBe(0);
  });

  it('un bloqueo vigente no se borra en la limpieza', () => {
    for (let i = 0; i < 5; i++) intentos.registrarIntentoFallido('bloqueado@test.com');
    avanzar(10 * MINUTO);

    intentos.limpiarVencidos();

    expect(intentos.consultarBloqueo('bloqueado@test.com').bloqueado).toBe(true);
  });

  it('con el tope de emails lleno, inundar con emails inventados no levanta un bloqueo vigente', () => {
    for (let i = 0; i < 5; i++) intentos.registrarIntentoFallido('victima@test.com');

    for (let i = 0; i <= intentos.MAXIMO_EMAILS_EN_MEMORIA; i++) intentos.registrarIntentoFallido(`inventado${i}@test.com`);

    expect(intentos.cantidadEmailsEnMemoria()).toBeLessThanOrEqual(intentos.MAXIMO_EMAILS_EN_MEMORIA + 1);
    expect(intentos.consultarBloqueo('victima@test.com').bloqueado).toBe(true);
  });
});
