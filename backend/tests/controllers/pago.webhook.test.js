import '../helpers/entorno.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Nada de esto puede salir del test: la consulta a Mercado Pago, los mails y las subidas a
// Cloudinary se reemplazan por funciones falsas. Por defecto procesarNotificacionPago devuelve un
// pago "no aprobado", así el controlador responde 200 justo después. Los tests de un pago aprobado
// lo cambian, y para esos casos también se simulan los modelos (no se toca ninguna base).
vi.mock('../../services/pasarela.service.js', () => ({
  crearOrdenDePago: vi.fn(),
  procesarNotificacionPago: vi.fn(async () => ({ aprobado: false })),
}));
vi.mock('../../config/mailer.js', () => ({ enviarMailComprobantePago: vi.fn() }));
vi.mock('../../services/cloudinary.service.js', () => ({ subirPDFCloudinary: vi.fn() }));
vi.mock('../../services/comprobante.service.js', () => ({ generarComprobantePago: vi.fn() }));
vi.mock('../../services/notificacion.service.js', () => ({
  crearNotificacion: vi.fn(),
  notificarAdmins: vi.fn(),
  formatearMonto: (monto) => `$${monto}`,
  formatearPeriodo: (periodo) => periodo,
}));
vi.mock('../../services/categoria.service.js', () => ({ evaluarCategoriaSocio: vi.fn() }));
vi.mock('../../models/cuota.models.js', () => ({ Cuota: { findByPk: vi.fn() } }));
vi.mock('../../models/pago.models.js', () => ({ Pago: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../models/user.models.js', () => ({ User: {} }));

const { procesarNotificacionPago } = await import('../../services/pasarela.service.js');
const { enviarMailComprobantePago } = await import('../../config/mailer.js');
const { subirPDFCloudinary } = await import('../../services/cloudinary.service.js');
const { generarComprobantePago } = await import('../../services/comprobante.service.js');
const { crearNotificacion, notificarAdmins } = await import('../../services/notificacion.service.js');
const { evaluarCategoriaSocio } = await import('../../services/categoria.service.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Pago } = await import('../../models/pago.models.js');
const { recibirWebhook } = await import('../../controllers/pago.controllers.js');

// App mínima solo con el controlador (sin el middleware de firma, que tiene sus propios tests):
// acá se prueba qué id procesa el controlador.
const app = express();
app.use(express.json());
app.post('/webhook', recibirWebhook);

beforeEach(() => {
  procesarNotificacionPago.mockClear();
});

describe('recibirWebhook - qué id de pago procesa', () => {
  it('con data.id e id distintos en la query, procesa data.id (el que cubre la firma) y nunca id', async () => {
    // Si se procesara "id", un aviso firmado para A podría usarse para hacer procesar B.
    const respuesta = await request(app).post('/webhook?type=payment&data.id=AAA111&id=BBB222').send({});

    expect(respuesta.status).toBe(200);
    expect(procesarNotificacionPago).toHaveBeenCalledTimes(1);
    expect(procesarNotificacionPago).toHaveBeenCalledWith('AAA111');
    expect(procesarNotificacionPago).not.toHaveBeenCalledWith('BBB222');
  });

  it('con solo data.id en la query, procesa ese id', async () => {
    await request(app).post('/webhook?type=payment&data.id=123456').send({});

    expect(procesarNotificacionPago).toHaveBeenCalledWith('123456');
  });

  it('con solo id en la query (formato viejo), procesa ese id', async () => {
    await request(app).post('/webhook?topic=payment&id=654321').send({});

    expect(procesarNotificacionPago).toHaveBeenCalledWith('654321');
  });

  it('con el id solo en el cuerpo (body.data.id), procesa ese id', async () => {
    await request(app).post('/webhook').send({ type: 'payment', data: { id: '777888' } });

    expect(procesarNotificacionPago).toHaveBeenCalledWith('777888');
  });

  it('con data.id en el cuerpo e id en la query, procesa el del cuerpo', async () => {
    // El cuerpo es el respaldo que usa el middleware de firma: va antes que el formato viejo.
    await request(app).post('/webhook?id=BBB222').send({ type: 'payment', data: { id: 'AAA111' } });

    expect(procesarNotificacionPago).toHaveBeenCalledWith('AAA111');
  });
});

describe('recibirWebhook - avisos que no se procesan', () => {
  it('sin ningún id responde 200 { recibido: true } y no consulta el pago', async () => {
    const respuesta = await request(app).post('/webhook?type=payment').send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(procesarNotificacionPago).not.toHaveBeenCalled();
  });

  it('con un topic distinto de payment (merchant_order) responde 200 y no consulta el pago', async () => {
    const respuesta = await request(app).post('/webhook?topic=merchant_order&id=999').send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(procesarNotificacionPago).not.toHaveBeenCalled();
  });
});

// ==========================================
// Pago aprobado: se responde apenas queda registrado y el resto se hace después
// ==========================================
describe('recibirWebhook - pago aprobado: respuesta inmediata y trabajo en segundo plano', () => {
  let cuota;
  let nuevoPago;
  let rechazosSinCapturar;
  const anotarRechazo = (motivo) => rechazosSinCapturar.push(motivo);
  let espiaError;

  // Arma un pago aprobado simulado: la cuota pendiente, el pago que se crea y los servicios que
  // responden bien. Cada test cambia solo lo que le importa.
  beforeEach(() => {
    vi.resetAllMocks();
    cuota = {
      id: 'cuota-1',
      usuario_id: 7,
      estado: 'pendiente',
      mes_anio: '2026-11',
      socio: { razonSocial: 'Empresa de prueba', email: 'socio@test.com', cuit: '20-00000001-1' },
      save: vi.fn(async () => {}),
    };
    nuevoPago = { id: 'pago-1', montoAbonado: 10000, save: vi.fn(async () => {}) };

    procesarNotificacionPago.mockResolvedValue({
      aprobado: true, cuotaId: cuota.id, montoPagado: 10000, idTransaccionExterna: 'mp-555',
    });
    Cuota.findByPk.mockResolvedValue(cuota);
    Pago.findOne.mockResolvedValue(null);
    Pago.create.mockResolvedValue(nuevoPago);
    evaluarCategoriaSocio.mockResolvedValue(undefined);
    generarComprobantePago.mockResolvedValue(Buffer.from('%PDF-1.4 comprobante'));
    enviarMailComprobantePago.mockResolvedValue(undefined);
    subirPDFCloudinary.mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/comprobante-pago-1' });
    crearNotificacion.mockResolvedValue(undefined);
    notificarAdmins.mockResolvedValue(undefined);

    // Una promesa rechazada sin capturar puede tirar abajo el proceso: se registra cualquiera que aparezca.
    rechazosSinCapturar = [];
    process.on('unhandledRejection', anotarRechazo);
    espiaError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.off('unhandledRejection', anotarRechazo);
    vi.restoreAllMocks();
  });

  const avisoDePago = () => request(app).post('/webhook?type=payment&data.id=555').send({});

  // Espera, sin sleeps, a que el segundo plano llegue al punto indicado (o a que algo lo corte), y
  // después da una vuelta más del event loop para que Node avise si quedó un rechazo sin capturar.
  const esperarSegundoPlano = async (condicion) => {
    await vi.waitFor(condicion);
    await new Promise((resolve) => setImmediate(resolve));
  };
  // El último paso del camino completo es guardar la dirección del comprobante.
  const terminoTodo = () => expect(nuevoPago.save).toHaveBeenCalled();

  it('responde 200 antes de que terminen los avisos y el comprobante', async () => {
    // Los avisos quedan "trabados" hasta que el test los libere: si la respuesta esperara al
    // segundo plano, nunca llegaría.
    let liberarAvisoSocio;
    let liberarAvisoAdmins;
    crearNotificacion.mockImplementation(() => new Promise((resolve) => { liberarAvisoSocio = resolve; }));
    notificarAdmins.mockImplementation(() => new Promise((resolve) => { liberarAvisoAdmins = resolve; }));

    const respuesta = await avisoDePago();

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    // Lo crítico ya está hecho antes de responder...
    expect(Pago.create).toHaveBeenCalledTimes(1);
    expect(cuota.estado).toBe('pagada');
    expect(cuota.save).toHaveBeenCalled();
    expect(evaluarCategoriaSocio).toHaveBeenCalledWith(7);
    // ...y lo demás todavía no terminó: los avisos están pendientes y el comprobante no arrancó.
    expect(crearNotificacion).toHaveBeenCalled();
    expect(notificarAdmins).toHaveBeenCalled();
    expect(generarComprobantePago).not.toHaveBeenCalled();

    liberarAvisoSocio();
    liberarAvisoAdmins();
    await esperarSegundoPlano(terminoTodo);
    expect(rechazosSinCapturar).toEqual([]);
  });

  it('el aviso a Tesorería no espera al comprobante (ni al mail ni a Cloudinary)', async () => {
    // El PDF queda trabado: el aviso de "pago por confirmar" tiene que salir igual.
    let liberarPdf;
    generarComprobantePago.mockImplementation(() => new Promise((resolve) => { liberarPdf = resolve; }));

    await avisoDePago();
    await vi.waitFor(() => expect(generarComprobantePago).toHaveBeenCalled());

    expect(notificarAdmins).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pago_por_confirmar' }));
    expect(crearNotificacion).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 7, tipo: 'pago_registrado' }));
    expect(enviarMailComprobantePago).not.toHaveBeenCalled();
    expect(subirPDFCloudinary).not.toHaveBeenCalled();

    liberarPdf(Buffer.from('%PDF-1.4 comprobante'));
    await esperarSegundoPlano(terminoTodo);
    expect(rechazosSinCapturar).toEqual([]);
  });

  it('después de responder, completa los dos avisos, el comprobante, el mail y Cloudinary', async () => {
    await avisoDePago();
    await esperarSegundoPlano(terminoTodo);

    expect(crearNotificacion).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 7, tipo: 'pago_registrado' }));
    expect(notificarAdmins).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pago_por_confirmar' }));
    expect(generarComprobantePago).toHaveBeenCalledTimes(1);
    expect(enviarMailComprobantePago).toHaveBeenCalledWith('socio@test.com', expect.any(Object), expect.any(Buffer));
    expect(subirPDFCloudinary).toHaveBeenCalledTimes(1);
    expect(nuevoPago.urlComprobante).toBe('https://res.cloudinary.com/demo/raw/upload/comprobante-pago-1');
    expect(rechazosSinCapturar).toEqual([]);
  });

  it('si falla el mail, igual sube el comprobante a Cloudinary', async () => {
    enviarMailComprobantePago.mockRejectedValue(new Error('SMTP caído'));

    const respuesta = await avisoDePago();
    await esperarSegundoPlano(terminoTodo);

    expect(respuesta.status).toBe(200);
    expect(subirPDFCloudinary).toHaveBeenCalledTimes(1);
    expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('mail'), 'SMTP caído');
    expect(rechazosSinCapturar).toEqual([]);
  });

  it('si falla el aviso al socio, el aviso a Tesorería y el comprobante se hacen igual', async () => {
    crearNotificacion.mockRejectedValue(new Error('falla del aviso al socio'));

    await avisoDePago();
    await esperarSegundoPlano(terminoTodo);

    expect(rechazosSinCapturar).toEqual([]);
    expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('aviso del pago online pago-1'), expect.any(Error));
    expect(notificarAdmins).toHaveBeenCalled();
    expect(generarComprobantePago).toHaveBeenCalled();
    expect(enviarMailComprobantePago).toHaveBeenCalled();
    expect(subirPDFCloudinary).toHaveBeenCalled();
  });

  it('si falla el aviso a Tesorería, el aviso al socio y el comprobante se hacen igual', async () => {
    notificarAdmins.mockRejectedValue(new Error('falla del aviso a admins'));

    await avisoDePago();
    await esperarSegundoPlano(terminoTodo);

    expect(rechazosSinCapturar).toEqual([]);
    expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('aviso del pago online pago-1'), expect.any(Error));
    expect(crearNotificacion).toHaveBeenCalled();
    expect(subirPDFCloudinary).toHaveBeenCalled();
  });

  it('si falla el generador del PDF, no hay error sin capturar ni segunda respuesta, y los avisos ya salieron', async () => {
    generarComprobantePago.mockRejectedValue(new Error('PDF roto'));

    const respuesta = await avisoDePago();
    await esperarSegundoPlano(() => expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('generar el comprobante'), 'PDF roto'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ recibido: true });
    expect(rechazosSinCapturar).toEqual([]);
    // Un intento de responder dos veces terminaría en el catch general con este mensaje: no tiene que aparecer.
    expect(espiaError).not.toHaveBeenCalledWith('Error al procesar webhook de Mercado Pago:', expect.anything());
    expect(crearNotificacion).toHaveBeenCalled();
    expect(notificarAdmins).toHaveBeenCalled();
    expect(enviarMailComprobantePago).not.toHaveBeenCalled();
    expect(subirPDFCloudinary).not.toHaveBeenCalled();
  });

  it('si algo falla fuera de los try internos (cuota sin socio), queda en el log y no hay error sin capturar', async () => {
    // Por ejemplo, un socio dado de baja: lo crítico no usa sus datos, así que el pago se registra,
    // pero armar el texto del aviso a Tesorería falla. Lo atrapa el try/catch general del segundo plano.
    cuota.socio = null;

    const respuesta = await avisoDePago();
    await esperarSegundoPlano(() => {
      expect(espiaError.mock.calls.length + rechazosSinCapturar.length).toBeGreaterThan(0);
    });

    expect(respuesta.status).toBe(200);
    expect(rechazosSinCapturar).toEqual([]);
    expect(espiaError).toHaveBeenCalledWith(expect.stringContaining('trabajo posterior al pago pago-1'), expect.any(TypeError));
    // Los textos se arman antes de llamar a nada: no queda ningún aviso lanzado a medias.
    expect(crearNotificacion).not.toHaveBeenCalled();
    expect(notificarAdmins).not.toHaveBeenCalled();
  });

  // Respuestas tempranas: responden 200 y no llegan nunca al segundo plano.
  const segundoPlanoNoArranco = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    expect(generarComprobantePago).not.toHaveBeenCalled();
    expect(crearNotificacion).not.toHaveBeenCalled();
    expect(notificarAdmins).not.toHaveBeenCalled();
  };

  it('cuota ya pagada: responde 200 sin registrar nada ni llegar al segundo plano', async () => {
    cuota.estado = 'pagada';

    const respuesta = await avisoDePago();

    expect(respuesta.status).toBe(200);
    expect(Pago.create).not.toHaveBeenCalled();
    await segundoPlanoNoArranco();
  });

  it('cuota inexistente: responde 200 sin llegar al segundo plano', async () => {
    Cuota.findByPk.mockResolvedValue(null);

    expect((await avisoDePago()).status).toBe(200);
    await segundoPlanoNoArranco();
  });

  it('pago ya registrado (misma transacción): responde 200 sin llegar al segundo plano', async () => {
    Pago.findOne.mockResolvedValue({ id: 'pago-anterior' });

    const respuesta = await avisoDePago();

    expect(respuesta.status).toBe(200);
    expect(Pago.create).not.toHaveBeenCalled();
    await segundoPlanoNoArranco();
  });

  it('aviso duplicado (restricción única al crear el pago): responde 200 sin llegar al segundo plano', async () => {
    const duplicado = new Error('duplicado');
    duplicado.name = 'SequelizeUniqueConstraintError';
    Pago.create.mockRejectedValue(duplicado);

    const respuesta = await avisoDePago();

    expect(respuesta.status).toBe(200);
    expect(cuota.save).not.toHaveBeenCalled();
    await segundoPlanoNoArranco();
  });

  it('pago no aprobado: responde 200 sin llegar al segundo plano', async () => {
    procesarNotificacionPago.mockResolvedValue({ aprobado: false });

    expect((await avisoDePago()).status).toBe(200);
    expect(Cuota.findByPk).not.toHaveBeenCalled();
    await segundoPlanoNoArranco();
  });
});
