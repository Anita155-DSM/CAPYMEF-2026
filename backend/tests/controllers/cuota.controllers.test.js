import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Nada sale a internet: el PDF del comprobante, el mail y la subida a Cloudinary son falsos (cada uno
// tiene sus propios tests). Router, controlador, notificaciones, categorías y base (SQLite) son reales.
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({
  subirPDFCloudinary: vi.fn(),
  eliminarImagenCloudinary: vi.fn(),
  extraerPublicIdDeUrl: vi.fn(),
}));

const { generarComprobantePago } = await import('../../services/comprobante.service.js');
const { enviarMailComprobantePago } = await import('../../config/mailer.js');
const { subirPDFCloudinary } = await import('../../services/cloudinary.service.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { Notificacion } = await import('../../models/notificacion.models.js');
const { default: cuotaRoutes } = await import('../../routes/cuota.routes.js');
const { asegurarTarifasIniciales } = await import('../../services/tarifa.service.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
app.use(express.json());
app.use('/api/cuotas', cuotaRoutes);

const PDF = Buffer.from('%PDF-1.4 comprobante de prueba');
const URL_COMPROBANTE = 'https://res.cloudinary.com/demo/raw/upload/capymef_comprobantes_pago/comprobante-1.pdf';
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

let admin;
let otroAdmin;
let socio;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  generarComprobantePago.mockResolvedValue(PDF);
  enviarMailComprobantePago.mockResolvedValue();
  subirPDFCloudinary.mockResolvedValue({ secure_url: URL_COMPROBANTE });
  await reiniciarBase();
  await asegurarTarifasIniciales();
  admin = await crearUsuario({ rol: 'admin', razonSocial: 'Admin que carga' });
  otroAdmin = await crearUsuario({ rol: 'admin', razonSocial: 'Tesorería' });
  socio = await crearUsuario({ razonSocial: 'Empresa Socia SA', email: 'socia@test.com' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);
const cuota = (datos = {}) =>
  Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente', ...datos });
const pagar = (id, body = {}) => comoAdmin(request(app).put(`/api/cuotas/${id}/pagar`)).send(body);

describe('acceso a /api/cuotas', () => {
  it('sin token responde 401 y con token de socio 403 (todo el módulo es de administración)', async () => {
    expect((await request(app).get('/api/cuotas')).status).toBe(401);
    expect((await request(app).get('/api/cuotas').set('Authorization', `Bearer ${tokenSocio}`)).status).toBe(403);
  });

  it('un id de cuota que no es UUID responde 400 antes de consultar la base', async () => {
    expect((await pagar('123')).status).toBe(400);
  });
});

// ==========================================
// LISTADOS
// ==========================================
describe('GET /api/cuotas', () => {
  it('lista todas las cuotas con los datos básicos del socio, la más reciente primero', async () => {
    await cuota({ mes_anio: '2026-10', estado: 'pagada' });
    await cuota({ mes_anio: '2026-11' });

    const respuesta = await comoAdmin(request(app).get('/api/cuotas'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((c) => c.mes_anio)).toEqual(['2026-11', '2026-10']);
    expect(respuesta.body.data[0].socio).toEqual({ id: socio.id, razonSocial: 'Empresa Socia SA', cuit: socio.cuit, email: 'socia@test.com', categoria: 'activo' });
  });
});

describe('GET /api/cuotas/pendientes', () => {
  it('lista las deudas (pendientes y vencidas, no las pagadas), la que venció antes primero', async () => {
    await cuota({ mes_anio: '2026-11', fecha_vencimiento: '2026-11-10' });
    await cuota({ mes_anio: '2026-09', fecha_vencimiento: '2026-09-10', estado: 'vencida' });
    await cuota({ mes_anio: '2026-10', fecha_vencimiento: '2026-10-10', estado: 'pagada' });

    const respuesta = await comoAdmin(request(app).get('/api/cuotas/pendientes'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(2);
    expect(respuesta.body.data.map((c) => [c.mes_anio, c.estado])).toEqual([['2026-09', 'vencida'], ['2026-11', 'pendiente']]);
    expect(respuesta.body.data[0].socio).toHaveProperty('telefono');
  });
});

describe('GET /api/cuotas/resumen-financiero', () => {
  it('cuenta cuotas por estado y suma lo recaudado', async () => {
    await cuota({ mes_anio: '2026-11' });
    await cuota({ mes_anio: '2026-09', estado: 'vencida' });
    const pagada = await cuota({ mes_anio: '2026-10', estado: 'pagada' });
    await Pago.create({ cuota_id: pagada.id, usuario_id: socio.id, montoAbonado: 10000 });

    const respuesta = await comoAdmin(request(app).get('/api/cuotas/resumen-financiero'));

    expect(respuesta.body.data).toEqual({ cuotasPendientesCount: 1, cuotasPagadasCount: 1, cuotasVencidasCount: 1, totalRecaudado: 10000 });
  });

  it('sin pagos el total recaudado es 0 (no null)', async () => {
    expect((await comoAdmin(request(app).get('/api/cuotas/resumen-financiero'))).body.data.totalRecaudado).toBe(0);
  });
});

// ==========================================
// PAGO MANUAL (efectivo / transferencia cargada por administración)
// ==========================================
describe('PUT /api/cuotas/:id/pagar', () => {
  it('registra el pago por el monto de la cuota y la deja pagada', async () => {
    const pendiente = await cuota();

    const respuesta = await pagar(pendiente.id, { metodoPago: 'Efectivo', nroComprobante: 'REC-001', observaciones: 'Pagó en la sede' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('El pago ha sido registrado e impactado correctamente.');
    expect((await pendiente.reload()).estado).toBe('pagada');
    const pago = await Pago.findOne({ where: { cuota_id: pendiente.id } });
    expect(pago).toMatchObject({ usuario_id: socio.id, metodoPago: 'Efectivo', nroComprobante: 'REC-001', observaciones: 'Pagó en la sede', origenPago: 'manual' });
    expect(Number(pago.montoAbonado)).toBe(10000);
    expect(pago.confirmadoAt).toBeNull();
  });

  it('el monto sale de la cuota: no se puede cargar otro monto desde el body', async () => {
    const pendiente = await cuota();

    await pagar(pendiente.id, { montoAbonado: 1 });

    expect(Number((await Pago.findOne({ where: { cuota_id: pendiente.id } })).montoAbonado)).toBe(10000);
  });

  it('sin datos usa Transferencia y una observación por defecto', async () => {
    const pendiente = await cuota();

    await pagar(pendiente.id);

    const pago = await Pago.findOne({ where: { cuota_id: pendiente.id } });
    expect(pago.metodoPago).toBe('Transferencia');
    expect(pago.observaciones).toBe('Registro manual por administración');
  });

  it('también se puede pagar una cuota vencida', async () => {
    const vencida = await cuota({ estado: 'vencida' });

    expect((await pagar(vencida.id)).status).toBe(200);
    expect((await vencida.reload()).estado).toBe('pagada');
  });

  it('una cuota ya pagada responde 400 y no crea un segundo pago', async () => {
    const pendiente = await cuota();
    await pagar(pendiente.id);

    const segunda = await pagar(pendiente.id);

    expect(segunda.status).toBe(400);
    expect(segunda.body.mensaje).toBe('Esta cuota ya fue abonada anteriormente.');
    expect(await Pago.count()).toBe(1);
  });

  it('una cuota que no existe responde 404', async () => {
    expect((await pagar(UUID_INEXISTENTE)).status).toBe(404);
  });

  it('avisa al socio que su pago quedó registrado', async () => {
    const pendiente = await cuota();

    await pagar(pendiente.id);

    const aviso = await Notificacion.findOne({ where: { tipo: 'pago_registrado', usuario_id: socio.id } });
    expect(aviso.titulo).toBe('Registramos tu pago');
    expect(aviso.mensaje).toContain('$10.000 por la cuota de 11/2026');
  });

  it('avisa a los otros admins que hay un pago por confirmar, pero no a quien lo cargó', async () => {
    const pendiente = await cuota();

    await pagar(pendiente.id);

    const avisos = await Notificacion.findAll({ where: { tipo: 'pago_por_confirmar' } });
    expect(avisos.map((a) => a.usuario_id)).toEqual([otroAdmin.id]);
    expect(avisos[0].mensaje).toContain('Empresa Socia SA');
  });

  it('genera el comprobante, se lo manda por mail al socio y lo guarda en Cloudinary', async () => {
    const pendiente = await cuota();

    await pagar(pendiente.id);

    expect(generarComprobantePago).toHaveBeenCalledOnce();
    expect(enviarMailComprobantePago).toHaveBeenCalledWith('socia@test.com', expect.objectContaining({ razonSocial: 'Empresa Socia SA', mesAnio: '2026-11' }), PDF);
    const pago = await Pago.findOne({ where: { cuota_id: pendiente.id } });
    expect(subirPDFCloudinary).toHaveBeenCalledWith(PDF, { folder: 'capymef_comprobantes_pago', public_id: `comprobante-${pago.id}` });
    expect(pago.urlComprobante).toBe(URL_COMPROBANTE);
  });

  it('si falla el mail, el pago queda registrado igual y el comprobante se guarda', async () => {
    enviarMailComprobantePago.mockRejectedValue(new Error('SMTP caído'));
    const pendiente = await cuota();

    expect((await pagar(pendiente.id)).status).toBe(200);
    expect((await Pago.findOne({ where: { cuota_id: pendiente.id } })).urlComprobante).toBe(URL_COMPROBANTE);
  });

  it('si falla Cloudinary, el pago queda registrado sin URL (el comprobante se regenera al descargarlo)', async () => {
    subirPDFCloudinary.mockRejectedValue(new Error('Cloudinary no responde'));
    const pendiente = await cuota();

    expect((await pagar(pendiente.id)).status).toBe(200);
    expect((await Pago.findOne({ where: { cuota_id: pendiente.id } })).urlComprobante).toBeNull();
  });

  it('si falla el PDF, el pago queda registrado igual (sin mail ni Cloudinary)', async () => {
    generarComprobantePago.mockRejectedValue(new Error('pdfkit falló'));
    const pendiente = await cuota();

    expect((await pagar(pendiente.id)).status).toBe(200);
    expect((await pendiente.reload()).estado).toBe('pagada');
    expect(enviarMailComprobantePago).not.toHaveBeenCalled();
    expect(subirPDFCloudinary).not.toHaveBeenCalled();
  });
});

// ==========================================
// REDESCARGA DEL COMPROBANTE (admin)
// ==========================================
describe('GET /api/cuotas/:id/comprobante', () => {
  const pagadaCon = async (datosPago = {}) => {
    const pagada = await cuota({ estado: 'pagada' });
    await Pago.create({ cuota_id: pagada.id, usuario_id: socio.id, montoAbonado: 10000, ...datosPago });
    return pagada;
  };

  it('si el comprobante está guardado en Cloudinary redirige a ese archivo (el original del momento del pago)', async () => {
    const pagada = await pagadaCon({ urlComprobante: URL_COMPROBANTE });

    const respuesta = await comoAdmin(request(app).get(`/api/cuotas/${pagada.id}/comprobante`));

    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.location).toBe(URL_COMPROBANTE);
    expect(generarComprobantePago).not.toHaveBeenCalled();
  });

  it('si no está guardado (pagos viejos) lo regenera y lo manda como PDF descargable', async () => {
    const pagada = await pagadaCon();

    const respuesta = await comoAdmin(request(app).get(`/api/cuotas/${pagada.id}/comprobante`)).buffer(true);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toBe('application/pdf');
    expect(respuesta.headers['content-disposition']).toBe('attachment; filename="comprobante-2026-11.pdf"');
    expect(Buffer.from(respuesta.body).equals(PDF)).toBe(true);
  });

  it('una cuota sin pago registrado responde 400', async () => {
    const pendiente = await cuota();

    const respuesta = await comoAdmin(request(app).get(`/api/cuotas/${pendiente.id}/comprobante`));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Esta cuota todavía no tiene un pago registrado.');
  });

  it('una cuota que no existe responde 404', async () => {
    expect((await comoAdmin(request(app).get(`/api/cuotas/${UUID_INEXISTENTE}/comprobante`))).status).toBe(404);
  });
});

// ==========================================
// TESORERÍA: confirmación contra el banco
// ==========================================
describe('Tesorería: GET /pagos/sin-confirmar y PUT /pagos/confirmar', () => {
  const pagoDe = async (mes, datos = {}) => {
    const pagada = await cuota({ mes_anio: mes, estado: 'pagada' });
    return Pago.create({ cuota_id: pagada.id, usuario_id: socio.id, montoAbonado: 10000, ...datos });
  };
  const confirmar = (pagoIds) => comoAdmin(request(app).put('/api/cuotas/pagos/confirmar')).send({ pagoIds });

  it('lista solo los pagos que Tesorería todavía no confirmó', async () => {
    const sinConfirmar = await pagoDe('2026-10');
    await pagoDe('2026-11', { confirmadoAt: new Date(), confirmadoPor: admin.id });

    const respuesta = await comoAdmin(request(app).get('/api/cuotas/pagos/sin-confirmar'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].id).toBe(sinConfirmar.id);
    expect(respuesta.body.data[0].socio.razonSocial).toBe('Empresa Socia SA');
  });

  it('confirma varios pagos a la vez y guarda quién y cuándo', async () => {
    const p1 = await pagoDe('2026-10');
    const p2 = await pagoDe('2026-11');

    const respuesta = await confirmar([p1.id, p2.id]);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.confirmados.sort()).toEqual([p1.id, p2.id].sort());
    for (const pago of [p1, p2]) {
      await pago.reload();
      expect(pago.confirmadoPor).toBe(admin.id);
      expect(pago.confirmadoAt).toBeInstanceOf(Date);
    }
  });

  it('informa por separado los que ya estaban confirmados y los ids que no existen', async () => {
    const yaConfirmado = await pagoDe('2026-10', { confirmadoAt: new Date('2026-10-20T12:00:00Z'), confirmadoPor: otroAdmin.id });
    const nuevo = await pagoDe('2026-11');

    const respuesta = await confirmar([yaConfirmado.id, nuevo.id, UUID_INEXISTENTE]);

    expect(respuesta.body).toMatchObject({
      confirmados: [nuevo.id],
      yaEstabanConfirmados: [yaConfirmado.id],
      idsNoEncontrados: [UUID_INEXISTENTE],
    });
    // La confirmación original no se pisa.
    expect((await yaConfirmado.reload()).confirmadoPor).toBe(otroAdmin.id);
  });

  it('avisa al socio que su pago fue verificado', async () => {
    const pago = await pagoDe('2026-11');

    await confirmar([pago.id]);

    const aviso = await Notificacion.findOne({ where: { tipo: 'pago_confirmado', usuario_id: socio.id } });
    expect(aviso.mensaje).toBe('Tesorería verificó tu pago de $10.000.');
  });

  it('da por leídas las alertas "pago por confirmar" de los admins de esos pagos', async () => {
    const pendiente = await cuota();
    await pagar(pendiente.id);
    const pago = await Pago.findOne({ where: { cuota_id: pendiente.id } });

    await confirmar([pago.id]);

    const alerta = await Notificacion.findOne({ where: { tipo: 'pago_por_confirmar' } });
    expect(alerta.leida).toBe(true);
  });

  it('confirmar no cambia el estado de la cuota (ya estaba pagada)', async () => {
    const pago = await pagoDe('2026-11');

    await confirmar([pago.id]);

    expect((await Cuota.findByPk(pago.cuota_id)).estado).toBe('pagada');
  });

  it.each([
    ['sin pagoIds', undefined],
    ['con una lista vacía', []],
    ['con un texto en vez de una lista', 'un-id'],
  ])('%s responde 400', async (_, pagoIds) => {
    const respuesta = await confirmar(pagoIds);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Debe enviar al menos un ID de pago en "pagoIds".');
  });

  it('si ninguno de los ids existe responde 404', async () => {
    expect((await confirmar([UUID_INEXISTENTE])).status).toBe(404);
  });
});

// ==========================================
// EJECUCIONES MANUALES DE LAS TAREAS DEL CRON
// ==========================================
describe('ejecuciones manuales (respaldo del cron)', () => {
  it('POST /generar-manual genera las cuotas del mes e informa cuántas', async () => {
    const respuesta = await comoAdmin(request(app).post('/api/cuotas/generar-manual'));

    expect(respuesta.status).toBe(200);
    // Solo el socio Activo: los dos admins no pagan cuota.
    expect(respuesta.body.data.creadas).toBe(1);
    expect(respuesta.body.mensaje).toMatch(/^Proceso finalizado\. Se generaron 1 cuotas para el periodo \d{4}-\d{2}\.$/);
  });

  it('POST /marcar-vencidas cierra la ventana de pago e informa vencidas y cambios de categoría', async () => {
    await cuota({ mes_anio: '2020-01', fecha_vencimiento: '2020-01-10' });

    const respuesta = await comoAdmin(request(app).post('/api/cuotas/marcar-vencidas'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.marcadas).toBe(1);
    expect(respuesta.body.mensaje).toBe('Proceso finalizado. 1 cuotas pasaron a vencidas. 0 socio(s) pasaron a Adherente por mora y 0 volvieron a Activo.');
  });

  it('POST /enviar-recordatorios avisa a quien tiene una cuota por vencer', async () => {
    await cuota({ mes_anio: '2099-01', fecha_vencimiento: '2099-01-10' });

    const respuesta = await comoAdmin(request(app).post('/api/cuotas/enviar-recordatorios'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('Proceso finalizado. Se enviaron 1 recordatorio(s).');
  });

  it('si la generación falla responde 500 con un mensaje genérico', async () => {
    vi.spyOn(Cuota, 'findOne').mockRejectedValue(new Error('base caída'));

    const respuesta = await comoAdmin(request(app).post('/api/cuotas/generar-manual'));

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error al generar las cuotas mensuales.' });
  });
});
