import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Nada sale a internet: la subida de la constancia a Cloudinary, la consulta a Mercado Pago, el mail, la
// subida del comprobante y el PDF son falsos. Los routers, los controladores y la base (SQLite) son reales.
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({
  uploadNube: {
    single: () => (req, res, next) => {
      req.file = { path: 'https://res.cloudinary.com/demo/raw/upload/constancia.pdf', filename: 'constancia' };
      next();
    },
  },
}));
vi.mock('../../services/pasarela.service.js', () => ({ crearOrdenDePago: vi.fn(), procesarNotificacionPago: vi.fn() }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(async () => {}), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({
  subirPDFCloudinary: vi.fn(async () => ({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/comprobante' })),
  eliminarImagenCloudinary: vi.fn(),
  extraerPublicIdDeUrl: vi.fn(),
}));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn(async () => Buffer.from('%PDF-1.4')) }));

const { procesarNotificacionPago } = await import('../../services/pasarela.service.js');
const { User } = await import('../../models/user.models.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { Evento } = await import('../../models/evento.models.js');
const { default: authRoutes } = await import('../../routes/authRoutes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { default: cuotaRoutes } = await import('../../routes/cuota.routes.js');
const { default: pagoRoutes } = await import('../../routes/pago.routes.js');
const { asegurarTarifasIniciales } = await import('../../services/tarifa.service.js');
const { evaluarCategoriaSocio, evaluarCategoriasDeTodos } = await import('../../services/categoria.service.js');
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
app.use('/api/pagos', pagoRoutes);

const modoWebhookOriginal = process.env.MP_WEBHOOK_MODE;
let tokenAdmin;

beforeEach(async () => {
  // El webhook se prueba sin firma (su verificación tiene sus propios tests).
  process.env.MP_WEBHOOK_MODE = 'off';
  await reiniciarBase();
  await asegurarTarifasIniciales();
  const admin = await crearUsuario({ rol: 'admin' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (modoWebhookOriginal === undefined) delete process.env.MP_WEBHOOK_MODE;
  else process.env.MP_WEBHOOK_MODE = modoWebhookOriginal;
});

afterAll(async () => {
  await cerrarBase();
});

const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);
const vencida = (socio, mes_anio) =>
  Cuota.create({ usuario_id: socio.id, mes_anio, monto: 10000, fecha_vencimiento: `${mes_anio}-10`, estado: 'vencida' });
const recargar = (usuario) => User.findByPk(usuario.id);

// ==========================================
// PARTE A: registro público
// ==========================================
describe('registro público: qué categorías se pueden pedir', () => {
  let numero = 0;
  const registrar = (categoria) => {
    numero++;
    return request(app).post('/api/auth/registro').send({
      razonSocial: `Empresa registrada ${numero}`,
      cuit: `20-1234567${numero}-9`,
      email: `registro${numero}@test.com`,
      password: 'ClaveSegura1',
      telefono: '3704000000',
      localidad: 'Formosa',
      rubro: 'Comercio',
      actividad: 'Venta',
      tamano_empresa: 'Micro',
      ...(categoria !== undefined && { categoria }),
    });
  };

  it.each(['activo', 'adherente'])('con categoría %s se acepta', async (categoria) => {
    const respuesta = await registrar(categoria);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data).toMatchObject({ categoria, estado: 'pendiente' });
  });

  it('sin categoría queda como adherente (valor por defecto)', async () => {
    const respuesta = await registrar(undefined);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.categoria).toBe('adherente');
  });

  it.each(['padrino', 'honorario'])('con categoría %s responde 400: la asigna la Cámara', async (categoria) => {
    const respuesta = await registrar(categoria);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([
      { campo: 'categoria', mensaje: 'Esta categoría la asigna la Cámara: en el registro podés elegir Activo o Adherente.' },
    ]);
    expect(await User.count({ where: { categoria } })).toBe(0);
  });

  it('una categoría que no existe responde 400 con el mensaje de categoría inválida', async () => {
    const respuesta = await registrar('vitalicio');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0].mensaje).toContain('La categoría no es válida');
  });
});

describe('edición del admin: puede asignar las categorías que da la Cámara', () => {
  it.each(['padrino', 'honorario'])('el admin asigna %s', async (categoria) => {
    const socio = await crearUsuario({ categoria: 'adherente' });

    const respuesta = await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ categoria });

    expect(respuesta.status).toBe(200);
    expect((await recargar(socio)).categoria).toBe(categoria);
  });
});

// ==========================================
// PARTE B/C: transiciones Activo <-> Adherente
// ==========================================
describe('degradado por mora que regulariza vuelve a Activo', () => {
  const degradadoConUnaVencida = async () => {
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });
    const cuota = await vencida(socio, '2026-10');
    return { socio, cuota };
  };

  it('pagando por Mercado Pago', async () => {
    const { socio, cuota } = await degradadoConUnaVencida();
    procesarNotificacionPago.mockResolvedValue({
      aprobado: true, estado: 'approved', moneda: 'ARS', cuotaId: cuota.id, montoPagado: 10000, idTransaccionExterna: 'mp-77',
    });

    const respuesta = await request(app).post('/api/pagos/webhook?type=payment&data.id=mp-77').send({});

    expect(respuesta.status).toBe(200);
    expect((await Cuota.findByPk(cuota.id)).estado).toBe('pagada');
    const actualizado = await recargar(socio);
    expect(actualizado.categoria).toBe('activo');
    expect(actualizado.degradadoPorMora).toBe(false);
    // Se espera a que termine el segundo plano (comprobante) antes de pasar al próximo test.
    await vi.waitFor(async () => expect((await Pago.findOne({ where: { cuota_id: cuota.id } })).urlComprobante).toBeTruthy());
  });

  it('con un pago manual (efectivo) que después confirma Tesorería', async () => {
    const { socio, cuota } = await degradadoConUnaVencida();

    const pago = await comoAdmin(request(app).put(`/api/cuotas/${cuota.id}/pagar`)).send({ metodoPago: 'Efectivo' });
    expect(pago.status).toBe(200);
    // La categoría se recupera al registrar el pago...
    expect((await recargar(socio)).categoria).toBe('activo');

    // ...y la confirmación de Tesorería (verificación contra el banco) no la cambia.
    const pagoId = pago.body.data.pago.id;
    const confirmacion = await comoAdmin(request(app).put('/api/cuotas/pagos/confirmar')).send({ pagoIds: [pagoId] });
    expect(confirmacion.status).toBe(200);
    const actualizado = await recargar(socio);
    expect(actualizado.categoria).toBe('activo');
    expect(actualizado.degradadoPorMora).toBe(false);
  });
});

describe('cambios manuales de categoría', () => {
  it('un adherente asignado a mano (no por mora) con 0 vencidas NO pasa solo a Activo', async () => {
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: false });

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect(await evaluarCategoriasDeTodos()).toEqual({ degradados: 0, recuperados: 0 });
    expect((await recargar(socio)).categoria).toBe('adherente');
  });

  it('si el admin pasa a Activo a un degradado por mora, deja de estar marcado como degradado', async () => {
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });

    const respuesta = await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ categoria: 'activo' });

    expect(respuesta.status).toBe(200);
    const actualizado = await recargar(socio);
    expect(actualizado.categoria).toBe('activo');
    expect(actualizado.degradadoPorMora).toBe(false);
  });

  it('si el admin lo pasa a Activo con 3 vencidas, el cierre diario lo vuelve a degradar', async () => {
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });
    for (const mes of ['2026-08', '2026-09', '2026-10']) await vencida(socio, mes);
    await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ categoria: 'activo' });

    // Lo mismo que hace el cron de las 00:05 después de marcar vencidas.
    expect(await evaluarCategoriasDeTodos()).toEqual({ degradados: 1, recuperados: 0 });
    const actualizado = await recargar(socio);
    expect(actualizado.categoria).toBe('adherente');
    expect(actualizado.degradadoPorMora).toBe(true);
  });
});

describe('POST /api/cuotas/generar-manual', () => {
  it('correrlo dos veces no duplica las cuotas del mes', async () => {
    const socio = await crearUsuario({ categoria: 'activo' });

    const primera = await comoAdmin(request(app).post('/api/cuotas/generar-manual'));
    const segunda = await comoAdmin(request(app).post('/api/cuotas/generar-manual'));

    expect(primera.status).toBe(200);
    expect(segunda.status).toBe(200);
    expect(await Cuota.count({ where: { usuario_id: socio.id } })).toBe(1);
  });
});
