import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import { Cuota } from '../../models/cuota.models.js';
import { Evento } from '../../models/evento.models.js';
import { User } from '../../models/user.models.js';
import adminRoutes from '../../routes/admin.routes.js';
import { calcularPadron, esFechaValida, padronACsv, restarMeses } from '../../services/padron.service.js';
import { fechaHoyArgentina } from '../../services/cuota.service.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Router real de admin (verificarToken + verificarAdmin) en una app mínima, como en app.js.
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const CORTE = '2026-11-15';
// Mediodía en hora argentina: así la fecha de calendario no depende de la zona horaria de la máquina.
const el = (fecha) => new Date(`${fecha}T12:00:00-03:00`);

const socio = (razonSocial, datos = {}) =>
  crearUsuario({ razonSocial, rol: 'socio', categoria: 'activo', estado: 'aprobado', fechaAprobacion: el('2026-01-10'), ...datos });
const cuota = (usuario, mes_anio, estado, fecha_vencimiento = `${mes_anio}-10`) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio, monto: 10000, fecha_vencimiento, estado });
const nombres = (lista) => lista.map((s) => s.razonSocial);
const buscar = (lista, nombre) => lista.find((s) => s.razonSocial === nombre);

beforeEach(async () => {
  await reiniciarBase();
});

afterAll(async () => {
  await cerrarBase();
});

// Escenario con fecha de corte 15/11/2026 (6 meses antes = 15/05/2026):
//   A  Activo aprobado el 15/04 (7 meses), al día; tiene una cuota PAGADA vieja       → habilitado
//   B  Activo aprobado el 15/06 (5 meses)                                            → no: antigüedad
//   C  Activo con 1 cuota vencida (octubre)                                          → no: 1 vencida
//   D  Activo con la cuota de noviembre pendiente que vence el 20/11 (después del corte) → habilitado
//   E  Adherente                                                                      → no: categoría
//   F  admin con categoría Activo                                                    → no aparece
//   G  cuenta pendiente · H cuenta dada de baja                                      → no aparecen
//   I  aprobado el 15/05 exacto (6 meses justos)                                     → habilitado (borde)
//   J  aprobado el 16/05 (le falta un día)                                           → no: antigüedad
//   K  sin fechaAprobacion, registrado el 10/01                                      → habilitado (usa createdAt)
//   L  sin fechaAprobacion, registrado hoy                                           → no: antigüedad
//   M  cuota pendiente que venció el 10/11 (antes del corte) aunque no esté marcada  → no: 1 vencida
//   N  Adherente, aprobado hace 2 meses, con 2 vencidas                              → no: los tres motivos
const armarEscenario = async () => {
  const a = await socio('A Activo siete meses', { fechaAprobacion: el('2026-04-15') });
  await cuota(a, '2026-10', 'pagada');
  await socio('B Activo cinco meses', { fechaAprobacion: el('2026-06-15') });
  const c = await socio('C Activo con vencida');
  await cuota(c, '2026-10', 'vencida');
  const d = await socio('D Activo pendiente no vencida');
  await cuota(d, '2026-11', 'pendiente', '2026-11-20');
  await socio('E Adherente', { categoria: 'adherente' });
  await socio('F Admin', { rol: 'admin' });
  await socio('G Pendiente', { estado: 'pendiente' });
  await socio('H Dado de baja', { estado: 'inactivo' });
  await socio('I Borde seis meses justos', { fechaAprobacion: el('2026-05-15') });
  await socio('J Borde un dia menos', { fechaAprobacion: el('2026-05-16') });
  await socio('K Sin fecha registrado viejo', { fechaAprobacion: null, createdAt: el('2026-01-10') });
  await socio('L Sin fecha registrado hoy', { fechaAprobacion: null });
  const m = await socio('M Pendiente ya vencida');
  await cuota(m, '2026-11', 'pendiente', '2026-11-10');
  const n = await socio('N Varios motivos', { categoria: 'adherente', fechaAprobacion: el('2026-09-15') });
  await cuota(n, '2026-09', 'vencida');
  await cuota(n, '2026-10', 'vencida');
};

describe('calcularPadron', () => {
  it('separa habilitados y no habilitados según el Estatuto', async () => {
    await armarEscenario();

    const padron = await calcularPadron({ fechaCorte: CORTE });

    expect(padron.fechaCorte).toBe(CORTE);
    expect(nombres(padron.habilitados)).toEqual([
      'A Activo siete meses',
      'D Activo pendiente no vencida',
      'I Borde seis meses justos',
      'K Sin fecha registrado viejo',
    ]);
    expect(padron.totalHabilitados).toBe(4);
    expect(nombres(padron.noHabilitados)).toEqual([
      'B Activo cinco meses',
      'C Activo con vencida',
      'E Adherente',
      'J Borde un dia menos',
      'L Sin fecha registrado hoy',
      'M Pendiente ya vencida',
      'N Varios motivos',
    ]);
  });

  it('cada no habilitado lleva motivos legibles', async () => {
    await armarEscenario();

    const { noHabilitados } = await calcularPadron({ fechaCorte: CORTE });

    expect(buscar(noHabilitados, 'B Activo cinco meses').motivos).toEqual(['Antigüedad menor a 6 meses']);
    expect(buscar(noHabilitados, 'C Activo con vencida').motivos).toEqual(['Tiene 1 cuota vencida']);
    expect(buscar(noHabilitados, 'E Adherente').motivos).toEqual(['Categoría adherente']);
    expect(buscar(noHabilitados, 'J Borde un dia menos').motivos).toEqual(['Antigüedad menor a 6 meses']);
    expect(buscar(noHabilitados, 'M Pendiente ya vencida').motivos).toEqual(['Tiene 1 cuota vencida']);
    expect(buscar(noHabilitados, 'N Varios motivos').motivos).toEqual([
      'Categoría adherente',
      'Antigüedad menor a 6 meses',
      'Tiene 2 cuotas vencidas',
    ]);
  });

  it('un admin, una cuenta pendiente y una dada de baja no aparecen en ninguna lista', async () => {
    await armarEscenario();

    const { habilitados, noHabilitados } = await calcularPadron({ fechaCorte: CORTE });
    const todos = nombres([...habilitados, ...noHabilitados]);

    expect(todos).not.toContain('F Admin');
    expect(todos).not.toContain('G Pendiente');
    expect(todos).not.toContain('H Dado de baja');
  });

  it('sin fechaAprobacion usa la fecha de registro y lo marca como aproximado', async () => {
    await armarEscenario();

    const { habilitados } = await calcularPadron({ fechaCorte: CORTE });

    expect(buscar(habilitados, 'K Sin fecha registrado viejo')).toMatchObject({ fechaAprobacion: '2026-01-10', fechaAprobacionAproximada: true });
    expect(buscar(habilitados, 'A Activo siete meses')).toMatchObject({ fechaAprobacion: '2026-04-15', fechaAprobacionAproximada: false });
  });

  it('devuelve solo datos de identificación (nada sensible)', async () => {
    await armarEscenario();

    const { habilitados } = await calcularPadron({ fechaCorte: CORTE });

    expect(Object.keys(habilitados[0]).sort()).toEqual(
      ['categoria', 'cuit', 'email', 'fechaAprobacion', 'fechaAprobacionAproximada', 'id', 'razonSocial'].sort()
    );
  });

  it('sin socios devuelve listas vacías y total 0', async () => {
    expect(await calcularPadron({ fechaCorte: CORTE })).toEqual({ fechaCorte: CORTE, totalHabilitados: 0, habilitados: [], noHabilitados: [] });
  });

  it('rechaza una fecha de corte inválida', async () => {
    await expect(calcularPadron({ fechaCorte: '2026-02-30' })).rejects.toThrow();
  });
});

describe('restarMeses y esFechaValida', () => {
  it.each([
    ['2026-11-15', '2026-05-15'],
    ['2026-03-15', '2025-09-15'],
    ['2026-08-31', '2026-02-28'], // febrero no tiene 31: último día
    ['2024-08-31', '2024-02-29'], // año bisiesto
  ])('6 meses antes de %s es %s', (fecha, esperado) => {
    expect(restarMeses(fecha, 6)).toBe(esperado);
  });

  it.each(['2026-11-15', '2024-02-29'])('%s es una fecha válida', (fecha) => {
    expect(esFechaValida(fecha)).toBe(true);
  });

  it.each(['2026-02-30', '2026-13-01', '15/11/2026', '2026-1-5', '', undefined, '2026-11-15T00:00'])('%s no es válida', (fecha) => {
    expect(esFechaValida(fecha)).toBe(false);
  });
});

describe('padronACsv', () => {
  it('arma el CSV con BOM, separador ";" y número de orden', () => {
    const csv = padronACsv([
      { razonSocial: 'Ñandú S.A.', cuit: '20-00000001-1', categoria: 'activo' },
      { razonSocial: 'Otra; con punto y coma', cuit: '20-00000002-1', categoria: 'activo' },
    ]);

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'N°;Razón social;CUIT;Categoría',
      '1;Ñandú S.A.;20-00000001-1;activo',
      '2;"Otra; con punto y coma";20-00000002-1;activo',
      '',
    ]);
  });

  it('neutraliza las celdas que Excel tomaría como fórmula', () => {
    const csv = padronACsv([{ razonSocial: '=HYPERLINK("http://malo.example")', cuit: '-1', categoria: 'activo' }]);

    expect(csv).toContain(`1;"'=HYPERLINK(""http://malo.example"")";'-1;activo`);
  });
});

describe('fechaAprobacion al aprobar una cuenta', () => {
  let tokenAdmin;

  beforeEach(async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  });

  const aprobar = (usuario, nuevoEstado = 'aprobado') =>
    request(app).put(`/api/admin/solicitudes/${usuario.id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ nuevoEstado });
  const editar = (usuario, datos) =>
    request(app).put(`/api/admin/socios/${usuario.id}`).set('Authorization', `Bearer ${tokenAdmin}`).send(datos);

  it('aprobar una solicitud registra la fecha de aprobación', async () => {
    const pendiente = await crearUsuario({ estado: 'pendiente' });
    const antes = Date.now();

    expect((await aprobar(pendiente)).status).toBe(200);

    const fecha = (await User.findByPk(pendiente.id)).fechaAprobacion;
    expect(fecha).toBeInstanceOf(Date);
    expect(fecha.getTime()).toBeGreaterThanOrEqual(antes - 1000);
  });

  it('rechazar una solicitud no registra fecha', async () => {
    const pendiente = await crearUsuario({ estado: 'pendiente' });

    await aprobar(pendiente, 'rechazado');

    expect((await User.findByPk(pendiente.id)).fechaAprobacion).toBeNull();
  });

  it('re-aprobar una cuenta no pisa la primera fecha de aprobación', async () => {
    const dadoDeBaja = await crearUsuario({ estado: 'inactivo', fechaAprobacion: el('2026-01-10') });

    await aprobar(dadoDeBaja);

    expect((await User.findByPk(dadoDeBaja.id)).fechaAprobacion.toISOString()).toBe(el('2026-01-10').toISOString());
  });

  it('volver a aprobar desde la edición del admin registra la fecha si no tenía', async () => {
    const dadoDeBaja = await crearUsuario({ estado: 'inactivo', fechaAprobacion: null });

    expect((await editar(dadoDeBaja, { estado: 'aprobado' })).status).toBe(200);

    expect((await User.findByPk(dadoDeBaja.id)).fechaAprobacion).toBeInstanceOf(Date);
  });

  it('editar otro dato de un socio aprobado sin fecha NO le pone la fecha de hoy (conserva la antigüedad)', async () => {
    const viejo = await crearUsuario({ estado: 'aprobado', fechaAprobacion: null });

    expect((await editar(viejo, { rubro: 'Industria' })).status).toBe(200);

    expect((await User.findByPk(viejo.id)).fechaAprobacion).toBeNull();
  });
});

describe('GET /api/admin/padron y /padron/exportar', () => {
  const pedir = (ruta, token) => {
    const req = request(app).get(`/api/admin/${ruta}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  const firmar = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);

  it('sin token responde 401', async () => {
    expect((await pedir('padron')).status).toBe(401);
    expect((await pedir('padron/exportar')).status).toBe(401);
  });

  it('con token de socio responde 403', async () => {
    const token = firmar(await crearUsuario({ rol: 'socio' }));

    expect((await pedir('padron', token)).status).toBe(403);
    expect((await pedir('padron/exportar', token)).status).toBe(403);
  });

  it('con token de admin devuelve el padrón para la fecha pedida', async () => {
    await armarEscenario();
    const token = firmar(await crearUsuario({ rol: 'admin', razonSocial: 'Z Admin que consulta' }));

    const respuesta = await pedir(`padron?fecha=${CORTE}`, token);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.exito).toBe(true);
    expect(respuesta.body.data.fechaCorte).toBe(CORTE);
    expect(respuesta.body.data.totalHabilitados).toBe(4);
    expect(nombres(respuesta.body.data.noHabilitados)).toHaveLength(7);
  });

  it('sin fecha usa la fecha de hoy (hora argentina)', async () => {
    const token = firmar(await crearUsuario({ rol: 'admin' }));

    const respuesta = await pedir('padron', token);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.fechaCorte).toBe(fechaHoyArgentina());
  });

  it.each(['2026-02-30', '15-11-2026', 'mañana', '2026-11-15T10:00'])('fecha inválida (%s) responde 400', async (fecha) => {
    const token = firmar(await crearUsuario({ rol: 'admin' }));

    const respuesta = await pedir(`padron?fecha=${encodeURIComponent(fecha)}`, token);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.exito).toBe(false);
    expect((await pedir(`padron/exportar?fecha=${encodeURIComponent(fecha)}`, token)).status).toBe(400);
  });

  it('exporta un CSV de los habilitados con content-type, BOM y nombre de archivo correctos', async () => {
    await armarEscenario();
    const token = firmar(await crearUsuario({ rol: 'admin' }));

    const respuesta = await pedir(`padron/exportar?fecha=${CORTE}`, token).buffer(true).parse((res, cb) => {
      const partes = [];
      res.on('data', (parte) => partes.push(parte));
      res.on('end', () => cb(null, Buffer.concat(partes)));
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(respuesta.headers['content-disposition']).toBe(`attachment; filename="padron-habilitados-${CORTE}.csv"`);
    expect([...respuesta.body.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8
    const lineas = respuesta.body.toString('utf8').slice(1).trim().split('\r\n');
    expect(lineas[0]).toBe('N°;Razón social;CUIT;Categoría');
    expect(lineas.slice(1).map((l) => l.split(';').slice(0, 2).join(';'))).toEqual([
      '1;A Activo siete meses',
      '2;D Activo pendiente no vencida',
      '3;I Borde seis meses justos',
      '4;K Sin fecha registrado viejo',
    ]);
  });
});
