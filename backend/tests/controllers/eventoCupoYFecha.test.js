import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Dos reglas de eventos: el admin no puede bajar el cupo por debajo de los inscriptos (y el cupo disponible
// nunca se muestra negativo), y no se puede inscribir a un evento cuya fecha ya pasó.
// Nada sale a internet: la subida de la imagen y su borrado en Cloudinary son falsos. La subida falsa pone un
// archivo en req.file solo si la petición trae el encabezado "x-con-imagen".
const { destroy } = vi.hoisted(() => ({ destroy: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { uploader: { destroy }, config: vi.fn() } }));
vi.mock('../../middlewares/multer/multerEventos.js', () => ({
  uploadEvento: {
    single: () => (req, res, next) => {
      if (req.headers['x-con-imagen']) {
        req.file = { path: 'https://res.cloudinary.com/demo/image/upload/v2/capymef_eventos/nueva.webp', filename: 'capymef_eventos/nueva' };
      }
      next();
    },
  },
}));

const { Evento } = await import('../../models/evento.models.js');
const { Inscripcion } = await import('../../models/inscripcion.models.js');
const { default: eventoRoutes } = await import('../../routes/evento.routes.js');
const { fechaHoyArgentina } = await import('../../services/cuota.service.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata como
// JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);

let tokenAdmin;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  destroy.mockReset();
  destroy.mockResolvedValue({ result: 'ok' });
  await reiniciarBase();
  tokenAdmin = jwt.sign({ id: (await crearUsuario({ rol: 'admin' })).id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const evento = (datos = {}) =>
  Evento.create({ titulo: 'Taller de exportación', descripcion: 'Descripción', fecha: '2099-12-10', estado: 'programado', ...datos });
const conInscriptos = async (datos, cantidad) => {
  const existente = await evento(datos);
  for (let i = 0; i < cantidad; i++) await Inscripcion.create({ evento_id: existente.id, usuario_id: (await crearUsuario()).id });
  return existente;
};
const editar = (existente, body) => request(app).put(`/api/eventos/admin/${existente.id}`).set('Authorization', `Bearer ${tokenAdmin}`).send(body);
const detalle = async (existente) => (await request(app).get(`/api/eventos/${existente.id}`)).body.data;

// "AAAA-MM-DD" corrido `dias` días desde hoy en Argentina (en UTC, para que el horario no corra la fecha).
const diasDesdeHoy = (dias) => {
  const [anio, mes, dia] = fechaHoyArgentina().split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
};

// ==========================================
// PARTE A: el cupo no puede quedar por debajo de los inscriptos
// ==========================================
describe('editar el cupo de un evento con 25 inscriptos (cupo 30)', () => {
  let existente;
  beforeEach(async () => {
    existente = await conInscriptos({ cupoMaximo: 30 }, 25);
  });

  it('bajarlo justo a 25 (el número de inscriptos) se permite: el evento queda lleno', async () => {
    const respuesta = await editar(existente, { cupoMaximo: '25' });

    expect(respuesta.status).toBe(200);
    expect((await existente.reload()).cupoMaximo).toBe(25);
    expect(await detalle(existente)).toMatchObject({ totalInscriptos: 25, cupoDisponible: 0 });
  });

  it('bajarlo a 24 responde 400 con el mensaje exacto y no guarda NADA de la edición', async () => {
    const respuesta = await editar(existente, { cupoMaximo: '24', titulo: 'Título que no se tiene que guardar', lugar: 'Otro lugar' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Ya hay 25 inscriptos: el cupo no puede ser menor a 25.' });
    await existente.reload();
    expect(existente.cupoMaximo).toBe(30);
    expect(existente.titulo).toBe('Taller de exportación');
    expect(existente.lugar).toBeNull();
  });

  it('si el cupo se rechaza, la imagen nueva que se subió se borra y la anterior se conserva', async () => {
    await existente.update({ imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1/capymef_eventos/vieja.jpg' });

    const respuesta = await editar(existente, { cupoMaximo: '10' }).set('x-con-imagen', '1');

    expect(respuesta.status).toBe(400);
    expect(destroy).toHaveBeenCalledWith('capymef_eventos/nueva');
    expect(destroy).not.toHaveBeenCalledWith('capymef_eventos/vieja');
    expect((await existente.reload()).imagenUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/capymef_eventos/vieja.jpg');
  });

  it('subirlo a 40 se permite', async () => {
    expect((await editar(existente, { cupoMaximo: '40' })).status).toBe(200);
    expect(await detalle(existente)).toMatchObject({ cupoMaximo: 40, cupoDisponible: 15 });
  });

  it('quitar el cupo (vacío = sin límite) siempre se permite', async () => {
    expect((await editar(existente, { cupoMaximo: '' })).status).toBe(200);
    expect(await detalle(existente)).toMatchObject({ cupoMaximo: null, cupoDisponible: null });
  });

  it('el chequeo bloquea la fila del evento y cuenta los inscriptos dentro de esa misma transacción', async () => {
    const buscarEvento = vi.spyOn(Evento, 'findByPk');
    const contar = vi.spyOn(Inscripcion, 'count');

    await editar(existente, { cupoMaximo: '26' });

    const [, opciones] = buscarEvento.mock.calls.find(([idBuscado]) => idBuscado === existente.id);
    expect(opciones.lock).toBe('UPDATE');
    expect(opciones.transaction).toBeTruthy();
    expect(contar.mock.calls[0][0].transaction).toBe(opciones.transaction);
  });

  it('editar otros datos sin tocar el cupo no cuenta inscriptos ni se bloquea por el cupo', async () => {
    const contar = vi.spyOn(Inscripcion, 'count');

    expect((await editar(existente, { titulo: 'Taller renovado' })).status).toBe(200);
    expect(contar).not.toHaveBeenCalled();
  });
});

describe('el cupo disponible del detalle nunca es negativo', () => {
  it('con más inscriptos que cupo (datos anteriores a este control) muestra 0, no un número negativo', async () => {
    // Se carga directo en la base, como podía quedar antes: cupo 20 con 25 inscriptos.
    const excedido = await conInscriptos({ cupoMaximo: 20 }, 25);

    expect(await detalle(excedido)).toMatchObject({ totalInscriptos: 25, cupoDisponible: 0 });
  });

  it('un evento ya excedido se puede seguir editando en lo demás (el control es solo al cambiar el cupo)', async () => {
    const excedido = await conInscriptos({ cupoMaximo: 20 }, 25);

    expect((await editar(excedido, { descripcion: 'Descripción corregida' })).status).toBe(200);
  });

  it('un evento sin cupo devuelve cupoDisponible null', async () => {
    expect((await detalle(await evento({ cupoMaximo: null }))).cupoDisponible).toBeNull();
  });
});

// ==========================================
// PARTE B: no se puede inscribir a un evento que ya pasó
// ==========================================
describe('inscribirse según la fecha del evento (hoy en hora argentina)', () => {
  const inscribir = async (existente) =>
    request(app).post(`/api/eventos/${existente.id}/inscribirse`).set('Authorization', `Bearer ${jwt.sign({ id: (await crearUsuario()).id }, process.env.JWT_SECRET)}`);

  it('un evento programado de AYER responde 400 "El evento ya se realizó." y no crea la inscripción', async () => {
    const deAyer = await evento({ fecha: diasDesdeHoy(-1) });

    const respuesta = await inscribir(deAyer);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'El evento ya se realizó.' });
    expect(await Inscripcion.count()).toBe(0);
  });

  it('un evento de HOY todavía acepta inscripciones (201)', async () => {
    expect((await inscribir(await evento({ fecha: fechaHoyArgentina() }))).status).toBe(201);
  });

  it('un evento de MAÑANA acepta inscripciones (201)', async () => {
    expect((await inscribir(await evento({ fecha: diasDesdeHoy(1) }))).status).toBe(201);
  });

  it('un evento pasado y además cancelado sigue respondiendo el mensaje de estado, como antes', async () => {
    const respuesta = await inscribir(await evento({ fecha: diasDesdeHoy(-1), estado: 'cancelado' }));

    expect(respuesta.body.mensaje).toBe('Este evento ya no admite inscripciones.');
  });
});
