import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Rutas del socio logueado en /api/pagos: ver sus cuotas, descargar sus comprobantes e iniciar un pago.
// (El webhook y el retorno de Mercado Pago tienen sus propios archivos de test.)
// Nada sale a internet: Mercado Pago, la descarga del PDF guardado y la generación del PDF son falsos.
vi.mock('../../services/pasarela.service.js', () => ({ crearOrdenDePago: vi.fn(), procesarNotificacionPago: vi.fn() }));
vi.mock('../../services/comprobanteGuardado.service.js', async (importOriginal) => ({ ...(await importOriginal()), descargarPdfGuardado: vi.fn() }));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn(), enviarMailRecuperacion: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({ subirPDFCloudinary: vi.fn(), eliminarImagenCloudinary: vi.fn(), extraerPublicIdDeUrl: vi.fn() }));

const { crearOrdenDePago } = await import('../../services/pasarela.service.js');
const { descargarPdfGuardado } = await import('../../services/comprobanteGuardado.service.js');
const { generarComprobantePago } = await import('../../services/comprobante.service.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { default: pagoRoutes } = await import('../../routes/pago.routes.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const app = express();
app.use(express.json());
app.use('/api/pagos', pagoRoutes);

const PDF_GUARDADO = Buffer.from('%PDF-1.4 el original guardado');
const PDF_REGENERADO = Buffer.from('%PDF-1.4 regenerado');
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

let yo;
let otro;
let token;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  crearOrdenDePago.mockResolvedValue({ initPoint: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123' });
  descargarPdfGuardado.mockResolvedValue(PDF_GUARDADO);
  generarComprobantePago.mockResolvedValue(PDF_REGENERADO);
  await reiniciarBase();
  yo = await crearUsuario({ razonSocial: 'Mi Empresa SRL' });
  otro = await crearUsuario();
  token = jwt.sign({ id: yo.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const conToken = (req) => req.set('Authorization', `Bearer ${token}`);
const cuota = (usuario, datos = {}) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente', ...datos });
const pagadaCon = async (usuario, datosPago = {}) => {
  const pagada = await cuota(usuario, { estado: 'pagada' });
  await Pago.create({ cuota_id: pagada.id, usuario_id: usuario.id, montoAbonado: 10000, urlComprobante: 'https://res.cloudinary.com/demo/raw/upload/c.pdf', ...datosPago });
  return pagada;
};

describe('GET /api/pagos/mis-cuotas', () => {
  it('sin token responde 401', async () => {
    expect((await request(app).get('/api/pagos/mis-cuotas')).status).toBe(401);
  });

  it('devuelve solo las cuotas del socio del token, la más reciente primero', async () => {
    await cuota(yo, { mes_anio: '2026-10' });
    await cuota(yo, { mes_anio: '2026-11' });
    await cuota(otro, { mes_anio: '2026-11' });

    const respuesta = await conToken(request(app).get('/api/pagos/mis-cuotas'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((c) => c.mes_anio)).toEqual(['2026-11', '2026-10']);
  });

  it('cada cuota pagada trae su pago, sin los datos internos de Tesorería ni la URL de Cloudinary del comprobante', async () => {
    await pagadaCon(yo, { confirmadoPor: 99, confirmadoAt: new Date(), observaciones: 'nota interna' });

    const [conPago] = (await conToken(request(app).get('/api/pagos/mis-cuotas'))).body.data;

    expect(Object.keys(conPago.pago).sort()).toEqual(['fechaPago', 'id', 'metodoPago', 'montoAbonado', 'origenPago', 'tieneComprobante']);
  });

  it('una cuota pendiente viene con pago null', async () => {
    await cuota(yo);

    expect((await conToken(request(app).get('/api/pagos/mis-cuotas'))).body.data[0].pago).toBeNull();
  });
});

describe('GET /api/pagos/mis-cuotas/:id/comprobante', () => {
  const descargar = (id) => conToken(request(app).get(`/api/pagos/mis-cuotas/${id}/comprobante`)).buffer(true);

  it('entrega el MISMO PDF que se guardó al pagar, como archivo descargable', async () => {
    const pagada = await pagadaCon(yo);

    const respuesta = await descargar(pagada.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toBe('application/pdf');
    expect(respuesta.headers['content-disposition']).toBe('attachment; filename="comprobante-2026-11.pdf"');
    expect(Buffer.from(respuesta.body).equals(PDF_GUARDADO)).toBe(true);
    expect(descargarPdfGuardado).toHaveBeenCalledWith('https://res.cloudinary.com/demo/raw/upload/c.pdf');
    expect(generarComprobantePago).not.toHaveBeenCalled();
  });

  it('si el guardado no está o no se puede traer, lo regenera (plan B)', async () => {
    descargarPdfGuardado.mockResolvedValue(null);
    const pagada = await pagadaCon(yo, { urlComprobante: null });

    const respuesta = await descargar(pagada.id);

    expect(respuesta.status).toBe(200);
    expect(Buffer.from(respuesta.body).equals(PDF_REGENERADO)).toBe(true);
  });

  it('el comprobante de la cuota de OTRO socio responde 404 (no se confirma que exista)', async () => {
    const ajena = await pagadaCon(otro);

    const respuesta = await descargar(ajena.id);

    expect(respuesta.status).toBe(404);
    expect(descargarPdfGuardado).not.toHaveBeenCalled();
  });

  it('una cuota propia sin pagar responde 400', async () => {
    const pendiente = await cuota(yo);

    const respuesta = await descargar(pendiente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Esta cuota todavía no tiene un pago registrado.');
  });

  it('un id que no es UUID responde 400', async () => {
    expect((await descargar('abc')).status).toBe(400);
  });
});

describe('POST /api/pagos/:id/iniciar', () => {
  const iniciar = (id) => conToken(request(app).post(`/api/pagos/${id}/iniciar`));

  it('devuelve el link de Mercado Pago para pagar la cuota propia', async () => {
    const pendiente = await cuota(yo);

    const respuesta = await iniciar(pendiente.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual({ linkPago: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123' });
    expect(crearOrdenDePago).toHaveBeenCalledWith(expect.objectContaining({ id: pendiente.id }));
  });

  it('no deja pagar la cuota de otro socio: 403 SIN_PERMISOS (la sesión sigue siendo válida)', async () => {
    const ajena = await cuota(otro);

    const respuesta = await iniciar(ajena.id);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('SIN_PERMISOS');
    expect(crearOrdenDePago).not.toHaveBeenCalled();
  });

  it('una cuota ya pagada responde 400 sin crear otra orden', async () => {
    const pagada = await pagadaCon(yo);

    const respuesta = await iniciar(pagada.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Esta cuota ya fue abonada anteriormente.');
    expect(crearOrdenDePago).not.toHaveBeenCalled();
  });

  it('una cuota que no existe responde 404', async () => {
    expect((await iniciar(UUID_INEXISTENTE)).status).toBe(404);
  });

  it('si Mercado Pago falla responde 500 con un mensaje genérico', async () => {
    crearOrdenDePago.mockRejectedValue(new Error('MP no responde'));
    const pendiente = await cuota(yo);

    const respuesta = await iniciar(pendiente.id);

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error interno del servidor al iniciar el pago.' });
  });

  it('sin token responde 401', async () => {
    expect((await request(app).post(`/api/pagos/${UUID_INEXISTENTE}/iniciar`)).status).toBe(401);
  });
});
