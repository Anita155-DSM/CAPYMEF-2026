import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Corte de inscripciones a la hora de inicio de un evento de hoy (hora argentina). Solo se simula el reloj
// (Date): la base, el router y el controlador son reales.
const { Evento } = await import('../../models/evento.models.js');
const { Inscripcion } = await import('../../models/inscripcion.models.js');
const { default: eventoRoutes } = await import('../../routes/evento.routes.js');
const { horaActualArgentina } = await import('../../utils/fechas.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata como
// JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);

const HOY = '2026-11-20';
const MANIANA = '2026-11-21';
const CERRADAS = 'Las inscripciones cerraron al comenzar el evento.';

// Fija el reloj en una hora de Argentina (UTC-3) de un día dado.
const fijarAhora = (fecha, hora) => vi.setSystemTime(new Date(`${fecha}T${hora}:00-03:00`));

beforeEach(async () => {
  await reiniciarBase();
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const evento = (datos = {}) =>
  Evento.create({ titulo: 'Charla de financiamiento', descripcion: 'Descripción', fecha: HOY, horaInicio: '18:00', horaFin: '20:00', estado: 'programado', ...datos });
const inscribir = async (existente) => {
  const socio = await crearUsuario();
  return request(app).post(`/api/eventos/${existente.id}/inscribirse`).set('Authorization', `Bearer ${jwt.sign({ id: socio.id }, process.env.JWT_SECRET)}`);
};

describe('horaActualArgentina', () => {
  it('devuelve la hora de Argentina en formato HH:MM de 24 horas, esté donde esté el servidor', () => {
    expect(horaActualArgentina(new Date('2026-11-20T21:05:00Z'))).toBe('18:05');
  });

  it('la medianoche es "00:00" (no "24:00") y la mañana lleva el cero adelante', () => {
    expect(horaActualArgentina(new Date('2026-11-20T03:00:00Z'))).toBe('00:00');
    expect(horaActualArgentina(new Date('2026-11-20T12:07:00Z'))).toBe('09:07');
  });
});

describe('evento de hoy que empieza a las 18:00 (termina a las 20:00)', () => {
  it('a las 17:59 (un minuto antes del inicio) todavía se puede inscribir', async () => {
    fijarAhora(HOY, '17:59');

    expect((await inscribir(await evento())).status).toBe(201);
  });

  it('a las 18:00 en punto (la hora de inicio) responde 400 y no crea la inscripción', async () => {
    fijarAhora(HOY, '18:00');
    const existente = await evento();

    const respuesta = await inscribir(existente);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({ exito: false, mensaje: CERRADAS });
    expect(await Inscripcion.count()).toBe(0);
  });

  it.each(['18:01', '19:30', '20:00', '23:59'])('a las %s (ya empezado o terminado) responde 400', async (hora) => {
    fijarAhora(HOY, hora);

    const respuesta = await inscribir(await evento());

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe(CERRADAS);
  });
});

describe('casos en los que la hora no corta', () => {
  it('un evento de hoy sin hora de inicio acepta inscripciones todo el día', async () => {
    fijarAhora(HOY, '23:30');

    expect((await inscribir(await evento({ horaInicio: null, horaFin: null }))).status).toBe(201);
  });

  it.each(['00:00', '17:59', '18:00', '23:59'])('un evento de mañana acepta inscripciones hoy a las %s', async (hora) => {
    fijarAhora(HOY, hora);

    expect((await inscribir(await evento({ fecha: MANIANA }))).status).toBe(201);
  });

  it('a las 22:30 de Argentina (ya es el día siguiente en UTC) un evento de hoy a las 18:00 sigue cerrado', async () => {
    fijarAhora(HOY, '22:30');

    expect((await inscribir(await evento())).body.mensaje).toBe(CERRADAS);
  });

  it('un evento de ayer sigue respondiendo "El evento ya se realizó." (no el mensaje de la hora)', async () => {
    fijarAhora(HOY, '10:00');

    expect((await inscribir(await evento({ fecha: '2026-11-19' }))).body.mensaje).toBe('El evento ya se realizó.');
  });
});
