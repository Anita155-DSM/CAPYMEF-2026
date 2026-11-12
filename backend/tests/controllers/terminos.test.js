import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';

// Aceptación de los términos y condiciones al registrarse: se guarda la fecha (la pone el servidor) y la versión
// (la define el backend). Mientras el frontend no mande el campo, la exigencia se puede apagar con
// TERMINOS_OBLIGATORIOS=false (modo transitorio). En los tests, por defecto, es obligatoria.
// La subida de la constancia es falsa (pone siempre un archivo); solo se simula el reloj (Date).
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({
  uploadNube: {
    single: () => (req, res, next) => {
      req.file = { path: 'https://res.cloudinary.com/demo/raw/upload/constancia.pdf', filename: 'constancia' };
      next();
    },
  },
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailRecuperacion: vi.fn(), enviarMailComprobantePago: vi.fn() }));

const { User } = await import('../../models/user.models.js');
const { Auditoria } = await import('../../models/auditoria.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { interceptorAuditoria } = await import('../../middlewares/auditoria.middleware.js');
const { VERSION_TERMINOS, MENSAJE_TERMINOS_OBLIGATORIOS, terminosObligatorios, aceptoLosTerminos } = await import('../../config/terminos.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api', interceptorAuditoria);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const AHORA = new Date('2026-11-15T14:30:00-03:00');
const EMAIL = 'nueva@empresa.com';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const registrar = (extra = {}) =>
  request(app).post('/api/auth/registro').send({
    razonSocial: 'Empresa Nueva SRL',
    cuit: '30-71234567-8',
    email: EMAIL,
    password: 'ClaveSegura1',
    telefono: '3704555555',
    localidad: 'Clorinda',
    rubro: 'Comercio',
    ...extra,
  });
const cuentaCreada = () => User.findOne({ where: { email: EMAIL } });

describe('la versión vigente y el modo', () => {
  it('la versión la define el backend', () => {
    expect(VERSION_TERMINOS).toBe('2026-11');
  });

  it.each([
    ['true', 'test', true],
    ['false', 'test', false],
    [undefined, 'test', true],
    [undefined, 'production', false],
    [undefined, 'development', false],
    ['true', 'production', true],
  ])('TERMINOS_OBLIGATORIOS=%s con NODE_ENV=%s → obligatorio: %s', (valor, entorno, esperado) => {
    if (valor === undefined) vi.stubEnv('TERMINOS_OBLIGATORIOS', undefined);
    else vi.stubEnv('TERMINOS_OBLIGATORIOS', valor);
    vi.stubEnv('NODE_ENV', entorno);

    expect(terminosObligatorios()).toBe(esperado);
  });

  it.each([[true, true], ['true', true], [false, false], ['false', false], ['1', false], ['si', false], ['on', false], [undefined, false], [null, false]])(
    'aceptoLosTerminos(%j) = %s: solo cuenta la aceptación explícita',
    (valor, esperado) => {
      expect(aceptoLosTerminos(valor)).toBe(esperado);
    }
  );
});

describe('registro con la aceptación obligatoria', () => {
  it('con aceptaTerminos: true crea la cuenta con la fecha del servidor y la versión vigente', async () => {
    const respuesta = await registrar({ aceptaTerminos: true });

    expect(respuesta.status).toBe(201);
    const cuenta = await cuentaCreada();
    expect(cuenta.terminosAceptadosAt.toISOString()).toBe(AHORA.toISOString());
    expect(cuenta.terminosVersion).toBe(VERSION_TERMINOS);
  });

  it('acepta "true" como texto (así llega desde un formulario multipart)', async () => {
    expect((await registrar({ aceptaTerminos: 'true' })).status).toBe(201);
    expect((await cuentaCreada()).terminosVersion).toBe(VERSION_TERMINOS);
  });

  it.each([
    ['sin el campo', {}],
    ['con false', { aceptaTerminos: false }],
    ['con "false"', { aceptaTerminos: 'false' }],
    ['con "si"', { aceptaTerminos: 'si' }],
  ])('%s responde 400 con el mensaje en el formato del proyecto y no crea la cuenta', async (_, extra) => {
    const respuesta = await registrar(extra);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'aceptaTerminos', mensaje: MENSAJE_TERMINOS_OBLIGATORIOS }]);
    expect(respuesta.body.errores[0].mensaje).toBe('Tenés que aceptar los términos y condiciones para registrarte.');
    expect(await cuentaCreada()).toBeNull();
  });

  it('si el cliente manda otra versión u otra fecha, se ignoran: valen las del backend', async () => {
    await registrar({ aceptaTerminos: true, terminosVersion: '1999-01', terminosAceptadosAt: '2000-01-01T00:00:00Z' });

    const cuenta = await cuentaCreada();
    expect(cuenta.terminosVersion).toBe(VERSION_TERMINOS);
    expect(cuenta.terminosAceptadosAt.toISOString()).toBe(AHORA.toISOString());
  });

  it('queda en la auditoría del registro qué versión aceptó', async () => {
    await registrar({ aceptaTerminos: true });

    await vi.waitFor(async () => expect(await Auditoria.count({ where: { codigoTecnico: 'REGISTRO_SOCIO_SOLICITUD' } })).toBe(1));
    const registro = await Auditoria.findOne({ where: { codigoTecnico: 'REGISTRO_SOCIO_SOLICITUD' } });
    expect(registro.descripcion).toContain(`Aceptó los términos y condiciones versión ${VERSION_TERMINOS}.`);
  });
});

describe('modo transitorio (TERMINOS_OBLIGATORIOS=false, hasta que el frontend mande el campo)', () => {
  beforeEach(() => {
    vi.stubEnv('TERMINOS_OBLIGATORIOS', 'false');
  });

  it('sin el campo se registra igual, con fecha y versión en null', async () => {
    const respuesta = await registrar();

    expect(respuesta.status).toBe(201);
    const cuenta = await cuentaCreada();
    expect(cuenta.terminosAceptadosAt).toBeNull();
    expect(cuenta.terminosVersion).toBeNull();
  });

  it('si el campo viene, se guarda igual que en el modo obligatorio', async () => {
    await registrar({ aceptaTerminos: 'true' });

    expect((await cuentaCreada()).terminosVersion).toBe(VERSION_TERMINOS);
  });

  it('la auditoría deja constancia de que no hubo aceptación registrada', async () => {
    await registrar();

    await vi.waitFor(async () => expect(await Auditoria.count({ where: { codigoTecnico: 'REGISTRO_SOCIO_SOLICITUD' } })).toBe(1));
    expect((await Auditoria.findOne()).descripcion).toContain('Sin registro de aceptación de los términos.');
  });
});

describe('dónde se ven la fecha y la versión', () => {
  it('GET /api/auth/perfil devuelve terminosAceptadosAt y terminosVersion', async () => {
    const socio = await crearUsuario({ terminosAceptadosAt: AHORA, terminosVersion: VERSION_TERMINOS });

    const respuesta = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${jwt.sign({ id: socio.id }, process.env.JWT_SECRET)}`);

    expect(respuesta.body.data).toMatchObject({ terminosAceptadosAt: AHORA.toISOString(), terminosVersion: VERSION_TERMINOS });
  });

  it('el listado de usuarios del admin devuelve terminosAceptadosAt y terminosVersion (null en las cuentas viejas)', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const conTerminos = await crearUsuario({ terminosAceptadosAt: AHORA, terminosVersion: VERSION_TERMINOS });

    const respuesta = await request(app).get('/api/admin/usuarios').set('Authorization', `Bearer ${jwt.sign({ id: admin.id }, process.env.JWT_SECRET)}`);

    const porId = Object.fromEntries(respuesta.body.data.map((u) => [u.id, u]));
    expect(porId[conTerminos.id]).toMatchObject({ terminosAceptadosAt: AHORA.toISOString(), terminosVersion: VERSION_TERMINOS });
    expect(porId[admin.id]).toMatchObject({ terminosAceptadosAt: null, terminosVersion: null });
  });
});

describe('cuentas registradas antes de este control', () => {
  it('con fecha y versión en null siguen pudiendo iniciar sesión', async () => {
    await crearUsuario({ email: 'vieja@test.com', password: await bcrypt.hash('ClaveVieja1', 4) });

    const respuesta = await request(app).post('/api/auth/login').send({ email: 'vieja@test.com', password: 'ClaveVieja1' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toBeTruthy();
  });
});
