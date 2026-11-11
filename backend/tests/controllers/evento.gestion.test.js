import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Gestión de eventos: crear, editar, borrar, inscribirse, asistencia y certificados. (La privacidad del
// link de las reuniones virtuales está en evento.controllers.test.js.)
// Nada sale a internet: la subida de la imagen y su borrado en Cloudinary son falsos. La subida falsa pone
// un archivo en req.file solo si la petición trae el encabezado "x-con-imagen".
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
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');
const { calcularResumenInicio } = await import('../../services/resumenInicio.service.js');
const { esPdf, extraerTextoPdf } = await import('../helpers/pdf.js');

// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata
// como JSON (guarda el mismo array). No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);

let admin;
let socio;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  destroy.mockResolvedValue({ result: 'ok' });
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin' });
  socio = await crearUsuario({ rol: 'socio', razonSocial: 'Empresa Asistente SRL' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
  destroy.mockReset();
});

afterAll(async () => {
  await cerrarBase();
});

const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);
const comoSocio = (req) => req.set('Authorization', `Bearer ${tokenSocio}`);
const evento = (datos = {}) =>
  Evento.create({ titulo: 'Taller de exportación', descripcion: 'Descripción', fecha: '2026-12-10', estado: 'programado', ...datos });
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';
const nuevoEvento = { titulo: 'Charla de financiamiento', descripcion: 'Líneas de crédito para PyMEs', fecha: '2026-12-15' };

// ==========================================
// ABM DE EVENTOS (admin)
// ==========================================
describe('POST /api/eventos/admin (crear)', () => {
  it('el admin crea un evento y se completan los valores por defecto', async () => {
    const respuesta = await comoAdmin(request(app).post('/api/eventos/admin')).send(nuevoEvento);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data).toMatchObject({
      ...nuevoEvento,
      modalidad: 'presencial',
      estado: 'programado',
      horaInicio: null,
      lugar: null,
      cupoMaximo: null,
      imagenUrl: null,
      logosExternos: [],
    });
  });

  it('guarda la imagen subida y los logos externos enviados como JSON', async () => {
    const logos = ['https://logos.test/gobierno.png'];

    const respuesta = await comoAdmin(request(app).post('/api/eventos/admin'))
      .set('x-con-imagen', '1')
      .send({ ...nuevoEvento, modalidad: 'virtual', cupoMaximo: '30', logosExternos: JSON.stringify(logos) });

    expect(respuesta.status).toBe(201);
    const guardado = await Evento.findByPk(respuesta.body.data.id);
    expect(guardado.imagenUrl).toBe('https://res.cloudinary.com/demo/image/upload/v2/capymef_eventos/nueva.webp');
    expect(guardado.logosExternos).toEqual(logos);
    expect(guardado.cupoMaximo).toBe(30);
  });

  it('un evento sin título lo corta el validador con 400 y no se guarda', async () => {
    const respuesta = await comoAdmin(request(app).post('/api/eventos/admin')).send({ descripcion: 'x', fecha: '2026-12-15' });

    expect(respuesta.status).toBe(400);
    expect(await Evento.count()).toBe(0);
  });

  it('un socio no puede crear eventos (403)', async () => {
    expect((await comoSocio(request(app).post('/api/eventos/admin')).send(nuevoEvento)).status).toBe(403);
  });

  it('si falla la base borra la imagen ya subida a Cloudinary', async () => {
    vi.spyOn(Evento, 'create').mockRejectedValue(new Error('base caída'));

    const respuesta = await comoAdmin(request(app).post('/api/eventos/admin')).set('x-con-imagen', '1').send(nuevoEvento);

    expect(respuesta.status).toBe(500);
    expect(destroy).toHaveBeenCalledWith('capymef_eventos/nueva');
  });
});

describe('PUT /api/eventos/admin/:id (editar)', () => {
  it('cambia solo los campos enviados y deja el resto como estaba', async () => {
    const existente = await evento({ lugar: 'Maipú 651', cupoMaximo: 20 });

    const respuesta = await comoAdmin(request(app).put(`/api/eventos/admin/${existente.id}`)).send({ titulo: 'Taller actualizado', estado: 'finalizado' });

    expect(respuesta.status).toBe(200);
    await existente.reload();
    expect(existente).toMatchObject({ titulo: 'Taller actualizado', estado: 'finalizado', lugar: 'Maipú 651', cupoMaximo: 20, fecha: '2026-12-10' });
  });

  it('mandar el lugar o el cupo vacíos los borra (evento sin lugar definido o sin límite de cupo)', async () => {
    const existente = await evento({ lugar: 'Maipú 651', cupoMaximo: 20 });

    const respuesta = await comoAdmin(request(app).put(`/api/eventos/admin/${existente.id}`)).send({ lugar: '', cupoMaximo: '' });

    expect(respuesta.status).toBe(200);
    await existente.reload();
    expect(existente.lugar).toBeNull();
    expect(existente.cupoMaximo).toBeNull();
  });

  it('al subir una imagen nueva borra la anterior de Cloudinary', async () => {
    const existente = await evento({ imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1/capymef_eventos/vieja.jpg' });

    await comoAdmin(request(app).put(`/api/eventos/admin/${existente.id}`)).set('x-con-imagen', '1').send({});

    expect(destroy).toHaveBeenCalledWith('capymef_eventos/vieja');
    expect((await existente.reload()).imagenUrl).toBe('https://res.cloudinary.com/demo/image/upload/v2/capymef_eventos/nueva.webp');
  });

  it('mandar logosExternos vacío saca todos los logos del evento', async () => {
    const existente = await evento({ logosExternos: ['https://logos.test/a.png'] });

    await comoAdmin(request(app).put(`/api/eventos/admin/${existente.id}`)).send({ logosExternos: '' });

    expect((await existente.reload()).logosExternos).toEqual([]);
  });

  it('un evento que no existe responde 404 y borra la imagen que se había subido', async () => {
    const respuesta = await comoAdmin(request(app).put(`/api/eventos/admin/${UUID_INEXISTENTE}`)).set('x-con-imagen', '1').send({});

    expect(respuesta.status).toBe(404);
    expect(destroy).toHaveBeenCalledWith('capymef_eventos/nueva');
  });
});

describe('DELETE /api/eventos/admin/:id', () => {
  it('hace un borrado lógico: deja de aparecer pero sigue guardado', async () => {
    const existente = await evento();

    const respuesta = await comoAdmin(request(app).delete(`/api/eventos/admin/${existente.id}`));

    expect(respuesta.status).toBe(200);
    expect(await Evento.findByPk(existente.id)).toBeNull();
    expect(await Evento.findByPk(existente.id, { paranoid: false })).not.toBeNull();
  });

  it('un evento que no existe responde 404', async () => {
    expect((await comoAdmin(request(app).delete(`/api/eventos/admin/${UUID_INEXISTENTE}`))).status).toBe(404);
  });

  it('un socio no puede borrar eventos (403)', async () => {
    const existente = await evento();

    expect((await comoSocio(request(app).delete(`/api/eventos/admin/${existente.id}`))).status).toBe(403);
  });
});

// ==========================================
// INSCRIPCIONES (socio)
// ==========================================
describe('POST /api/eventos/:id/inscribirse', () => {
  const inscribirse = (id) => comoSocio(request(app).post(`/api/eventos/${id}/inscribirse`));

  it('el socio se inscribe a un evento programado (201)', async () => {
    const existente = await evento();

    const respuesta = await inscribirse(existente.id);

    expect(respuesta.status).toBe(201);
    expect(await Inscripcion.count({ where: { evento_id: existente.id, usuario_id: socio.id } })).toBe(1);
  });

  it('no se puede inscribir dos veces al mismo evento', async () => {
    const existente = await evento();
    await inscribirse(existente.id);

    const segunda = await inscribirse(existente.id);

    expect(segunda.status).toBe(400);
    expect(segunda.body.mensaje).toBe('Ya estás inscripto a este evento.');
  });

  it.each(['finalizado', 'cancelado'])('un evento %s no admite inscripciones', async (estado) => {
    const existente = await evento({ estado });

    const respuesta = await inscribirse(existente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Este evento ya no admite inscripciones.');
  });

  it('con el cupo completo responde 400', async () => {
    const existente = await evento({ cupoMaximo: 1 });
    await Inscripcion.create({ evento_id: existente.id, usuario_id: admin.id });

    const respuesta = await inscribirse(existente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('El cupo para este evento ya está completo.');
  });

  // Límite exacto del cupo, con un cupo mayor a 1 para que se note la diferencia entre > y >=.
  // (inscribe directo en la base a otros socios para dejar el evento con la cantidad justa de inscriptos)
  const conInscriptos = async (cupoMaximo, cantidad) => {
    const existente = await evento({ cupoMaximo });
    for (let i = 0; i < cantidad; i++) {
      await Inscripcion.create({ evento_id: existente.id, usuario_id: (await crearUsuario()).id });
    }
    return existente;
  };

  it('cupo 3 con 2 inscriptos (N-1): el socio entra y ocupa el último lugar', async () => {
    const existente = await conInscriptos(3, 2);

    const respuesta = await inscribirse(existente.id);

    expect(respuesta.status).toBe(201);
    expect(await Inscripcion.count({ where: { evento_id: existente.id } })).toBe(3);
  });

  it('cupo 3 con 3 inscriptos (N): el siguiente se rechaza con 400 y no se crea la inscripción', async () => {
    const existente = await conInscriptos(3, 3);

    const respuesta = await inscribirse(existente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('El cupo para este evento ya está completo.');
    expect(await Inscripcion.count({ where: { evento_id: existente.id } })).toBe(3);
  });

  it('sin cupo máximo siempre se puede inscribir, haya los inscriptos que haya', async () => {
    const existente = await conInscriptos(null, 5);

    expect((await inscribirse(existente.id)).status).toBe(201);
  });

  it('una inscripción cancelada libera el lugar (se borra, así que deja de contar)', async () => {
    const existente = await conInscriptos(1, 0);
    await inscribirse(existente.id);
    await comoSocio(request(app).delete(`/api/eventos/${existente.id}/inscribirse`));

    // Con el lugar libre, otro usuario (el admin) puede ocuparlo.
    const respuesta = await comoAdmin(request(app).post(`/api/eventos/${existente.id}/inscribirse`));

    expect(respuesta.status).toBe(201);
  });

  it('el detalle del evento y el resumen del inicio del panel cuentan los mismos inscriptos y lugares', async () => {
    const existente = await conInscriptos(5, 2);
    await inscribirse(existente.id);
    await comoSocio(request(app).delete(`/api/eventos/${existente.id}/inscribirse`)); // cancelada: no cuenta

    const detalle = (await request(app).get(`/api/eventos/${existente.id}`)).body.data;
    const resumen = (await calcularResumenInicio({ hoy: '2026-11-01' })).proximoEvento;

    expect(detalle).toMatchObject({ totalInscriptos: 2, cupoDisponible: 3 });
    expect(resumen).toMatchObject({ id: existente.id, inscriptos: 2, cuposDisponibles: 3 });
  });

  it('el cupo disponible que muestra el evento baja con cada inscripción', async () => {
    const existente = await evento({ cupoMaximo: 10 });
    await inscribirse(existente.id);

    const detalle = await request(app).get(`/api/eventos/${existente.id}`);

    expect(detalle.body.data).toMatchObject({ totalInscriptos: 1, cupoDisponible: 9 });
  });

  it('un evento que no existe responde 404', async () => {
    expect((await inscribirse(UUID_INEXISTENTE)).status).toBe(404);
  });

  it('sin token responde 401', async () => {
    const existente = await evento();

    expect((await request(app).post(`/api/eventos/${existente.id}/inscribirse`)).status).toBe(401);
  });
});

describe('DELETE /api/eventos/:id/inscribirse', () => {
  it('el socio cancela su propia inscripción', async () => {
    const existente = await evento();
    await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id });

    const respuesta = await comoSocio(request(app).delete(`/api/eventos/${existente.id}/inscribirse`));

    expect(respuesta.status).toBe(200);
    expect(await Inscripcion.count()).toBe(0);
  });

  it('sin inscripción responde 404 y no toca las inscripciones de otros', async () => {
    const existente = await evento();
    await Inscripcion.create({ evento_id: existente.id, usuario_id: admin.id });

    const respuesta = await comoSocio(request(app).delete(`/api/eventos/${existente.id}/inscribirse`));

    expect(respuesta.status).toBe(404);
    expect(await Inscripcion.count()).toBe(1);
  });
});

// ==========================================
// INSCRIPTOS Y ASISTENCIA (admin)
// ==========================================
describe('GET /api/eventos/admin/:id/inscriptos', () => {
  it('lista los inscriptos con sus datos de contacto', async () => {
    const existente = await evento();
    await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id });

    const respuesta = await comoAdmin(request(app).get(`/api/eventos/admin/${existente.id}/inscriptos`));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.evento).toEqual({ id: existente.id, titulo: 'Taller de exportación', fecha: '2026-12-10' });
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].socio).toMatchObject({ id: socio.id, razonSocial: 'Empresa Asistente SRL' });
    expect(respuesta.body.data[0].socio).not.toHaveProperty('password');
  });

  it('un socio no puede ver la lista de inscriptos (403)', async () => {
    const existente = await evento();

    expect((await comoSocio(request(app).get(`/api/eventos/admin/${existente.id}/inscriptos`))).status).toBe(403);
  });

  it('un evento que no existe responde 404', async () => {
    expect((await comoAdmin(request(app).get(`/api/eventos/admin/${UUID_INEXISTENTE}/inscriptos`))).status).toBe(404);
  });
});

describe('PUT /api/eventos/admin/:eventoId/inscriptos/:inscripcionId/asistencia', () => {
  const marcar = (eventoId, inscripcionId, asistio) =>
    comoAdmin(request(app).put(`/api/eventos/admin/${eventoId}/inscriptos/${inscripcionId}/asistencia`)).send({ asistio });

  it('marca y desmarca la asistencia de un inscripto', async () => {
    const existente = await evento();
    const inscripcion = await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id });

    expect((await marcar(existente.id, inscripcion.id, true)).status).toBe(200);
    expect((await inscripcion.reload()).asistio).toBe(true);

    await marcar(existente.id, inscripcion.id, false);
    expect((await inscripcion.reload()).asistio).toBe(false);
  });

  it('sin el campo asistio se toma como ausente', async () => {
    const existente = await evento();
    const inscripcion = await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: true });

    await marcar(existente.id, inscripcion.id, undefined);

    expect((await inscripcion.reload()).asistio).toBe(false);
  });

  it('una inscripción de OTRO evento responde 404 (el evento y la inscripción tienen que coincidir)', async () => {
    const evento1 = await evento();
    const evento2 = await evento({ titulo: 'Otro evento' });
    const inscripcion = await Inscripcion.create({ evento_id: evento2.id, usuario_id: socio.id });

    expect((await marcar(evento1.id, inscripcion.id, true)).status).toBe(404);
    expect((await inscripcion.reload()).asistio).toBe(false);
  });
});

// ==========================================
// CERTIFICADOS DE ASISTENCIA
// ==========================================
describe('GET /api/eventos/:id/certificado (el socio descarga el suyo)', () => {
  const descargar = (id) => comoSocio(request(app).get(`/api/eventos/${id}/certificado`)).buffer(true);

  it('con el evento finalizado y la asistencia confirmada, descarga el PDF a su nombre', async () => {
    // Título sin tildes: con tildes el nombre del archivo llega mal codificado (ver informe).
    const existente = await evento({ titulo: 'Taller de comercio exterior', estado: 'finalizado' });
    await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: true });

    const respuesta = await descargar(existente.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toBe('application/pdf');
    expect(respuesta.headers['content-disposition']).toBe('attachment; filename="certificado-Taller_de_comercio_exterior.pdf"');
    const pdf = Buffer.from(respuesta.body);
    expect(esPdf(pdf)).toBe(true);
    expect(extraerTextoPdf(pdf)).toContain('Empresa Asistente SRL');
  });

  it('si el evento todavía no terminó responde 400', async () => {
    const existente = await evento({ estado: 'programado' });
    await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: true });

    const respuesta = await descargar(existente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('El certificado solo está disponible una vez que el evento finalizó.');
  });

  it('sin inscripción responde 404', async () => {
    const existente = await evento({ estado: 'finalizado' });

    expect((await descargar(existente.id)).status).toBe(404);
  });

  it('inscripto pero sin asistencia confirmada responde 400', async () => {
    const existente = await evento({ estado: 'finalizado' });
    await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: false });

    const respuesta = await descargar(existente.id);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Tu asistencia todavía no fue confirmada por la administración.');
  });
});

describe('GET /api/eventos/admin/:eventoId/inscriptos/:inscripcionId/certificado (reimpresión del admin)', () => {
  const descargar = (eventoId, inscripcionId) =>
    comoAdmin(request(app).get(`/api/eventos/admin/${eventoId}/inscriptos/${inscripcionId}/certificado`)).buffer(true);

  it('el admin descarga el certificado de un socio que asistió', async () => {
    const existente = await evento({ estado: 'finalizado' });
    const inscripcion = await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: true });

    const respuesta = await descargar(existente.id, inscripcion.id);

    expect(respuesta.status).toBe(200);
    expect(extraerTextoPdf(Buffer.from(respuesta.body))).toContain('Empresa Asistente SRL');
  });

  it('sin asistencia confirmada responde 400', async () => {
    const existente = await evento({ estado: 'finalizado' });
    const inscripcion = await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id });

    expect((await descargar(existente.id, inscripcion.id)).status).toBe(400);
  });

  it('un socio no puede usar la ruta del admin (403)', async () => {
    const existente = await evento({ estado: 'finalizado' });
    const inscripcion = await Inscripcion.create({ evento_id: existente.id, usuario_id: socio.id, asistio: true });

    expect((await comoSocio(request(app).get(`/api/eventos/admin/${existente.id}/inscriptos/${inscripcion.id}/certificado`))).status).toBe(403);
  });
});
