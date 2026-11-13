import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// La subida del comprobante a Cloudinary y su borrado son falsos (nada sale a internet). La subida falsa
// pone un archivo en req.file solo si la petición trae el encabezado "x-con-comprobante".
vi.mock('../../middlewares/multer/multerCloudinary.js', () => ({
  uploadGasto: {
    single: () => (req, res, next) => {
      if (req.headers['x-con-comprobante']) {
        req.file = { path: 'https://res.cloudinary.com/demo/image/upload/v1/capymef/ticket.jpg', filename: 'capymef/ticket' };
      }
      next();
    },
  },
}));
// Se simula solo lo que hablaría con Cloudinary (borrar y subir); el resto del servicio es el real.
vi.mock('../../services/cloudinary.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  eliminarArchivoDeCloudinary: vi.fn(),
  eliminarImagenCloudinary: vi.fn(),
  subirPDFCloudinary: vi.fn(),
}));

const { eliminarArchivoDeCloudinary } = await import('../../services/cloudinary.service.js');
const { Gasto } = await import('../../models/gasto.models.js');
const { Auditoria } = await import('../../models/auditoria.models.js');
const { default: gastoRoutes } = await import('../../routes/gasto.routes.js');
const { interceptorAuditoria } = await import('../../middlewares/auditoria.middleware.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// Igual que en app.js: el interceptor de auditoría delante de /api.
const app = express();
app.use(express.json());
app.use('/api', interceptorAuditoria);
app.use('/api/gastos', gastoRoutes);

let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
  tokenAdmin = jwt.sign({ id: (await crearUsuario({ rol: 'admin' })).id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: (await crearUsuario({ rol: 'socio' })).id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);
const registrar = (body, { conComprobante = false } = {}) => {
  const req = comoAdmin(request(app).post('/api/gastos'));
  if (conComprobante) req.set('x-con-comprobante', '1');
  return req.send(body);
};
const gastoValido = { fecha: '2026-11-05', concepto: 'Factura REFSA Luz', monto: 15400.5 };

describe('acceso a /api/gastos', () => {
  it('sin token responde 401 y con token de socio 403 (los gastos son solo de administración)', async () => {
    expect((await request(app).get('/api/gastos')).status).toBe(401);
    expect((await request(app).get('/api/gastos').set('Authorization', `Bearer ${tokenSocio}`)).status).toBe(403);
  });

  it('un socio tampoco puede registrar ni borrar gastos', async () => {
    const conSocio = (req) => req.set('Authorization', `Bearer ${tokenSocio}`);
    const gasto = await Gasto.create(gastoValido);

    expect((await conSocio(request(app).post('/api/gastos')).send(gastoValido)).status).toBe(403);
    expect((await conSocio(request(app).delete(`/api/gastos/${gasto.id}`))).status).toBe(403);
    expect(await Gasto.count()).toBe(1);
  });
});

describe('POST /api/gastos', () => {
  it('registra el egreso y responde 201', async () => {
    const respuesta = await registrar({ ...gastoValido, medio_pago: 'Efectivo' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.mensaje).toBe('Gasto registrado correctamente.');
    const [guardado] = await Gasto.findAll();
    expect(guardado).toMatchObject({ fecha: '2026-11-05', concepto: 'Factura REFSA Luz', medio_pago: 'Efectivo' });
    expect(Number(guardado.monto)).toBe(15400.5);
  });

  it('sin medio de pago usa Transferencia', async () => {
    await registrar(gastoValido);

    expect((await Gasto.findOne()).medio_pago).toBe('Transferencia');
  });

  it('con comprobante adjunto guarda la URL del archivo subido', async () => {
    await registrar(gastoValido, { conComprobante: true });

    expect((await Gasto.findOne()).url_comprobante).toBe('https://res.cloudinary.com/demo/image/upload/v1/capymef/ticket.jpg');
  });

  it('sin comprobante el gasto se registra igual, sin URL', async () => {
    await registrar(gastoValido);

    expect((await Gasto.findOne()).url_comprobante).toBeNull();
  });

  it('queda en la auditoría con el monto y el concepto', async () => {
    await registrar(gastoValido);

    await vi.waitFor(async () => expect(await Auditoria.count({ where: { codigoTecnico: 'CREATE_GASTO_OPERATIVO' } })).toBe(1));
    const registro = await Auditoria.findOne({ where: { codigoTecnico: 'CREATE_GASTO_OPERATIVO' } });
    expect(registro.descripcion).toBe('Se registró un egreso por $15400.5 (Concepto: Factura REFSA Luz)');
  });

  it('sin concepto lo corta el validador con 400, no guarda nada y borra el comprobante ya subido', async () => {
    const respuesta = await registrar({ fecha: '2026-11-05', monto: 100 }, { conComprobante: true });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual([{ campo: 'concepto', mensaje: 'El concepto del gasto es obligatorio.' }]);
    expect(await Gasto.count()).toBe(0);
    // Se borra a partir de la URL del archivo subido (así sabe si es privado o público).
    await vi.waitFor(() => expect(eliminarArchivoDeCloudinary).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/capymef/ticket.jpg'));
  });

  it('si falla la base, responde 500 sin mostrar el error interno y borra el comprobante ya subido', async () => {
    vi.spyOn(Gasto, 'create').mockRejectedValue(new Error('relation "gastos" does not exist'));

    const respuesta = await registrar(gastoValido, { conComprobante: true });

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error interno del servidor.' });
    expect(eliminarArchivoDeCloudinary).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/capymef/ticket.jpg');
  });
});

describe('GET /api/gastos', () => {
  it('lista los gastos del más reciente al más viejo (por fecha del gasto)', async () => {
    await Gasto.create({ ...gastoValido, fecha: '2026-09-01', concepto: 'Septiembre' });
    await Gasto.create({ ...gastoValido, fecha: '2026-11-01', concepto: 'Noviembre' });
    await Gasto.create({ ...gastoValido, fecha: '2026-10-01', concepto: 'Octubre' });

    const respuesta = await comoAdmin(request(app).get('/api/gastos'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((g) => g.concepto)).toEqual(['Noviembre', 'Octubre', 'Septiembre']);
  });

  it('no muestra los gastos eliminados', async () => {
    const borrado = await Gasto.create(gastoValido);
    await borrado.destroy();

    expect((await comoAdmin(request(app).get('/api/gastos'))).body.data).toEqual([]);
  });
});

describe('DELETE /api/gastos/:id', () => {
  it('hace un borrado lógico: deja de listarse pero sigue en la base (por seguridad contable)', async () => {
    const gasto = await Gasto.create(gastoValido);

    const respuesta = await comoAdmin(request(app).delete(`/api/gastos/${gasto.id}`));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('Gasto eliminado del registro.');
    expect(await Gasto.findByPk(gasto.id)).toBeNull();
    const conBorrados = await Gasto.findByPk(gasto.id, { paranoid: false });
    expect(conBorrados.deletedAt).toBeInstanceOf(Date);
  });

  it('queda en la auditoría qué gasto se eliminó', async () => {
    const gasto = await Gasto.create(gastoValido);

    await comoAdmin(request(app).delete(`/api/gastos/${gasto.id}`));

    await vi.waitFor(async () => expect(await Auditoria.count({ where: { codigoTecnico: 'DELETE_GASTO_OPERATIVO' } })).toBe(1));
    const registro = await Auditoria.findOne({ where: { codigoTecnico: 'DELETE_GASTO_OPERATIVO' } });
    expect(registro.descripcion).toContain('Factura REFSA Luz');
  });

  it('un gasto que no existe responde 404', async () => {
    expect((await comoAdmin(request(app).delete('/api/gastos/00000000-0000-4000-8000-000000000000'))).status).toBe(404);
  });

  it('un id que no es UUID responde 400', async () => {
    expect((await comoAdmin(request(app).delete('/api/gastos/123'))).status).toBe(400);
  });
});
