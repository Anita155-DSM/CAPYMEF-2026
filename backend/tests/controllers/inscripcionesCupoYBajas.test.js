import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

// Cupo de eventos: inscripción dentro de una transacción con la fila del evento bloqueada, un único conteo de
// inscriptos para todo el sistema, y liberación de los lugares en eventos futuros cuando una cuenta pierde el
// acceso (baja, rechazo o cambio de estado desde la edición del admin).
// SQLite (la base de los tests) ignora el bloqueo FOR UPDATE: estos tests prueban el comportamiento funcional
// y que el bloqueo y el conteo se pidan dentro de la misma transacción (ver informe para Postgres).
const { destroy } = vi.hoisted(() => ({ destroy: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { uploader: { destroy }, config: vi.fn() } }));

const { Evento } = await import('../../models/evento.models.js');
const { Inscripcion } = await import('../../models/inscripcion.models.js');
const { User } = await import('../../models/user.models.js');
const { default: eventoRoutes } = await import('../../routes/evento.routes.js');
const { default: adminRoutes } = await import('../../routes/admin.routes.js');
const { contarInscriptos, liberarInscripcionesFuturas } = await import('../../services/inscripcion.service.js');
const { calcularResumenInicio } = await import('../../services/resumenInicio.service.js');
const { fechaHoyArgentina } = await import('../../services/cuota.service.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata como
// JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);
app.use('/api/admin', adminRoutes);

const FUTURO = '2099-12-01';
const PASADO = '2020-03-15';
const CUPO_COMPLETO = 'El cupo para este evento ya está completo.';

let admin;
let tokenAdmin;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const tokenDe = (usuario) => jwt.sign({ id: usuario.id }, process.env.JWT_SECRET);
const evento = (datos = {}) =>
  Evento.create({ titulo: 'Taller de exportación', descripcion: 'Descripción', fecha: FUTURO, estado: 'programado', ...datos });
const inscribir = (eventoId, usuario) => request(app).post(`/api/eventos/${eventoId}/inscribirse`).set('Authorization', `Bearer ${tokenDe(usuario)}`);
const inscriptosEn = (eventoId) => Inscripcion.count({ where: { evento_id: eventoId } });
const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);

// ==========================================
// PARTE A: inscripción con transacción y bloqueo
// ==========================================
describe('inscripción: las reglas de siempre, ahora dentro de una transacción', () => {
  it('con lugar disponible se inscribe (201)', async () => {
    const existente = await evento({ cupoMaximo: 2 });

    const respuesta = await inscribir(existente.id, await crearUsuario());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.mensaje).toBe('Inscripción registrada correctamente.');
    expect(await inscriptosEn(existente.id)).toBe(1);
  });

  it('con el cupo lleno responde 400 con el mismo mensaje de siempre', async () => {
    const existente = await evento({ cupoMaximo: 1 });
    await inscribir(existente.id, await crearUsuario());

    const respuesta = await inscribir(existente.id, await crearUsuario());

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe(CUPO_COMPLETO);
    expect(await inscriptosEn(existente.id)).toBe(1);
  });

  it('el mismo socio dos veces: el segundo pedido se rechaza y no queda duplicado', async () => {
    const existente = await evento();
    const socio = await crearUsuario();
    await inscribir(existente.id, socio);

    const segunda = await inscribir(existente.id, socio);

    expect(segunda.status).toBe(400);
    expect(segunda.body.mensaje).toBe('Ya estás inscripto a este evento.');
    expect(await inscriptosEn(existente.id)).toBe(1);
  });

  // El chequeo propio no depende del índice único: si en Neon el índice no existiera (ver informe), sería la
  // única barrera contra la doble inscripción. Por eso el segundo pedido se corta ANTES de intentar crear la fila.
  it('la doble inscripción se detecta antes de intentar crear la fila (no depende del índice único de la base)', async () => {
    const existente = await evento();
    const socio = await crearUsuario();
    await inscribir(existente.id, socio);
    const crear = vi.spyOn(Inscripcion, 'create');

    await inscribir(existente.id, socio);

    expect(crear).not.toHaveBeenCalled();
  });

  it.each(['cancelado', 'finalizado'])('un evento %s no admite inscripciones, como antes', async (estado) => {
    const existente = await evento({ estado });

    const respuesta = await inscribir(existente.id, await crearUsuario());

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Este evento ya no admite inscripciones.');
  });

  it('un evento que no existe responde 404, como antes', async () => {
    expect((await inscribir('00000000-0000-4000-8000-000000000000', await crearUsuario())).status).toBe(404);
  });

  it('bloquea la fila del evento y cuenta los inscriptos DENTRO de esa misma transacción', async () => {
    const existente = await evento({ cupoMaximo: 5 });
    const buscarEvento = vi.spyOn(Evento, 'findByPk');
    const contar = vi.spyOn(Inscripcion, 'count');
    const crear = vi.spyOn(Inscripcion, 'create');

    await inscribir(existente.id, await crearUsuario());

    const [, opcionesBusqueda] = buscarEvento.mock.calls.find(([idBuscado]) => idBuscado === existente.id);
    expect(opcionesBusqueda.lock).toBe('UPDATE');
    expect(opcionesBusqueda.transaction).toBeTruthy();
    // El conteo del cupo y la creación usan la transacción que tiene el evento bloqueado.
    expect(contar.mock.calls[0][0].transaction).toBe(opcionesBusqueda.transaction);
    expect(crear.mock.calls[0][1].transaction).toBe(opcionesBusqueda.transaction);
  });

  it('si el índice único rechaza una doble inscripción (pedidos simultáneos del mismo socio) responde 400, no 500', async () => {
    const existente = await evento();
    const socio = await crearUsuario();
    // Simula que el otro pedido del mismo socio ganó justo antes: la base rechaza el duplicado.
    vi.spyOn(Inscripcion, 'create').mockRejectedValueOnce(Object.assign(new Error('duplicado'), { name: 'SequelizeUniqueConstraintError' }));

    const respuesta = await inscribir(existente.id, socio);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Ya estás inscripto a este evento.');
  });

  // En Postgres el segundo pedido espera el bloqueo del primero y después ve el cupo lleno: uno responde 201 y
  // el otro 400. SQLite no puede reproducir eso: no tiene bloqueo de filas y Sequelize usa UNA sola conexión
  // para la base en memoria, así que las dos transacciones se pisan. Uno falla al abrir la suya ("cannot start
  // a transaction within a transaction") y al otro le falla el commit ("cannot commit - no transaction is
  // active") aunque su fila quedó guardada: los dos responden 500 y queda 1 inscripto. Por eso este test NO
  // mira los códigos de respuesta (en SQLite no significan nada) y solo comprueba la garantía que importa:
  // nunca entran los dos. La espera real por el bloqueo solo se puede probar contra Postgres.
  it('dos pedidos simultáneos (Promise.all) por el último lugar: nunca quedan los dos inscriptos', async () => {
    const existente = await evento({ cupoMaximo: 1 });
    const [socioA, socioB] = [await crearUsuario(), await crearUsuario()];

    const respuestas = await Promise.all([inscribir(existente.id, socioA), inscribir(existente.id, socioB)]);

    expect(respuestas.filter((r) => r.status === 201).length).toBeLessThanOrEqual(1);
    expect(await inscriptosEn(existente.id)).toBeLessThanOrEqual(1);
  });
});

describe('los tres lugares cuentan igual (contarInscriptos)', () => {
  it('el detalle del evento, la inscripción (cupo) y el resumen del inicio usan el mismo número', async () => {
    const existente = await evento({ cupoMaximo: 2 });
    await inscribir(existente.id, await crearUsuario());

    const detalle = (await request(app).get(`/api/eventos/${existente.id}`)).body.data;
    const resumen = (await calcularResumenInicio({ hoy: fechaHoyArgentina() })).proximoEvento;

    expect(await contarInscriptos(existente.id)).toBe(1);
    expect(detalle).toMatchObject({ totalInscriptos: 1, cupoDisponible: 1 });
    expect(resumen).toMatchObject({ id: existente.id, inscriptos: 1, cuposDisponibles: 1 });

    // La inscripción ve el mismo número: entra uno más y el siguiente ya no.
    expect((await inscribir(existente.id, await crearUsuario())).status).toBe(201);
    expect((await inscribir(existente.id, await crearUsuario())).body.mensaje).toBe(CUPO_COMPLETO);
  });

  it('una inscripción cancelada no cuenta en ninguno de los tres', async () => {
    const existente = await evento({ cupoMaximo: 3 });
    const socio = await crearUsuario();
    await inscribir(existente.id, socio);
    await request(app).delete(`/api/eventos/${existente.id}/inscribirse`).set('Authorization', `Bearer ${tokenDe(socio)}`);

    expect(await contarInscriptos(existente.id)).toBe(0);
    expect((await request(app).get(`/api/eventos/${existente.id}`)).body.data.totalInscriptos).toBe(0);
    expect((await calcularResumenInicio({ hoy: fechaHoyArgentina() })).proximoEvento.inscriptos).toBe(0);
  });
});

// ==========================================
// PARTE B: una cuenta que pierde el acceso libera sus lugares en eventos futuros
// ==========================================
describe('liberarInscripcionesFuturas', () => {
  it('borra las inscripciones a eventos de hoy en adelante y conserva las de eventos pasados', async () => {
    const socio = await crearUsuario();
    const futuro = await evento({ fecha: FUTURO });
    const deHoy = await evento({ fecha: fechaHoyArgentina() });
    const pasado = await evento({ fecha: PASADO, estado: 'finalizado' });
    for (const e of [futuro, deHoy, pasado]) await Inscripcion.create({ evento_id: e.id, usuario_id: socio.id });

    expect(await liberarInscripcionesFuturas(socio.id)).toBe(2);

    expect(await Inscripcion.findAll({ where: { usuario_id: socio.id } })).toHaveLength(1);
    expect(await inscriptosEn(pasado.id)).toBe(1);
  });

  it('no toca las inscripciones de otros socios', async () => {
    const socio = await crearUsuario();
    const otro = await crearUsuario();
    const futuro = await evento();
    await Inscripcion.create({ evento_id: futuro.id, usuario_id: socio.id });
    await Inscripcion.create({ evento_id: futuro.id, usuario_id: otro.id });

    await liberarInscripcionesFuturas(socio.id);

    expect(await Inscripcion.count({ where: { usuario_id: otro.id } })).toBe(1);
  });

  it('también libera el lugar en un evento futuro que fue borrado (por si se restaura)', async () => {
    const socio = await crearUsuario();
    const borrado = await evento();
    await Inscripcion.create({ evento_id: borrado.id, usuario_id: socio.id });
    await borrado.destroy();

    expect(await liberarInscripcionesFuturas(socio.id)).toBe(1);
  });

  it('sin inscripciones futuras devuelve 0', async () => {
    expect(await liberarInscripcionesFuturas((await crearUsuario()).id)).toBe(0);
  });
});

describe('cada camino por el que el admin le quita el acceso a una cuenta libera sus lugares', () => {
  // Socio inscripto al único lugar de un evento futuro y a un evento pasado (con asistencia confirmada).
  const prepararSocioInscripto = async () => {
    const socio = await crearUsuario({ razonSocial: 'Socio que se va' });
    const futuro = await evento({ cupoMaximo: 1 });
    const pasado = await evento({ fecha: PASADO, estado: 'finalizado' });
    await Inscripcion.create({ evento_id: futuro.id, usuario_id: socio.id });
    await Inscripcion.create({ evento_id: pasado.id, usuario_id: socio.id, asistio: true });
    return { socio, futuro, pasado };
  };

  const caminos = [
    ['baja (PUT /socios/:id/baja)', (socio) => comoAdmin(request(app).put(`/api/admin/socios/${socio.id}/baja`)), 'inactivo'],
    ['rechazo de la solicitud (PUT /solicitudes/:id)', (socio) => comoAdmin(request(app).put(`/api/admin/solicitudes/${socio.id}`)).send({ nuevoEstado: 'rechazado' }), 'rechazado'],
    ['edición del admin con estado inactivo', (socio) => comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ estado: 'inactivo' }), 'inactivo'],
    ['edición del admin con estado rechazado', (socio) => comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ estado: 'rechazado' }), 'rechazado'],
    ['edición del admin con estado pendiente', (socio) => comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ estado: 'pendiente' }), 'pendiente'],
  ];

  it.each(caminos)('%s: pierde el lugar del evento futuro (otro socio puede ocuparlo) y conserva el del pasado', async (_, quitarAcceso, estadoFinal) => {
    const { socio, futuro, pasado } = await prepararSocioInscripto();

    const respuesta = await quitarAcceso(socio);

    expect(respuesta.status).toBe(200);
    expect((await socio.reload()).estado).toBe(estadoFinal);
    expect(await Inscripcion.count({ where: { usuario_id: socio.id, evento_id: futuro.id } })).toBe(0);
    const delPasado = await Inscripcion.findOne({ where: { usuario_id: socio.id, evento_id: pasado.id } });
    expect(delPasado.asistio).toBe(true);
    // El lugar quedó libre: otro socio entra al evento que tenía cupo 1.
    expect((await inscribir(futuro.id, await crearUsuario())).status).toBe(201);
  });

  it('editar otros datos del socio (sin cambiar el estado) no toca sus inscripciones', async () => {
    const { socio, futuro } = await prepararSocioInscripto();

    await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}`)).send({ telefono: '3704111111' });

    expect(await Inscripcion.count({ where: { usuario_id: socio.id, evento_id: futuro.id } })).toBe(1);
  });

  it('aprobar una cuenta no toca sus inscripciones', async () => {
    const { socio, futuro } = await prepararSocioInscripto();

    await comoAdmin(request(app).put(`/api/admin/solicitudes/${socio.id}`)).send({ nuevoEstado: 'aprobado' });

    expect(await Inscripcion.count({ where: { usuario_id: socio.id, evento_id: futuro.id } })).toBe(1);
  });

  it('la baja y la liberación van juntas: si falla liberar los lugares, la cuenta sigue aprobada', async () => {
    const { socio, futuro } = await prepararSocioInscripto();
    vi.spyOn(Inscripcion, 'destroy').mockRejectedValueOnce(new Error('base caída'));

    const respuesta = await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}/baja`));

    expect(respuesta.status).toBe(500);
    expect((await socio.reload()).estado).toBe('aprobado');
    expect(await Inscripcion.count({ where: { usuario_id: socio.id, evento_id: futuro.id } })).toBe(1);
  });
});

describe('una cuenta sin acceso no puede inscribirse', () => {
  it.each(['inactivo', 'rechazado', 'pendiente'])('un socio %s recibe 403 (verificarToken) y no ocupa lugar', async (estado) => {
    const existente = await evento();
    const socio = await crearUsuario({ estado });

    const respuesta = await inscribir(existente.id, socio);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('SESION_INVALIDA');
    expect(await inscriptosEn(existente.id)).toBe(0);
  });

  it('un socio dado de baja con la sesión todavía abierta tampoco puede volver a inscribirse', async () => {
    const existente = await evento();
    const socio = await crearUsuario();
    const tokenAbierto = tokenDe(socio);
    await comoAdmin(request(app).put(`/api/admin/socios/${socio.id}/baja`));

    const respuesta = await request(app).post(`/api/eventos/${existente.id}/inscribirse`).set('Authorization', `Bearer ${tokenAbierto}`);

    expect(respuesta.status).toBe(403);
    expect(await User.count({ where: { id: socio.id, estado: 'inactivo' } })).toBe(1);
  });
});
