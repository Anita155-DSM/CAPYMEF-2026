import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import { Cuota } from '../../models/cuota.models.js';
import { Evento } from '../../models/evento.models.js';
import { Tarifa } from '../../models/tarifa.models.js';
import { Auditoria } from '../../models/auditoria.models.js';
import adminRoutes from '../../routes/admin.routes.js';
import tarifaRoutes from '../../routes/tarifa.routes.js';
import { interceptorAuditoria } from '../../middlewares/auditoria.middleware.js';
import { asegurarTarifasIniciales } from '../../services/tarifa.service.js';
import { generarCuotasDelMes } from '../../services/cuota.service.js';
import { montoDeTarifaValido } from '../../middlewares/validator/tarifa.validator.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Igual que en app.js: el interceptor de auditoría delante de todas las rutas de /api.
const app = express();
app.use(express.json());
app.use('/api', interceptorAuditoria);
app.use('/api/admin', adminRoutes);
app.use('/api/tarifas', tarifaRoutes);

let admin;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  await reiniciarBase();
  await asegurarTarifasIniciales(); // activo $10.000; adherente, padrino y honorario $0
  admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
  const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const conToken = (req, token) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
const listar = (token = tokenAdmin) => conToken(request(app).get('/api/admin/tarifas'), token);
const cambiar = (categoria, body, token = tokenAdmin) => conToken(request(app).put(`/api/admin/tarifas/${categoria}`), token).send(body);
const montoDe = async (categoria) => Number((await Tarifa.findOne({ where: { categoria } })).monto);

describe('GET /api/admin/tarifas', () => {
  it('devuelve las tarifas de las cuatro categorías', async () => {
    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    const mapa = Object.fromEntries(respuesta.body.data.map((t) => [t.categoria, Number(t.monto)]));
    expect(mapa).toEqual({ activo: 10000, adherente: 0, honorario: 0, padrino: 0 });
  });

  it('sin token responde 401 y con token de socio 403', async () => {
    expect((await listar(null)).status).toBe(401);
    expect((await listar(tokenSocio)).status).toBe(403);
  });
});

describe('PUT /api/admin/tarifas/activo', () => {
  it('con un monto válido actualiza la tarifa de activo', async () => {
    const respuesta = await cambiar('activo', { monto: 12500.5 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.exito).toBe(true);
    expect(respuesta.body.mensaje).toContain('cuotas que se generen de ahora en adelante');
    expect(await montoDe('activo')).toBe(12500.5);
  });

  it('acepta el monto como texto con 2 decimales', async () => {
    expect((await cambiar('activo', { monto: '15000.75' })).status).toBe(200);
    expect(await montoDe('activo')).toBe(15000.75);
  });

  it('acepta el tope exacto ($10.000.000)', async () => {
    expect((await cambiar('activo', { monto: 10000000 })).status).toBe(200);
  });

  it.each([
    ['cero', 0],
    ['negativo', -5],
    ['texto', 'abc'],
    ['3 decimales', 10.123],
    ['3 decimales como texto', '10.125'],
    ['mayor al tope', 10000001],
    ['vacío', ''],
    ['null', null],
    ['booleano', true],
    ['un array', [15000]],
    ['notación científica', '1e5'],
  ])('monto inválido (%s) responde 400 y no cambia nada', async (_, monto) => {
    const respuesta = await cambiar('activo', { monto });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.exito).toBe(false);
    expect(await montoDe('activo')).toBe(10000);
  });

  it('sin monto en el cuerpo responde 400', async () => {
    expect((await cambiar('activo', {})).status).toBe(400);
  });

  it.each(['adherente', 'padrino', 'honorario'])('modificar la tarifa de %s se rechaza (por estatuto solo pagan los Activos)', async (categoria) => {
    const respuesta = await cambiar(categoria, { monto: 5000 });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toContain('Solo se puede modificar la cuota de la categoría "activo"');
    expect(await montoDe(categoria)).toBe(0);
  });

  it('una categoría que no existe responde 400', async () => {
    expect((await cambiar('vitalicio', { monto: 5000 })).status).toBe(400);
  });

  it('la ruta vieja /api/tarifas tiene la misma restricción (mismo controlador)', async () => {
    const respuesta = await conToken(request(app).put('/api/tarifas/adherente'), tokenAdmin).send({ monto: 5000 });

    expect(respuesta.status).toBe(403);
    expect(await montoDe('adherente')).toBe(0);
  });

  it('sin token responde 401 y con token de socio 403 (y no cambia nada)', async () => {
    expect((await cambiar('activo', { monto: 20000 }, null)).status).toBe(401);
    expect((await cambiar('activo', { monto: 20000 }, tokenSocio)).status).toBe(403);
    expect(await montoDe('activo')).toBe(10000);
  });
});

describe('el cambio rige solo para las cuotas que se generen después', () => {
  it('la cuota ya generada conserva el monto viejo y la del mes siguiente usa el nuevo', async () => {
    const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    // Solo se simula el reloj (Date) para generar noviembre y después diciembre.
    vi.useFakeTimers({ toFake: ['Date'] });

    vi.setSystemTime(new Date('2026-11-02T12:00:00-03:00'));
    await generarCuotasDelMes();
    expect((await cambiar('activo', { monto: 12500 })).status).toBe(200);

    vi.setSystemTime(new Date('2026-12-02T12:00:00-03:00'));
    await generarCuotasDelMes();

    const noviembre = await Cuota.findOne({ where: { usuario_id: socio.id, mes_anio: '2026-11' } });
    const diciembre = await Cuota.findOne({ where: { usuario_id: socio.id, mes_anio: '2026-12' } });
    expect(Number(noviembre.monto)).toBe(10000);
    expect(Number(diciembre.monto)).toBe(12500);
  });
});

describe('auditoría del cambio', () => {
  const registrosDeTarifa = () => Auditoria.findAll({ where: { codigoTecnico: 'UPDATE_TARIFA' } });

  it('queda registrado quién lo cambió, con el monto anterior y el nuevo', async () => {
    await cambiar('activo', { monto: 12500.5 });

    // El interceptor guarda el registro cuando termina de enviarse la respuesta.
    await vi.waitFor(async () => expect(await registrosDeTarifa()).toHaveLength(1));
    const [registro] = await registrosDeTarifa();
    expect(registro.usuarioId).toBe(admin.id);
    expect(registro.usuarioRol).toBe('admin');
    expect(registro.descripcion).toContain('de $10000 a $12500.5');
    expect(registro.createdAt).toBeInstanceOf(Date);
  });

  it('un cambio rechazado no deja registro', async () => {
    await cambiar('activo', { monto: 0 });
    await cambiar('adherente', { monto: 5000 });
    // Una petición válida después, para saber que el interceptor ya procesó las anteriores.
    await cambiar('activo', { monto: 11000 });

    await vi.waitFor(async () => expect(await registrosDeTarifa()).toHaveLength(1));
    expect((await registrosDeTarifa())[0].descripcion).toContain('a $11000');
  });
});

describe('montoDeTarifaValido', () => {
  it.each([
    [10000, true], ['10000', true], ['10000.5', true], ['10000.50', true], [0.01, true], [10000000, true],
    [0, false], ['0.00', false], [-1, false], [10.001, false], ['10,50', false], [' ', false],
    [NaN, false], [Infinity, false], [undefined, false], [{ monto: 1 }, false], [10000000.01, false],
  ])('montoDeTarifaValido(%s) = %s', (valor, esperado) => {
    expect(montoDeTarifaValido(valor)).toBe(esperado);
  });
});
