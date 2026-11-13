import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Nada sale a internet: la subida de la constancia a Cloudinary y el mail de recuperación son falsos.
// El router de autenticación, los validadores, los limitadores, el controlador y la base (SQLite) son reales.
// La subida falsa pone un archivo en req.file, salvo que la petición traiga el encabezado "x-sin-archivo".
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({
  uploadConstancia: {
    single: () => (req, res, next) => {
      if (!req.headers['x-sin-archivo']) {
        req.file = { path: 'https://res.cloudinary.com/demo/raw/upload/constancia.pdf', filename: 'constancia' };
      }
      next();
    },
  },
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailRecuperacion: vi.fn(async () => {}), enviarMailComprobantePago: vi.fn() }));
// Si el registro no se completa, la constancia subida se borra de Cloudinary: ese borrado también es falso.
vi.mock('../../services/cloudinary.service.js', async (importOriginal) => ({ ...(await importOriginal()), eliminarArchivoDeCloudinary: vi.fn() }));

const { enviarMailRecuperacion } = await import('../../config/mailer.js');
const { User } = await import('../../models/user.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
// Los limitadores (login, recuperación) cuentan por IP y guardan los contadores en memoria. Para que un
// test no herede los intentos de otro, cada uno usa una IP distinta vía X-Forwarded-For. Se confía en el
// encabezado con una función (y no con `true`) porque express-rate-limit advierte si se pone `true`.
app.set('trust proxy', () => true);
app.use(express.json());
app.use('/api/auth', authRoutes);

let ipActual = 0;
let ip;
const CLAVE = 'ClaveSegura1';

beforeEach(async () => {
  ip = `10.0.${Math.floor(++ipActual / 250)}.${ipActual % 250}`;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
});

afterEach(() => {
  vi.restoreAllMocks();
  enviarMailRecuperacion.mockReset();
  enviarMailRecuperacion.mockResolvedValue();
});

afterAll(async () => {
  await cerrarBase();
});

const post = (ruta) => request(app).post(`/api/auth${ruta}`).set('X-Forwarded-For', ip);
const put = (ruta) => request(app).put(`/api/auth${ruta}`).set('X-Forwarded-For', ip);
const get = (ruta) => request(app).get(`/api/auth${ruta}`).set('X-Forwarded-For', ip);

// Un usuario con la contraseña hasheada de verdad, como la deja el registro.
const crearConClave = async (datos = {}) => crearUsuario({ password: await bcrypt.hash(CLAVE, 4), ...datos });
const tokenDe = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);

// ==========================================
// REGISTRO
// ==========================================
describe('POST /api/auth/registro', () => {
  const solicitud = {
    razonSocial: 'Empresa Nueva SRL',
    cuit: '30-71234567-8',
    email: 'nueva@empresa.com',
    password: CLAVE,
    telefono: '3704555555',
    localidad: 'Clorinda',
    rubro: 'Industria',
    actividad: 'Metalúrgica',
    tamano_empresa: 'Pequena',
    categoria: 'activo',
    aceptaTerminos: true, // aceptación de los términos (obligatoria en los tests, ver config/terminos.js)
  };

  it('crea la solicitud: 201, queda pendiente de aprobación y con rol socio', async () => {
    const respuesta = await post('/registro').send(solicitud);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.mensaje).toBe('Solicitud enviada correctamente. Queda pendiente de revisión por la administración.');
    expect(respuesta.body.data).toMatchObject({ razonSocial: 'Empresa Nueva SRL', email: 'nueva@empresa.com', categoria: 'activo', estado: 'pendiente' });
    const guardado = await User.findOne({ where: { email: 'nueva@empresa.com' } });
    expect(guardado.rol).toBe('socio');
    expect(guardado.localidad).toBe('Clorinda');
    expect(guardado.tamano_empresa).toBe('Pequena');
  });

  it('guarda la contraseña hasheada, nunca en texto plano', async () => {
    await post('/registro').send(solicitud);

    const guardado = await User.findOne({ where: { email: 'nueva@empresa.com' } });
    expect(guardado.password).not.toBe(CLAVE);
    expect(await bcrypt.compare(CLAVE, guardado.password)).toBe(true);
  });

  it('guarda la URL de la constancia de AFIP/DGR subida', async () => {
    await post('/registro').send(solicitud);

    const guardado = await User.findOne({ where: { email: 'nueva@empresa.com' } });
    expect(guardado.constanciaUrl).toBe('https://res.cloudinary.com/demo/raw/upload/constancia.pdf');
  });

  it('la respuesta no devuelve la contraseña', async () => {
    const respuesta = await post('/registro').send(solicitud);

    expect(JSON.stringify(respuesta.body)).not.toContain('password');
  });

  it('aunque el formulario mande rol "admin" o estado "aprobado", la cuenta queda como socio pendiente', async () => {
    await post('/registro').send({ ...solicitud, rol: 'admin', estado: 'aprobado' });

    const guardado = await User.findOne({ where: { email: 'nueva@empresa.com' } });
    expect(guardado.rol).toBe('socio');
    expect(guardado.estado).toBe('pendiente');
  });

  it('sin la constancia adjunta responde 400 y no crea la cuenta', async () => {
    const respuesta = await post('/registro').set('x-sin-archivo', '1').send(solicitud);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Debe adjuntar el archivo comprobante de AFIP/DGR.');
    expect(await User.count()).toBe(0);
  });

  it('con un email ya registrado responde 400 diciendo que el email existe', async () => {
    await crearUsuario({ email: 'nueva@empresa.com' });

    const respuesta = await post('/registro').send(solicitud);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('El correo electrónico ya se encuentra registrado.');
  });

  it('con un CUIT ya registrado responde 400 diciendo que el CUIT existe', async () => {
    await crearUsuario({ cuit: '30-71234567-8' });

    const respuesta = await post('/registro').send(solicitud);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('El CUIT ingresado ya se encuentra registrado.');
  });

  it('si falla la base responde 500 con un mensaje genérico (sin detalles internos)', async () => {
    vi.spyOn(User, 'create').mockRejectedValue(new Error('column "x" does not exist'));

    const respuesta = await post('/registro').send(solicitud);

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error interno del servidor.' });
  });
});

// ==========================================
// LOGIN
// ==========================================
describe('POST /api/auth/login', () => {
  it('con credenciales correctas devuelve un token válido por 8 horas y los datos públicos del usuario', async () => {
    const usuario = await crearConClave({ email: 'socio@test.com', categoria: 'activo' });

    const respuesta = await post('/login').send({ email: 'socio@test.com', password: CLAVE });

    expect(respuesta.status).toBe(200);
    const datosToken = jwt.verify(respuesta.body.token, process.env.JWT_SECRET);
    expect(datosToken).toMatchObject({ id: usuario.id, rol: 'socio', estado: 'aprobado', categoria: 'activo' });
    expect(datosToken.exp - datosToken.iat).toBe(8 * 60 * 60);
    expect(respuesta.body.usuario).toMatchObject({ id: usuario.id, email: 'socio@test.com', rol: 'socio' });
  });

  it('la respuesta nunca incluye la contraseña ni datos de recuperación', async () => {
    await crearConClave({ email: 'socio@test.com' });

    const respuesta = await post('/login').send({ email: 'socio@test.com', password: CLAVE });

    expect(Object.keys(respuesta.body.usuario)).not.toEqual(expect.arrayContaining(['password']));
    expect(JSON.stringify(respuesta.body)).not.toMatch(/password|resetPassword/);
  });

  it('acepta el email con mayúsculas o espacios (el validador lo normaliza)', async () => {
    await crearConClave({ email: 'socio@test.com' });

    expect((await post('/login').send({ email: '  Socio@Test.com ', password: CLAVE })).status).toBe(200);
  });

  it('contraseña incorrecta y email inexistente dan el MISMO 401 (no se revela qué emails existen)', async () => {
    await crearConClave({ email: 'socio@test.com' });

    const claveMal = await post('/login').send({ email: 'socio@test.com', password: 'OtraClave9' });
    const noExiste = await post('/login').send({ email: 'nadie@test.com', password: CLAVE });

    expect(claveMal.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(claveMal.body).toEqual(noExiste.body);
    expect(claveMal.body.mensaje).toBe('Credenciales inválidas (usuario o contraseña incorrectos).');
  });

  it.each([
    ['pendiente', 'Tu solicitud de registro está siendo revisada por la administración de CAPYMEF.'],
    ['rechazado', 'Tu solicitud de registro fue rechazada. Ponete en contacto con la administración.'],
    ['inactivo', 'Tu cuenta se encuentra inactiva. Ponete en contacto con la administración.'],
  ])('una cuenta %s no puede entrar aunque la contraseña sea correcta: 403 con un mensaje claro', async (estado, mensaje) => {
    await crearConClave({ email: 'socio@test.com', estado });

    const respuesta = await post('/login').send({ email: 'socio@test.com', password: CLAVE });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe(mensaje);
    expect(respuesta.body.token).toBeUndefined();
  });

  it('la cuenta de un estado desconocido (cargado a mano en la base) tampoco entra', async () => {
    const usuario = await crearConClave({ email: 'socio@test.com' });
    // Se fuerza un valor fuera del ENUM sin pasar por las validaciones del modelo.
    await User.sequelize.query('UPDATE Users SET estado = :estado WHERE id = :id', { replacements: { estado: 'suspendido', id: usuario.id } });

    const respuesta = await post('/login').send({ email: 'socio@test.com', password: CLAVE });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe('Tu cuenta no está habilitada para iniciar sesión.');
  });

  it('sin email o sin contraseña lo corta el validador con 400', async () => {
    expect((await post('/login').send({ email: 'socio@test.com' })).status).toBe(400);
  });
});

// ==========================================
// PERFIL
// ==========================================
describe('GET /api/auth/perfil', () => {
  it('devuelve los datos del usuario del token, sin contraseña ni token de recuperación', async () => {
    const usuario = await crearUsuario({ resetPasswordToken: 'hash-secreto', resetPasswordExpires: new Date() });

    const respuesta = await get('/perfil').set('Authorization', `Bearer ${tokenDe(usuario)}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toMatchObject({ id: usuario.id, email: usuario.email });
    expect(respuesta.body.data).not.toHaveProperty('password');
    expect(respuesta.body.data).not.toHaveProperty('resetPasswordToken');
    expect(respuesta.body.data).not.toHaveProperty('resetPasswordExpires');
  });

  it('sin token responde 401', async () => {
    expect((await get('/perfil')).status).toBe(401);
  });
});

describe('PUT /api/auth/perfil', () => {
  it('el socio actualiza su teléfono y su localidad', async () => {
    const usuario = await crearUsuario({ telefono: '3704000000', localidad: 'Formosa' });

    const respuesta = await put('/perfil').set('Authorization', `Bearer ${tokenDe(usuario)}`).send({ telefono: '3704999999', localidad: 'Clorinda' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual({ telefono: '3704999999', localidad: 'Clorinda' });
    await usuario.reload();
    expect(usuario.telefono).toBe('3704999999');
    expect(usuario.localidad).toBe('Clorinda');
  });

  it('ignora cualquier otro campo: un socio no puede cambiarse la categoría, el rol, el estado ni el CUIT', async () => {
    const usuario = await crearUsuario({ categoria: 'adherente', rol: 'socio', cuit: '20-11111111-1' });

    await put('/perfil')
      .set('Authorization', `Bearer ${tokenDe(usuario)}`)
      .send({ categoria: 'honorario', rol: 'admin', estado: 'aprobado', cuit: '20-99999999-9', email: 'otro@test.com' });

    await usuario.reload();
    expect(usuario).toMatchObject({ categoria: 'adherente', rol: 'socio', cuit: '20-11111111-1' });
    expect(usuario.email).not.toBe('otro@test.com');
  });

  it('un campo vacío no borra el dato guardado', async () => {
    const usuario = await crearUsuario({ telefono: '3704000000' });

    await put('/perfil').set('Authorization', `Bearer ${tokenDe(usuario)}`).send({ telefono: '' });

    expect((await usuario.reload()).telefono).toBe('3704000000');
  });

  it('sin token responde 401', async () => {
    expect((await put('/perfil').send({ telefono: '1' })).status).toBe(401);
  });
});

// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================
describe('POST /api/auth/recuperar-password', () => {
  const MENSAJE_GENERICO = 'Si el correo está registrado, vas a recibir un mail con instrucciones para restablecer tu contraseña.';

  it('con un email registrado manda el mail con un token y guarda solo su hash (SHA-256), con vencimiento en 1 hora', async () => {
    const usuario = await crearUsuario({ email: 'socio@test.com' });
    const antes = Date.now();

    const respuesta = await post('/recuperar-password').send({ email: 'socio@test.com' });

    expect(respuesta.status).toBe(200);
    expect(enviarMailRecuperacion).toHaveBeenCalledOnce();
    const [destinatario, tokenPlano] = enviarMailRecuperacion.mock.calls[0];
    expect(destinatario).toBe('socio@test.com');
    expect(tokenPlano).toMatch(/^[0-9a-f]{64}$/);
    await usuario.reload();
    expect(usuario.resetPasswordToken).toBe(crypto.createHash('sha256').update(tokenPlano).digest('hex'));
    expect(usuario.resetPasswordToken).not.toBe(tokenPlano);
    const vence = usuario.resetPasswordExpires.getTime() - antes;
    expect(vence).toBeGreaterThan(59 * 60 * 1000);
    expect(vence).toBeLessThanOrEqual(61 * 60 * 1000);
  });

  it('con un email que no existe responde exactamente lo mismo y no manda nada (no revela qué emails existen)', async () => {
    await crearUsuario({ email: 'socio@test.com' });

    const existe = await post('/recuperar-password').send({ email: 'socio@test.com' });
    const noExiste = await post('/recuperar-password').send({ email: 'nadie@test.com' });

    expect(noExiste.status).toBe(200);
    expect(noExiste.body).toEqual(existe.body);
    expect(noExiste.body.mensaje).toBe(MENSAJE_GENERICO);
    expect(enviarMailRecuperacion).toHaveBeenCalledOnce();
  });

  it('si falla el envío del mail igual responde 200 (el error queda en el log)', async () => {
    await crearUsuario({ email: 'socio@test.com' });
    enviarMailRecuperacion.mockRejectedValue(new Error('SMTP caído'));

    const respuesta = await post('/recuperar-password').send({ email: 'socio@test.com' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe(MENSAJE_GENERICO);
  });

  it('más de 3 pedidos desde la misma IP en 15 minutos responden 429', async () => {
    for (let i = 0; i < 3; i++) await post('/recuperar-password').send({ email: 'nadie@test.com' });

    const cuarto = await post('/recuperar-password').send({ email: 'nadie@test.com' });

    expect(cuarto.status).toBe(429);
  });
});

describe('PUT /api/auth/restablecer-password/:token', () => {
  // Deja al usuario con un pedido de recuperación hecho, como lo deja recuperarPassword.
  const conPedidoDeRecuperacion = async ({ venceEn = 60 * 60 * 1000 } = {}) => {
    const tokenPlano = crypto.randomBytes(32).toString('hex');
    const usuario = await crearConClave({
      email: 'socio@test.com',
      resetPasswordToken: crypto.createHash('sha256').update(tokenPlano).digest('hex'),
      resetPasswordExpires: new Date(Date.now() + venceEn),
    });
    return { usuario, tokenPlano };
  };

  it('con un token válido cambia la contraseña, borra el token y marca la fecha del cambio', async () => {
    const { usuario, tokenPlano } = await conPedidoDeRecuperacion();

    const respuesta = await put(`/restablecer-password/${tokenPlano}`).send({ password: 'NuevaClave2' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('Contraseña actualizada correctamente. Ya podés iniciar sesión.');
    await usuario.reload();
    expect(await bcrypt.compare('NuevaClave2', usuario.password)).toBe(true);
    expect(usuario.resetPasswordToken).toBeNull();
    expect(usuario.resetPasswordExpires).toBeNull();
    expect(usuario.passwordChangedAt).toBeInstanceOf(Date);
  });

  it('después del cambio se entra con la contraseña nueva y no con la vieja', async () => {
    const { tokenPlano } = await conPedidoDeRecuperacion();
    await put(`/restablecer-password/${tokenPlano}`).send({ password: 'NuevaClave2' });

    expect((await post('/login').send({ email: 'socio@test.com', password: 'NuevaClave2' })).status).toBe(200);
    expect((await post('/login').send({ email: 'socio@test.com', password: CLAVE })).status).toBe(401);
  });

  it('el mismo link no sirve dos veces', async () => {
    const { tokenPlano } = await conPedidoDeRecuperacion();
    await put(`/restablecer-password/${tokenPlano}`).send({ password: 'NuevaClave2' });

    const segunda = await put(`/restablecer-password/${tokenPlano}`).send({ password: 'OtraClave3' });

    expect(segunda.status).toBe(400);
    expect(segunda.body.mensaje).toBe('El link de recuperación es inválido o ya venció.');
  });

  it('un link vencido responde 400 y no cambia la contraseña', async () => {
    const { usuario, tokenPlano } = await conPedidoDeRecuperacion({ venceEn: -1000 });

    const respuesta = await put(`/restablecer-password/${tokenPlano}`).send({ password: 'NuevaClave2' });

    expect(respuesta.status).toBe(400);
    expect(await bcrypt.compare(CLAVE, (await usuario.reload()).password)).toBe(true);
  });

  it('un token inventado responde 400', async () => {
    await conPedidoDeRecuperacion();

    expect((await put('/restablecer-password/token-inventado').send({ password: 'NuevaClave2' })).status).toBe(400);
  });

  it.each([
    ['vacía', '', 'La contraseña es obligatoria.'],
    ['corta', 'Clave1', 'La contraseña debe tener al menos 8 caracteres.'],
    ['sin números', 'ClaveNueva', 'La contraseña debe contener al menos un número.'],
    ['sin mayúsculas', 'clavenueva1', 'La contraseña debe contener al menos una letra mayúscula.'],
  ])('una contraseña %s se rechaza con las mismas reglas que el registro', async (_, password, mensaje) => {
    const { tokenPlano } = await conPedidoDeRecuperacion();

    const respuesta = await put(`/restablecer-password/${tokenPlano}`).send({ password });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe(mensaje);
  });

  it('si la contraseña llega como algo que no es texto (un número) también se rechaza', async () => {
    const { tokenPlano } = await conPedidoDeRecuperacion();

    expect((await put(`/restablecer-password/${tokenPlano}`).send({ password: 12345678 })).status).toBe(400);
  });
});
