import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Topes de largo en los campos de texto que antes llegaban sin límite a una columna VARCHAR: teléfono (20) y
// localidad (100) en el registro, la edición del admin y "mi perfil", y el número de comprobante (100) del
// pago manual. En Postgres un texto más largo hacía fallar el guardado con un 500. SQLite no hace cumplir el
// largo del VARCHAR, así que estos tests prueban que el validador corta ANTES de llegar a la base.
// Nada sale a internet: la subida de la constancia, el PDF del comprobante, el mail y Cloudinary son falsos.
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({
  uploadNube: {
    single: () => (req, res, next) => {
      req.file = { path: 'https://res.cloudinary.com/demo/raw/upload/constancia.pdf', filename: 'constancia' };
      next();
    },
  },
}));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn(async () => Buffer.from('%PDF-1.4')) }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(async () => {}), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({
  subirPDFCloudinary: vi.fn(async () => ({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/comprobante.pdf' })),
  eliminarImagenCloudinary: vi.fn(),
  extraerPublicIdDeUrl: vi.fn(),
}));

const { User } = await import('../../models/user.models.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { default: cuotaRoutes } = await import('../../routes/cuota.routes.js');
const { LARGO_MAXIMO_TELEFONO, LARGO_MAXIMO_LOCALIDAD } = await import('../../middlewares/validator/user.validator.js');
const { LARGO_MAXIMO_NRO_COMPROBANTE } = await import('../../middlewares/validator/cuota.validator.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cuotas', cuotaRoutes);

const MENSAJE_TELEFONO = 'El teléfono puede tener como máximo 20 caracteres.';
const MENSAJE_LOCALIDAD = 'La localidad puede tener como máximo 100 caracteres.';
const MENSAJE_COMPROBANTE = 'El número de comprobante puede tener como máximo 100 caracteres.';

let admin;
let socio;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin' });
  socio = await crearUsuario({ telefono: '3704000000', localidad: 'Formosa' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

describe('los topes son el largo de cada columna en la base', () => {
  it('teléfono 20 y localidad 100 (users), número de comprobante 100 (pagos)', () => {
    expect(LARGO_MAXIMO_TELEFONO).toBe(20);
    expect(LARGO_MAXIMO_LOCALIDAD).toBe(100);
    expect(LARGO_MAXIMO_NRO_COMPROBANTE).toBe(100);
    expect(User.rawAttributes.localidad.type.options.length).toBe(LARGO_MAXIMO_LOCALIDAD);
    expect(Pago.rawAttributes.nroComprobante.type.options.length).toBe(LARGO_MAXIMO_NRO_COMPROBANTE);
  });
});

// ==========================================
// POST /api/auth/registro
// ==========================================
describe('registro público: teléfono ≤ 20 y localidad ≤ 100', () => {
  const registrar = (datos) =>
    request(app).post('/api/auth/registro').send({
      razonSocial: 'Empresa Nueva SRL',
      cuit: '30-71234567-8',
      email: 'nueva@empresa.com',
      password: 'ClaveSegura1',
      telefono: '3704555555',
      localidad: 'Clorinda',
      rubro: 'Comercio',
      aceptaTerminos: true, // aceptación de los términos (obligatoria en los tests, ver config/terminos.js)
      ...datos,
    });
  const registradas = () => User.count({ where: { email: 'nueva@empresa.com' } });

  it('teléfono de 20 caracteres: se registra', async () => {
    const respuesta = await registrar({ telefono: '1'.repeat(20) });

    expect(respuesta.status).toBe(201);
    expect((await User.findOne({ where: { email: 'nueva@empresa.com' } })).telefono).toBe('1'.repeat(20));
  });

  it('teléfono de 21 caracteres: 400 con un mensaje claro y no se crea la cuenta', async () => {
    const respuesta = await registrar({ telefono: '1'.repeat(21) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'telefono', mensaje: MENSAJE_TELEFONO }]);
    expect(await registradas()).toBe(0);
  });

  it('localidad de 100 caracteres: se registra', async () => {
    expect((await registrar({ localidad: 'L'.repeat(100) })).status).toBe(201);
  });

  it('localidad de 101 caracteres: 400 con un mensaje claro y no se crea la cuenta', async () => {
    const respuesta = await registrar({ localidad: 'L'.repeat(101) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'localidad', mensaje: MENSAJE_LOCALIDAD }]);
    expect(await registradas()).toBe(0);
  });

  it('sin teléfono informa solo que es obligatorio (no también el tope)', async () => {
    const respuesta = await registrar({ telefono: '' });

    expect(respuesta.body.errores).toEqual([{ campo: 'telefono', mensaje: 'El número de teléfono es obligatorio.' }]);
  });
});

// ==========================================
// PUT /api/admin/socios/:id
// ==========================================
describe('edición del admin: teléfono ≤ 20 y localidad ≤ 100', () => {
  const editar = (body) => request(app).put(`/api/admin/socios/${socio.id}`).set('Authorization', `Bearer ${tokenAdmin}`).send(body);

  it('teléfono de 20 caracteres: se guarda', async () => {
    expect((await editar({ telefono: '2'.repeat(20) })).status).toBe(200);
    expect((await socio.reload()).telefono).toBe('2'.repeat(20));
  });

  it('teléfono de 21 caracteres: 400 y el socio no cambia en nada', async () => {
    const respuesta = await editar({ telefono: '2'.repeat(21), razonSocial: 'Nombre Nuevo SA' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'telefono', mensaje: MENSAJE_TELEFONO }]);
    await socio.reload();
    expect(socio.telefono).toBe('3704000000');
    expect(socio.razonSocial).not.toBe('Nombre Nuevo SA');
  });

  it('localidad de 100 caracteres: se guarda', async () => {
    expect((await editar({ localidad: 'L'.repeat(100) })).status).toBe(200);
    expect((await socio.reload()).localidad).toBe('L'.repeat(100));
  });

  it('localidad de 101 caracteres: 400 y la localidad no cambia', async () => {
    const respuesta = await editar({ localidad: 'L'.repeat(101) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'localidad', mensaje: MENSAJE_LOCALIDAD }]);
    expect((await socio.reload()).localidad).toBe('Formosa');
  });
});

// ==========================================
// PUT /api/auth/perfil
// ==========================================
describe('mi perfil: localidad ≤ 100 (el teléfono ya tenía tope)', () => {
  const actualizar = (body) => request(app).put('/api/auth/perfil').set('Authorization', `Bearer ${tokenSocio}`).send(body);

  it('localidad de 100 caracteres: se guarda', async () => {
    expect((await actualizar({ localidad: 'L'.repeat(100) })).status).toBe(200);
    expect((await socio.reload()).localidad).toBe('L'.repeat(100));
  });

  it('localidad de 101 caracteres: 400 y el perfil no cambia (tampoco el teléfono enviado junto)', async () => {
    const respuesta = await actualizar({ localidad: 'L'.repeat(101), telefono: '3704999999' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'localidad', mensaje: MENSAJE_LOCALIDAD }]);
    await socio.reload();
    expect(socio.localidad).toBe('Formosa');
    expect(socio.telefono).toBe('3704000000');
  });
});

// ==========================================
// PUT /api/cuotas/:id/pagar
// ==========================================
describe('pago manual: número de comprobante ≤ 100', () => {
  let cuota;
  beforeEach(async () => {
    cuota = await Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente' });
  });
  const pagar = (body) => request(app).put(`/api/cuotas/${cuota.id}/pagar`).set('Authorization', `Bearer ${tokenAdmin}`).send(body);

  it('número de comprobante de 100 caracteres: registra el pago y lo guarda completo', async () => {
    const nroComprobante = 'N'.repeat(100);

    expect((await pagar({ metodoPago: 'Transferencia', nroComprobante })).status).toBe(200);
    expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).nroComprobante).toBe(nroComprobante);
  });

  it('número de comprobante de 101 caracteres: 400, la cuota NO queda pagada y no se crea el pago', async () => {
    const respuesta = await pagar({ metodoPago: 'Transferencia', nroComprobante: 'N'.repeat(101) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'nroComprobante', mensaje: MENSAJE_COMPROBANTE }]);
    expect((await cuota.reload()).estado).toBe('pendiente');
    expect(await Pago.count()).toBe(0);
  });

  it('sin número de comprobante (o en null) registra el pago igual', async () => {
    expect((await pagar({ nroComprobante: null })).status).toBe(200);
    expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).nroComprobante).toBeNull();
  });

  it('un número de comprobante que no es texto (un objeto) responde 400 y no paga la cuota', async () => {
    const respuesta = await pagar({ nroComprobante: { numero: 1 } });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0]).toEqual({ campo: 'nroComprobante', mensaje: 'El número de comprobante debe ser un texto.' });
    expect((await cuota.reload()).estado).toBe('pendiente');
  });
});
