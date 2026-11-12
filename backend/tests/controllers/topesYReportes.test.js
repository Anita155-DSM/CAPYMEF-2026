import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Tres ajustes: el tope de 255 caracteres de las observaciones del pago manual, el tope de 20 caracteres
// del teléfono en "mi perfil" y que los reportes por localidad y por rubro no cuenten a los admin.
// SQLite (la base de los tests) no hace cumplir el largo de un VARCHAR como Postgres: por eso estos tests
// prueban que el validador corta ANTES de llegar a la base, que es justamente lo que evita el 500 en Neon.
// Nada sale a internet: el PDF del comprobante, el mail y Cloudinary son falsos.
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn(async () => Buffer.from('%PDF-1.4')) }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(async () => {}), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({
  subirPDFCloudinary: vi.fn(async () => ({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/comprobante.pdf' })),
  eliminarImagenCloudinary: vi.fn(),
  extraerPublicIdDeUrl: vi.fn(),
}));
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({ uploadNube: { single: () => (req, res, next) => next() } }));

const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: cuotaRoutes } = await import('../../routes/cuota.routes.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { LARGO_MAXIMO_OBSERVACIONES } = await import('../../middlewares/validator/cuota.validator.js');
const { LARGO_MAXIMO_TELEFONO } = await import('../../middlewares/validator/user.validator.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/cuotas', cuotaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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

// ==========================================
// PUT /api/cuotas/:id/pagar — observaciones
// ==========================================
describe('pago manual: observaciones de hasta 255 caracteres (la columna es VARCHAR(255))', () => {
  const cuotaPendiente = () =>
    Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente' });
  const pagar = (cuota, body) => request(app).put(`/api/cuotas/${cuota.id}/pagar`).set('Authorization', `Bearer ${tokenAdmin}`).send(body);

  it('el tope es 255, el mismo largo que la columna de la base', () => {
    expect(LARGO_MAXIMO_OBSERVACIONES).toBe(255);
    expect(Pago.rawAttributes.observaciones.type.options.length).toBe(LARGO_MAXIMO_OBSERVACIONES);
  });

  it('con 255 caracteres registra el pago y guarda el texto completo', async () => {
    const cuota = await cuotaPendiente();
    const observaciones = 'a'.repeat(255);

    const respuesta = await pagar(cuota, { metodoPago: 'Efectivo', observaciones });

    expect(respuesta.status).toBe(200);
    expect((await cuota.reload()).estado).toBe('pagada');
    expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).observaciones).toBe(observaciones);
  });

  it('con 256 caracteres responde 400 con un mensaje claro, y la cuota NO queda pagada', async () => {
    const cuota = await cuotaPendiente();

    const respuesta = await pagar(cuota, { metodoPago: 'Efectivo', observaciones: 'a'.repeat(256) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([
      { campo: 'observaciones', mensaje: 'Las observaciones pueden tener como máximo 255 caracteres.' },
    ]);
    expect((await cuota.reload()).estado).toBe('pendiente');
    expect(await Pago.count()).toBe(0);
  });

  it('cuenta caracteres, no bytes: 255 letras con tilde también se aceptan', async () => {
    const cuota = await cuotaPendiente();

    expect((await pagar(cuota, { observaciones: 'á'.repeat(255) })).status).toBe(200);
  });

  it('sin observaciones registra el pago con el texto por defecto', async () => {
    const cuota = await cuotaPendiente();

    const respuesta = await pagar(cuota, { metodoPago: 'Efectivo' });

    expect(respuesta.status).toBe(200);
    expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).observaciones).toBe('Registro manual por administración');
  });

  it('con observaciones en null también se toma como "sin observaciones"', async () => {
    const cuota = await cuotaPendiente();

    expect((await pagar(cuota, { observaciones: null })).status).toBe(200);
  });

  it('si las observaciones no son texto (una lista o un objeto) responde 400 y no paga la cuota', async () => {
    const cuota = await cuotaPendiente();

    const respuesta = await pagar(cuota, { observaciones: { nota: 'x' } });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0]).toEqual({ campo: 'observaciones', mensaje: 'Las observaciones deben ser un texto.' });
    expect((await cuota.reload()).estado).toBe('pendiente');
  });
});

// ==========================================
// PUT /api/auth/perfil — teléfono
// ==========================================
describe('mi perfil: teléfono de hasta 20 caracteres (la columna es VARCHAR(20))', () => {
  const actualizarPerfil = (body) => request(app).put('/api/auth/perfil').set('Authorization', `Bearer ${tokenSocio}`).send(body);

  it('el tope es 20, el mismo largo que la columna de la base', () => {
    expect(LARGO_MAXIMO_TELEFONO).toBe(20);
    expect(socio.constructor.rawAttributes.telefono.type.options.length).toBe(LARGO_MAXIMO_TELEFONO);
  });

  it('con 20 caracteres actualiza el teléfono', async () => {
    const telefono = '+54 9 370 412-345678';
    expect(telefono).toHaveLength(20);

    const respuesta = await actualizarPerfil({ telefono });

    expect(respuesta.status).toBe(200);
    expect((await socio.reload()).telefono).toBe(telefono);
  });

  it('con 21 caracteres responde 400 con un mensaje claro y el perfil no cambia', async () => {
    const respuesta = await actualizarPerfil({ telefono: '1'.repeat(21), localidad: 'Clorinda' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([
      { campo: 'telefono', mensaje: 'El teléfono puede tener como máximo 20 caracteres.' },
    ]);
    await socio.reload();
    expect(socio.telefono).toBe('3704000000');
    expect(socio.localidad).toBe('Formosa');
  });

  it('los espacios de los costados no cuentan para el tope y no se guardan', async () => {
    const respuesta = await actualizarPerfil({ telefono: `  ${'1'.repeat(20)}  ` });

    expect(respuesta.status).toBe(200);
    expect((await socio.reload()).telefono).toBe('1'.repeat(20));
  });

  it('sin teléfono (solo la localidad) sigue funcionando como antes', async () => {
    const respuesta = await actualizarPerfil({ localidad: 'Clorinda' });

    expect(respuesta.status).toBe(200);
    await socio.reload();
    expect(socio.localidad).toBe('Clorinda');
    expect(socio.telefono).toBe('3704000000');
  });
});

// ==========================================
// Reportes del admin — sin las cuentas de gestión
// ==========================================
describe('reportes por localidad y por rubro: los admin no cuentan como socios', () => {
  beforeEach(async () => {
    // En la misma localidad y rubro: 2 socios aprobados y 1 admin aprobado. (El admin y el socio del
    // beforeEach general están en Formosa / Comercio, así que acá se usa otra localidad y otro rubro.)
    await crearUsuario({ localidad: 'Clorinda', rubro: 'Industria' });
    await crearUsuario({ localidad: 'Clorinda', rubro: 'Industria' });
    await crearUsuario({ localidad: 'Clorinda', rubro: 'Industria', rol: 'admin' });
  });

  const reporte = (ruta) => request(app).get(`/api/admin/reportes/${ruta}`).set('Authorization', `Bearer ${tokenAdmin}`);

  it('por localidad: con 2 socios y 1 admin en Clorinda, cuenta 2', async () => {
    const respuesta = await reporte('distribucion-localidad');

    expect(respuesta.status).toBe(200);
    const clorinda = respuesta.body.data.find((f) => f.localidad === 'Clorinda');
    expect(Number(clorinda.cantidad)).toBe(2);
  });

  it('por rubro: con 2 socios y 1 admin en Industria, cuenta 2', async () => {
    const respuesta = await reporte('distribucion-rubros');

    expect(respuesta.status).toBe(200);
    const industria = respuesta.body.data.find((f) => f.rubro === 'Industria');
    expect(Number(industria.cantidad)).toBe(2);
  });

  it('una localidad o un rubro donde solo hay un admin no aparece en el reporte', async () => {
    await crearUsuario({ localidad: 'Pirané', rubro: 'Agropecuario', rol: 'admin' });

    const porLocalidad = await reporte('distribucion-localidad');
    const porRubro = await reporte('distribucion-rubros');

    expect(porLocalidad.body.data.map((f) => f.localidad)).not.toContain('Pirané');
    expect(porRubro.body.data.map((f) => f.rubro)).not.toContain('Agropecuario');
  });

  it('los listados de usuarios y de solicitudes siguen mostrando a los admin (los necesita la gestión)', async () => {
    await crearUsuario({ rol: 'admin', estado: 'pendiente' });

    const usuarios = await request(app).get('/api/admin/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
    const solicitudes = await request(app).get('/api/admin/solicitudes').set('Authorization', `Bearer ${tokenAdmin}`);

    expect(usuarios.body.data.filter((u) => u.rol === 'admin')).toHaveLength(3);
    expect(solicitudes.body.data).toHaveLength(1);
  });
});
