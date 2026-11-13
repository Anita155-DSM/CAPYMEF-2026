import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
// Los recordatorios de cuotas también van por mail: el mailer es falso (el contenido se prueba en recordatoriosPorMail.test.js).
vi.mock('../../config/mailer.js', () => ({ enviarMailRecordatorioCuota: vi.fn(async () => {}), smtpConfigurado: () => true }));
import { Cuota } from '../../models/cuota.models.js';
import { Evento } from '../../models/evento.models.js';
import { Notificacion } from '../../models/notificacion.models.js';
import { User } from '../../models/user.models.js';
import { abonaCuota, esCuentaDeGestion } from '../../services/abonaCuota.service.js';
import { asegurarTarifasIniciales } from '../../services/tarifa.service.js';
import {
  generarCuotasDelMes,
  marcarCuotasVencidas,
  enviarRecordatoriosDeVencimiento,
  fechaHoyArgentina,
} from '../../services/cuota.service.js';
import { evaluarCategoriaSocio, evaluarCategoriasDeTodos } from '../../services/categoria.service.js';
import { calcularResumenInicio } from '../../services/resumenInicio.service.js';
import pagoRoutes from '../../routes/pago.routes.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se lo trata como JSON
// (mismo criterio que evento.controllers.test.js). Hace falta porque resumenInicio usa el modelo Evento.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Las tarifas iniciales del sistema: Activo paga; Adherente, Padrino y Honorario no.
const TARIFAS = { activo: 10000, adherente: 0, padrino: 0, honorario: 0 };

const cuota = (usuario, mes_anio, estado, fecha_vencimiento = `${mes_anio}-10`) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio, monto: 10000, fecha_vencimiento, estado });

const avisosDe = (usuario, tipo) => Notificacion.count({ where: { usuario_id: usuario.id, tipo } });

beforeEach(async () => {
  await reiniciarBase();
  await asegurarTarifasIniciales();
  // Los servicios escriben en la consola lo que hacen; acá no hace falta verlo.
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(async () => {
  vi.restoreAllMocks();
  await cerrarBase();
});

describe('abonaCuota (regla única)', () => {
  it('un admin con categoría Activo NO abona cuota (es una cuenta de gestión)', () => {
    expect(abonaCuota({ rol: 'admin', categoria: 'activo' }, TARIFAS)).toBe(false);
  });

  it('un socio Activo abona cuota', () => {
    expect(abonaCuota({ rol: 'socio', categoria: 'activo' }, TARIFAS)).toBe(true);
  });

  it.each(['adherente', 'padrino', 'honorario'])('un socio %s no abona cuota (tarifa 0)', (categoria) => {
    expect(abonaCuota({ rol: 'socio', categoria }, TARIFAS)).toBe(false);
  });

  it('manda la tarifa: si la de Adherente pasara a ser mayor a 0, el Adherente pagaría', () => {
    expect(abonaCuota({ rol: 'socio', categoria: 'adherente' }, { ...TARIFAS, adherente: 5000 })).toBe(true);
  });

  it('un socio con el rol sin cargar (null) se trata como socio', () => {
    expect(abonaCuota({ rol: null, categoria: 'activo' }, TARIFAS)).toBe(true);
  });

  it.each([
    ['sin usuario', undefined, TARIFAS],
    ['sin tarifas', { rol: 'socio', categoria: 'activo' }, undefined],
    ['categoría sin tarifa cargada', { rol: 'socio', categoria: 'inventada' }, TARIFAS],
  ])('%s: false, sin lanzar error', (_, usuario, tarifas) => {
    expect(abonaCuota(usuario, tarifas)).toBe(false);
  });

  it('esCuentaDeGestion reconoce solo el rol admin', () => {
    expect(esCuentaDeGestion({ rol: 'admin' })).toBe(true);
    expect(esCuentaDeGestion({ rol: 'socio' })).toBe(false);
    expect(esCuentaDeGestion(null)).toBe(false);
  });
});

describe('generarCuotasDelMes', () => {
  it('genera cuota al socio Activo, y no al admin Activo ni al Adherente', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    const activo = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    const adherente = await crearUsuario({ rol: 'socio', categoria: 'adherente' });

    const resultado = await generarCuotasDelMes();

    // El admin ni siquiera se cuenta como exento: no es socio.
    expect(resultado).toMatchObject({ creadas: 1, sociosExentos: 1 });
    expect(await Cuota.count({ where: { usuario_id: activo.id } })).toBe(1);
    expect(await Cuota.count({ where: { usuario_id: admin.id } })).toBe(0);
    expect(await Cuota.count({ where: { usuario_id: adherente.id } })).toBe(0);
    // Tampoco recibe el aviso de cuota nueva.
    expect(await avisosDe(admin, 'cuota_nueva')).toBe(0);
    expect(await avisosDe(activo, 'cuota_nueva')).toBe(1);
  });
});

describe('cuotas viejas de un admin (datos previos a la regla)', () => {
  it('marcarCuotasVencidas no marca ni avisa las cuotas de un admin; las del socio sí', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    const deAdmin = await cuota(admin, '2026-01', 'pendiente');
    const deSocio = await cuota(socio, '2026-01', 'pendiente');

    const resultado = await marcarCuotasVencidas();

    expect(resultado.marcadas).toBe(1);
    expect((await Cuota.findByPk(deSocio.id)).estado).toBe('vencida');
    expect((await Cuota.findByPk(deAdmin.id)).estado).toBe('pendiente');
    expect(await avisosDe(admin, 'cuota_vencida')).toBe(0);
    expect(await avisosDe(socio, 'cuota_vencida')).toBe(1);
  });

  it('el recordatorio del día 7 no le llega a un admin con una cuota pendiente', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    await cuota(admin, '2099-12', 'pendiente');
    await cuota(socio, '2099-12', 'pendiente');

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado.enviados).toBe(1);
    expect(await avisosDe(admin, 'recordatorio_cuota')).toBe(0);
    expect(await avisosDe(socio, 'recordatorio_cuota')).toBe(1);
  });

  it('un admin Activo con 3 cuotas vencidas no es degradado por mora (ni uno por uno ni en el cierre diario)', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    for (const mes of ['2026-07', '2026-08', '2026-09']) await cuota(admin, mes, 'vencida');

    expect(await evaluarCategoriaSocio(admin.id)).toBeNull();
    expect(await evaluarCategoriasDeTodos()).toEqual({ degradados: 0, recuperados: 0 });
    expect((await User.findByPk(admin.id)).categoria).toBe('activo');
    expect(await avisosDe(admin, 'categoria_degradada')).toBe(0);
  });

  it('un socio Activo con 3 cuotas vencidas sí es degradado (la regla de mora sigue igual)', async () => {
    const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    for (const mes of ['2026-07', '2026-08', '2026-09']) await cuota(socio, mes, 'vencida');

    expect(await evaluarCategoriaSocio(socio.id)).toBe('degradado');
  });

  it('resumen-inicio: un admin con cuotas vencidas no cuenta en morosidad, riesgo ni recaudación', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    const socio = await crearUsuario({ rol: 'socio', categoria: 'activo' });
    for (const mes of ['2026-08', '2026-09', '2026-10']) await cuota(admin, mes, 'vencida');
    await cuota(admin, '2026-11', 'pendiente');
    await cuota(socio, '2026-11', 'pendiente');
    await cuota(socio, '2026-10', 'vencida');

    const { recaudacion, morosidad } = await calcularResumenInicio({ hoy: '2026-11-15' });

    // Solo el socio: 1 cuota del mes; 1 socio con cuotas, 1 con deuda, 1 vencida, nadie en riesgo.
    expect(recaudacion).toMatchObject({ cuotasDelMes: 1, cuotasPagadas: 0 });
    expect(morosidad).toEqual({
      indice: 100,
      sociosConDeuda: 1,
      sociosConCuotas: 1,
      sociosEnRiesgo: 0,
      umbralRiesgo: 2,
      cuotasVencidas: 1,
    });
  });
});

describe('POST /api/pagos/:id/iniciar con una cuenta de gestión', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/pagos', pagoRoutes);
  const firmar = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);

  it('un admin no puede iniciar el pago de una cuota a su nombre: 403 SIN_PERMISOS', async () => {
    const admin = await crearUsuario({ rol: 'admin', categoria: 'activo' });
    const deAdmin = await cuota(admin, fechaHoyArgentina().slice(0, 7), 'pendiente');

    const respuesta = await request(app).post(`/api/pagos/${deAdmin.id}/iniciar`).set('Authorization', `Bearer ${firmar(admin)}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'No tenés permiso para pagar esta cuota.', codigo: 'SIN_PERMISOS' });
  });
});
