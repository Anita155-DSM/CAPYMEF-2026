import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import { Cuota } from '../../models/cuota.models.js';
import { Pago } from '../../models/pago.models.js';
import { Evento } from '../../models/evento.models.js';
import { Inscripcion } from '../../models/inscripcion.models.js';
import adminRoutes from '../../routes/admin.routes.js';
import { calcularResumenInicio, porcentaje } from '../../services/resumenInicio.service.js';
import { fechaHoyArgentina } from '../../services/cuota.service.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se lo trata como JSON
// (mismo criterio que evento.controllers.test.js). No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Router real de admin (con verificarToken y verificarAdmin) en una app mínima, como en app.js.
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const HOY = '2026-11-15'; // fecha fija: así las cifras no dependen del día en que se corren los tests

const cuota = (usuario, mes_anio, estado, monto = 10000) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio, monto, fecha_vencimiento: `${mes_anio}-10`, estado });
const pagar = (c, montoAbonado) => Pago.create({ cuota_id: c.id, usuario_id: c.usuario_id, montoAbonado });
const evento = (datos) =>
  Evento.create({ titulo: 'Evento', descripcion: 'Descripción', modalidad: 'presencial', estado: 'programado', ...datos });

beforeEach(async () => {
  await reiniciarBase();
});

afterAll(async () => {
  await cerrarBase();
});

// Escenario con números chicos (todos los socios están aprobados salvo F):
//   A activo:    nov pagada ($12.000) · oct vencida · sep vencida          → 2 vencidas → EN RIESGO
//   B activo:    nov pagada ($8.000)  · oct pagada ($10.000, otro mes)     → 0 vencidas
//   C activo:    nov vencida · oct vencida · sep vencida                    → 3 vencidas → EN RIESGO
//   D activo:    nov pendiente · oct vencida                                → 1 vencida  → no
//   E adherente: oct vencida · sep vencida                                  → 2 vencidas, pero no es Activo → no
//   F activo DADO DE BAJA: oct vencida · sep vencida                        → no cuenta en nada
// Cuentas a mano (noviembre 2026):
//   cuotas del mes: A, B, C, D = 4 · pagadas: A, B = 2 → 50%
//   recaudado: 12.000 + 8.000 = 20.000 (el pago de octubre de B NO se cuenta)
//   socios con cuotas (aprobados): A, B, C, D, E = 5 · con deuda: A, C, D, E = 4 → 80%
//   cuotas vencidas (aprobados): 2 + 3 + 1 + 2 = 8 · en riesgo: A, C = 2
const armarEscenario = async () => {
  const [a, b, c, d] = await Promise.all([1, 2, 3, 4].map(() => crearUsuario({ categoria: 'activo' })));
  const e = await crearUsuario({ categoria: 'adherente' });
  const f = await crearUsuario({ categoria: 'activo', estado: 'inactivo' });

  await pagar(await cuota(a, '2026-11', 'pagada'), 12000);
  await cuota(a, '2026-10', 'vencida');
  await cuota(a, '2026-09', 'vencida');

  await pagar(await cuota(b, '2026-11', 'pagada'), 8000);
  await pagar(await cuota(b, '2026-10', 'pagada'), 10000);

  await cuota(c, '2026-11', 'vencida');
  await cuota(c, '2026-10', 'vencida');
  await cuota(c, '2026-09', 'vencida');

  await cuota(d, '2026-11', 'pendiente');
  await cuota(d, '2026-10', 'vencida');

  await cuota(e, '2026-10', 'vencida');
  await cuota(e, '2026-09', 'vencida');

  await cuota(f, '2026-10', 'vencida');
  await cuota(f, '2026-09', 'vencida');

  return { socios: [a, b, c, d, e] };
};

describe('calcularResumenInicio - recaudación del mes', () => {
  it('suma solo los pagos de las cuotas del mes y calcula el porcentaje cobrado', async () => {
    await armarEscenario();

    const { periodo, recaudacion } = await calcularResumenInicio({ hoy: HOY });

    expect(periodo).toBe('2026-11');
    expect(recaudacion).toEqual({ montoRecaudado: 20000, cuotasDelMes: 4, cuotasPagadas: 2, porcentajeCobrado: 50 });
  });

  it('un mes sin cuotas da ceros y porcentaje null (nunca NaN ni división por cero)', async () => {
    await armarEscenario();

    const { periodo, recaudacion } = await calcularResumenInicio({ hoy: '2027-01-15' });

    expect(periodo).toBe('2027-01');
    expect(recaudacion).toEqual({ montoRecaudado: 0, cuotasDelMes: 0, cuotasPagadas: 0, porcentajeCobrado: null });
  });

  it('las cuotas de otro mes no se cuentan', async () => {
    await armarEscenario();

    // En octubre: A, B, C, D, E y F tienen cuota (6); pagada solo la de B ($10.000).
    const { recaudacion } = await calcularResumenInicio({ hoy: '2026-10-20' });

    expect(recaudacion).toEqual({ montoRecaudado: 10000, cuotasDelMes: 6, cuotasPagadas: 1, porcentajeCobrado: 16.7 });
  });
});

describe('calcularResumenInicio - morosidad', () => {
  it('cuenta socios con deuda, cuotas vencidas y socios en riesgo (solo aprobados)', async () => {
    await armarEscenario();

    const { morosidad } = await calcularResumenInicio({ hoy: HOY });

    expect(morosidad).toEqual({
      indice: 80,
      sociosConDeuda: 4,
      sociosConCuotas: 5,
      sociosEnRiesgo: 2,
      umbralRiesgo: 2,
      cuotasVencidas: 8,
    });
  });

  it('regla de riesgo: 1 vencida no está en riesgo; 2 y 3 sí (solo socios Activos)', async () => {
    const [uno, dos, tres] = await Promise.all([1, 2, 3].map(() => crearUsuario({ categoria: 'activo' })));
    const adherente = await crearUsuario({ categoria: 'adherente' });
    await cuota(uno, '2026-10', 'vencida');
    for (const mes of ['2026-09', '2026-10']) await cuota(dos, mes, 'vencida');
    for (const mes of ['2026-08', '2026-09', '2026-10']) await cuota(tres, mes, 'vencida');
    for (const mes of ['2026-08', '2026-09', '2026-10']) await cuota(adherente, mes, 'vencida');

    const { morosidad } = await calcularResumenInicio({ hoy: HOY });

    expect(morosidad.sociosEnRiesgo).toBe(2);
    expect(morosidad.sociosConDeuda).toBe(4);
  });

  it('sin socios con cuotas el índice es null, no NaN', async () => {
    const { morosidad } = await calcularResumenInicio({ hoy: HOY });

    expect(morosidad).toEqual({ indice: null, sociosConDeuda: 0, sociosConCuotas: 0, sociosEnRiesgo: 0, umbralRiesgo: 2, cuotasVencidas: 0 });
  });
});

describe('calcularResumenInicio - próximo evento', () => {
  it('es el más cercano desde hoy, no cancelado, con inscriptos y cupo', async () => {
    await evento({ titulo: 'Pasado', fecha: '2026-11-10' });
    await evento({ titulo: 'Cancelado', fecha: '2026-11-16', estado: 'cancelado' });
    const proximo = await evento({ titulo: 'Próximo', fecha: '2026-11-20', horaInicio: '18:00', cupoMaximo: 50 });
    await evento({ titulo: 'Mismo día, más tarde', fecha: '2026-11-20', horaInicio: '20:00' });
    await evento({ titulo: 'Diciembre', fecha: '2026-12-01' });
    const socios = await Promise.all([1, 2, 3].map(() => crearUsuario()));
    for (const s of socios) await Inscripcion.create({ evento_id: proximo.id, usuario_id: s.id });

    const { proximoEvento } = await calcularResumenInicio({ hoy: HOY });

    expect(proximoEvento).toEqual({
      id: proximo.id,
      titulo: 'Próximo',
      fecha: '2026-11-20',
      horaInicio: '18:00',
      modalidad: 'presencial',
      inscriptos: 3,
      cupoMaximo: 50,
      cuposDisponibles: 47,
    });
  });

  it('un evento de hoy cuenta como próximo', async () => {
    await evento({ titulo: 'Hoy', fecha: HOY });

    expect((await calcularResumenInicio({ hoy: HOY })).proximoEvento.titulo).toBe('Hoy');
  });

  it('sin cupo máximo: cupoMaximo y cuposDisponibles en null', async () => {
    await evento({ titulo: 'Libre', fecha: '2026-11-20' });

    expect((await calcularResumenInicio({ hoy: HOY })).proximoEvento).toMatchObject({ inscriptos: 0, cupoMaximo: null, cuposDisponibles: null });
  });

  it('sin eventos futuros (solo pasados o cancelados) devuelve null', async () => {
    await evento({ titulo: 'Pasado', fecha: '2026-11-10' });
    await evento({ titulo: 'Cancelado', fecha: '2026-11-16', estado: 'cancelado' });

    expect((await calcularResumenInicio({ hoy: HOY })).proximoEvento).toBeNull();
  });
});

describe('porcentaje', () => {
  it.each([
    [1, 3, 33.3],
    [2, 3, 66.7],
    [3, 3, 100],
    [0, 5, 0],
    [0, 0, null],
    [5, 0, null],
    [NaN, 3, null],
  ])('porcentaje(%s, %s) = %s', (parte, total, esperado) => {
    expect(porcentaje(parte, total)).toBe(esperado);
  });
});

describe('GET /api/admin/resumen-inicio', () => {
  const firmar = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);

  it('sin token responde 401', async () => {
    expect((await request(app).get('/api/admin/resumen-inicio')).status).toBe(401);
  });

  it('con token de socio responde 403', async () => {
    const socio = await crearUsuario({ rol: 'socio' });

    const respuesta = await request(app).get('/api/admin/resumen-inicio').set('Authorization', `Bearer ${firmar(socio)}`);

    expect(respuesta.status).toBe(403);
  });

  it('con token de admin devuelve números crudos del mes actual', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const socio = await crearUsuario({ categoria: 'activo' });
    const periodo = fechaHoyArgentina().slice(0, 7);
    await pagar(await cuota(socio, periodo, 'pagada'), 15000);

    const respuesta = await request(app).get('/api/admin/resumen-inicio').set('Authorization', `Bearer ${firmar(admin)}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.exito).toBe(true);
    expect(respuesta.body.data).toEqual({
      periodo,
      recaudacion: { montoRecaudado: 15000, cuotasDelMes: 1, cuotasPagadas: 1, porcentajeCobrado: 100 },
      morosidad: { indice: 0, sociosConDeuda: 0, sociosConCuotas: 1, sociosEnRiesgo: 0, umbralRiesgo: 2, cuotasVencidas: 0 },
      proximoEvento: null,
      // El admin no cuenta como socio: solo el socio Activo aprobado.
      socios: { totalSocios: 1, porCategoria: { activo: 1, adherente: 0, padrino: 0, honorario: 0 }, solicitudesPendientes: 0, degradadosPorMora: 0 },
    });
  });
});
