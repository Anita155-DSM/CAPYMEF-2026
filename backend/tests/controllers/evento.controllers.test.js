import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import { Evento } from '../../models/evento.models.js';
import { Inscripcion } from '../../models/inscripcion.models.js';
import eventoRoutes from '../../routes/evento.routes.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Se monta el router real de eventos (con sus middlewares de token y rol) en una app mínima, en la
// misma ruta que en app.js, igual que en noticia.controllers.test.js.
const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);

// La columna logosExternos es un ARRAY de Postgres, que SQLite (la base de los tests) no tiene: sin esto
// no se puede crear la tabla de eventos. Solo en este test se la trata como JSON (guarda el mismo array).
// No cambia el modelo real ni la base de producción, y estos tests no usan logosExternos.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Link inventado: si aparece en una respuesta, se filtró el link de la reunión.
const LINK_REUNION = 'https://meet.ejemplo.test/abc-defg-hij';
const DIRECCION = 'Maipú 651, Formosa';

let tokenAdmin;
let tokenSocioInscripto;
let tokenSocioNoInscripto;
let virtual;
let presencial;
let cancelado;

const crearEvento = (datos = {}) =>
  Evento.create({
    titulo: 'Evento de prueba',
    descripcion: 'Descripción de prueba',
    fecha: '2026-12-10',
    modalidad: 'presencial',
    estado: 'programado',
    ...datos,
  });

const firmar = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);

beforeEach(async () => {
  await reiniciarBase();
  const admin = await crearUsuario({ rol: 'admin' });
  const socioInscripto = await crearUsuario({ rol: 'socio' });
  const socioNoInscripto = await crearUsuario({ rol: 'socio' });
  tokenAdmin = firmar(admin);
  tokenSocioInscripto = firmar(socioInscripto);
  tokenSocioNoInscripto = firmar(socioNoInscripto);

  virtual = await crearEvento({ titulo: 'Charla virtual', modalidad: 'virtual', lugar: LINK_REUNION, fecha: '2026-12-01' });
  presencial = await crearEvento({ titulo: 'Taller presencial', modalidad: 'presencial', lugar: DIRECCION, fecha: '2026-12-05' });
  cancelado = await crearEvento({ titulo: 'Evento cancelado', modalidad: 'virtual', lugar: LINK_REUNION, estado: 'cancelado', fecha: '2026-11-20' });

  await Inscripcion.create({ evento_id: virtual.id, usuario_id: socioInscripto.id });
});

afterAll(async () => {
  await cerrarBase();
});

const buscar = (respuesta, evento) => respuesta.body.data.find((e) => e.id === evento.id);
const conToken = (req, token) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
const listar = (ruta, token) => conToken(request(app).get(`/api/eventos/${ruta}`), token);
const detalle = (evento, token) => conToken(request(app).get(`/api/eventos/${evento.id}`), token);

describe('GET /api/eventos/publicos (sin login)', () => {
  it('un evento virtual viene con lugar null', async () => {
    const respuesta = await listar('publicos');

    expect(respuesta.status).toBe(200);
    expect(buscar(respuesta, virtual).lugar).toBeNull();
    expect(respuesta.text).not.toContain(LINK_REUNION);
  });

  it('aunque se mande el token de un admin, la ruta pública nunca devuelve el link', async () => {
    const respuesta = await listar('publicos', tokenAdmin);

    expect(buscar(respuesta, virtual).lugar).toBeNull();
  });

  it('un evento presencial conserva su dirección', async () => {
    expect(buscar(await listar('publicos'), presencial).lugar).toBe(DIRECCION);
  });

  it('la forma del resto del evento no cambia', async () => {
    const evento = buscar(await listar('publicos'), virtual);

    expect(evento).toMatchObject({ id: virtual.id, titulo: 'Charla virtual', modalidad: 'virtual', estado: 'programado' });
    expect(evento).toHaveProperty('lugar');
  });
});

describe('GET /api/eventos/:id (token opcional)', () => {
  it('virtual + anónimo: lugar null', async () => {
    const respuesta = await detalle(virtual);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.lugar).toBeNull();
    expect(respuesta.body.data).toMatchObject({ totalInscriptos: 1, cupoDisponible: null });
  });

  it('virtual + socio no inscripto: lugar null', async () => {
    expect((await detalle(virtual, tokenSocioNoInscripto)).body.data.lugar).toBeNull();
  });

  it('virtual + socio inscripto: viene el link', async () => {
    expect((await detalle(virtual, tokenSocioInscripto)).body.data.lugar).toBe(LINK_REUNION);
  });

  it('virtual + admin: viene el link', async () => {
    expect((await detalle(virtual, tokenAdmin)).body.data.lugar).toBe(LINK_REUNION);
  });

  it('presencial + anónimo: viene la dirección', async () => {
    expect((await detalle(presencial)).body.data.lugar).toBe(DIRECCION);
  });

  it('token inválido: responde como a un anónimo (200 sin link), no con un error de permisos', async () => {
    const respuesta = await detalle(virtual, 'token-que-no-sirve');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.lugar).toBeNull();
  });

  it('token firmado con otra clave que dice ser admin: no da privilegios', async () => {
    const falso = jwt.sign({ id: 1, rol: 'admin' }, 'otra-clave');

    expect((await detalle(virtual, falso)).body.data.lugar).toBeNull();
  });
});

describe('GET /api/eventos/socios (con token)', () => {
  it('virtual + socio no inscripto: lugar null y yaInscripto false', async () => {
    const evento = buscar(await listar('socios', tokenSocioNoInscripto), virtual);

    expect(evento.lugar).toBeNull();
    expect(evento.yaInscripto).toBe(false);
  });

  it('virtual + socio inscripto: viene el link y yaInscripto true', async () => {
    const evento = buscar(await listar('socios', tokenSocioInscripto), virtual);

    expect(evento.lugar).toBe(LINK_REUNION);
    expect(evento.yaInscripto).toBe(true);
  });

  it('virtual + admin (aunque no esté inscripto): viene el link', async () => {
    const evento = buscar(await listar('socios', tokenAdmin), virtual);

    expect(evento.lugar).toBe(LINK_REUNION);
    expect(evento.yaInscripto).toBe(false);
  });

  it('presencial + socio no inscripto: viene la dirección', async () => {
    expect(buscar(await listar('socios', tokenSocioNoInscripto), presencial).lugar).toBe(DIRECCION);
  });

  it('no incluye los eventos cancelados', async () => {
    expect(buscar(await listar('socios', tokenAdmin), cancelado)).toBeUndefined();
  });
});

describe('GET /api/eventos/admin (listado completo para el admin)', () => {
  it('no la captura la ruta /:id (no responde 400 por "id inválido")', async () => {
    const respuesta = await listar('admin', tokenAdmin);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('incluye los cancelados, con el link completo', async () => {
    const respuesta = await listar('admin', tokenAdmin);

    expect(buscar(respuesta, cancelado)).toMatchObject({ estado: 'cancelado', lugar: LINK_REUNION });
    expect(buscar(respuesta, virtual).lugar).toBe(LINK_REUNION);
    expect(respuesta.body.data).toHaveLength(3);
  });

  it('ordena por fecha y trae yaInscripto, igual que /socios', async () => {
    const respuesta = await listar('admin', tokenAdmin);

    expect(respuesta.body.data.map((e) => e.titulo)).toEqual(['Evento cancelado', 'Charla virtual', 'Taller presencial']);
    expect(respuesta.body.data.every((e) => typeof e.yaInscripto === 'boolean')).toBe(true);
  });

  it('con token de socio responde 403', async () => {
    expect((await listar('admin', tokenSocioInscripto)).status).toBe(403);
  });

  it('sin token responde 401', async () => {
    expect((await listar('admin')).status).toBe(401);
  });
});
