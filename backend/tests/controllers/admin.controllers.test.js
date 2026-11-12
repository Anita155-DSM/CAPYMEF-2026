import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import { User } from '../../models/user.models.js';
import { Auditoria } from '../../models/auditoria.models.js';
import { Evento } from '../../models/evento.models.js';
import adminRoutes from '../../routes/admin.routes.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// El router de admin carga (vía resumen-inicio) el modelo Evento, cuya columna logosExternos es un ARRAY de
// Postgres que SQLite no tiene: solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

// Router real de admin (verificarToken + verificarAdmin + validadores) en una app mínima, como en app.js.
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

let admin;
let tokenAdmin;
let tokenSocio;

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
  admin = await crearUsuario({ rol: 'admin', razonSocial: 'Cuenta de gestión' });
  const socio = await crearUsuario({ rol: 'socio' });
  tokenAdmin = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: socio.id }, process.env.JWT_SECRET);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const comoAdmin = (req) => req.set('Authorization', `Bearer ${tokenAdmin}`);
const get = (ruta) => comoAdmin(request(app).get(`/api/admin${ruta}`));
const put = (ruta, body = {}) => comoAdmin(request(app).put(`/api/admin${ruta}`)).send(body);

describe('acceso al panel de admin', () => {
  it.each([
    ['GET', '/solicitudes'],
    ['GET', '/usuarios'],
    ['GET', '/auditorias'],
    ['GET', '/reportes/distribucion-rubros'],
    ['PUT', '/solicitudes/1'],
    ['PUT', '/socios/1/baja'],
  ])('%s %s sin token responde 401 y con token de socio 403', async (metodo, ruta) => {
    const sinToken = await request(app)[metodo.toLowerCase()](`/api/admin${ruta}`);
    const conSocio = await request(app)[metodo.toLowerCase()](`/api/admin${ruta}`).set('Authorization', `Bearer ${tokenSocio}`);

    expect(sinToken.status).toBe(401);
    expect(conSocio.status).toBe(403);
  });

  it('un id que no es un número responde 400 antes de consultar la base', async () => {
    expect((await put('/socios/abc/baja')).status).toBe(400);
  });
});

// ==========================================
// SOLICITUDES DE REGISTRO
// ==========================================
describe('GET /api/admin/solicitudes', () => {
  it('lista solo las cuentas pendientes de aprobación', async () => {
    const pendiente = await crearUsuario({ estado: 'pendiente', razonSocial: 'Empresa en espera' });
    await crearUsuario({ estado: 'rechazado' });

    const respuesta = await get('/solicitudes');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((u) => u.id)).toEqual([pendiente.id]);
  });

  it('devuelve solo los datos necesarios para decidir (sin contraseña ni CUIT)', async () => {
    await crearUsuario({ estado: 'pendiente' });

    const [solicitud] = (await get('/solicitudes')).body.data;

    expect(Object.keys(solicitud).sort()).toEqual(['categoria', 'createdAt', 'email', 'id', 'razonSocial', 'telefono']);
  });
});

describe('PUT /api/admin/solicitudes/:id', () => {
  it('aprobar una solicitud deja la cuenta aprobada', async () => {
    const pendiente = await crearUsuario({ estado: 'pendiente', razonSocial: 'Empresa en espera' });

    const respuesta = await put(`/solicitudes/${pendiente.id}`, { nuevoEstado: 'aprobado' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('La cuenta de Empresa en espera ha sido pasada a aprobado exitosamente.');
    expect((await pendiente.reload()).estado).toBe('aprobado');
  });

  it('rechazar una solicitud deja la cuenta rechazada', async () => {
    const pendiente = await crearUsuario({ estado: 'pendiente' });

    await put(`/solicitudes/${pendiente.id}`, { nuevoEstado: 'rechazado' });

    expect((await pendiente.reload()).estado).toBe('rechazado');
  });

  it.each(['inactivo', 'pendiente', 'APROBADO', undefined])('un estado que no es "aprobado" ni "rechazado" (%s) responde 400 y no cambia nada', async (nuevoEstado) => {
    const pendiente = await crearUsuario({ estado: 'pendiente' });

    const respuesta = await put(`/solicitudes/${pendiente.id}`, { nuevoEstado });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Estado inválido.');
    expect((await pendiente.reload()).estado).toBe('pendiente');
  });

  it('una cuenta que no existe responde 404', async () => {
    expect((await put('/solicitudes/99999', { nuevoEstado: 'aprobado' })).status).toBe(404);
  });
});

// ==========================================
// BAJA Y EDICIÓN DE SOCIOS
// ==========================================
describe('PUT /api/admin/socios/:id/baja', () => {
  it('deja la cuenta inactiva (el login y verificarToken la bloquean desde ahí)', async () => {
    const socio = await crearUsuario({ razonSocial: 'Empresa que se va' });

    const respuesta = await put(`/socios/${socio.id}/baja`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('El socio Empresa que se va ha sido dado de baja correctamente.');
    expect((await socio.reload()).estado).toBe('inactivo');
  });

  it('no borra la cuenta: sigue en la base con sus datos', async () => {
    const socio = await crearUsuario();

    await put(`/socios/${socio.id}/baja`);

    expect(await User.findByPk(socio.id)).not.toBeNull();
  });

  it('una cuenta que no existe responde 404', async () => {
    expect((await put('/socios/99999/baja')).status).toBe(404);
  });
});

describe('PUT /api/admin/socios/:id', () => {
  it('actualiza los datos editables y devuelve el socio actualizado', async () => {
    const socio = await crearUsuario();

    const respuesta = await put(`/socios/${socio.id}`, {
      razonSocial: 'Nombre Nuevo SA',
      telefono: '3704111111',
      localidad: 'Pirané',
      rubro: 'Servicios',
      actividad: 'Consultoría',
      tamano_empresa: 'Mediana',
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toMatchObject({ razonSocial: 'Nombre Nuevo SA', localidad: 'Pirané', rubro: 'Servicios', tamano_empresa: 'Mediana' });
    expect((await socio.reload()).telefono).toBe('3704111111');
  });

  it('el CUIT y la contraseña no se pueden cambiar desde esta edición', async () => {
    const socio = await crearUsuario({ cuit: '20-11111111-1', password: 'hash-original' });

    await put(`/socios/${socio.id}`, { cuit: '20-99999999-9', password: 'otra' });

    await socio.reload();
    expect(socio.cuit).toBe('20-11111111-1');
    expect(socio.password).toBe('hash-original');
  });

  it('la respuesta no incluye la contraseña', async () => {
    const socio = await crearUsuario();

    const respuesta = await put(`/socios/${socio.id}`, { telefono: '3704111111' });

    expect(respuesta.body.data).not.toHaveProperty('password');
  });

  it('un email que ya usa otro socio responde 400 con un mensaje claro', async () => {
    await crearUsuario({ email: 'ocupado@test.com' });
    const socio = await crearUsuario();

    const respuesta = await put(`/socios/${socio.id}`, { email: 'ocupado@test.com' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Datos inválidos o email ya registrado por otro socio.');
  });

  it('un valor fuera de la lista lo corta el validador con 400', async () => {
    const socio = await crearUsuario();

    expect((await put(`/socios/${socio.id}`, { estado: 'suspendido' })).status).toBe(400);
  });

  it('cambiar otro dato no toca la marca de "degradado por mora"', async () => {
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });

    await put(`/socios/${socio.id}`, { telefono: '3704111111' });

    expect((await socio.reload()).degradadoPorMora).toBe(true);
  });

  it('una cuenta que no existe responde 404', async () => {
    expect((await put('/socios/99999', { telefono: '1' })).status).toBe(404);
  });
});

// ==========================================
// LISTADOS Y REPORTES
// ==========================================
describe('GET /api/admin/usuarios', () => {
  it('devuelve todas las cuentas con el total', async () => {
    await crearUsuario({ estado: 'pendiente' });

    const respuesta = await get('/usuarios');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(3);
    expect(respuesta.body.data).toHaveLength(3);
  });

  it('nunca incluye contraseñas ni datos de recuperación de contraseña', async () => {
    await crearUsuario({ resetPasswordToken: 'hash-secreto', resetPasswordExpires: new Date() });

    const respuesta = await get('/usuarios');

    for (const usuario of respuesta.body.data) {
      expect(usuario).not.toHaveProperty('password');
      expect(usuario).not.toHaveProperty('resetPasswordToken');
      expect(usuario).not.toHaveProperty('resetPasswordExpires');
    }
  });

  it('ordena de la cuenta más reciente a la más vieja', async () => {
    const ultima = await crearUsuario();
    // Se le pone una fecha de alta posterior a todas (createdAt no se puede cambiar con un update común).
    await User.sequelize.query('UPDATE Users SET createdAt = :fecha WHERE id = :id', {
      replacements: { fecha: '2099-01-01 00:00:00.000 +00:00', id: ultima.id },
    });

    const respuesta = await get('/usuarios');

    expect(respuesta.body.data[0].id).toBe(ultima.id);
  });
});

describe('reportes de distribución', () => {
  beforeEach(async () => {
    // Además del admin y el socio del beforeEach general (los dos Comercio, Formosa; el admin no cuenta):
    await crearUsuario({ rubro: 'Industria', localidad: 'Clorinda' });
    await crearUsuario({ rubro: 'Industria', localidad: 'Clorinda' });
    await crearUsuario({ rubro: 'Industria', localidad: 'Clorinda' });
    // Una cuenta no aprobada no cuenta en los reportes.
    await crearUsuario({ rubro: 'Agropecuario', localidad: 'Pirané', estado: 'pendiente' });
  });

  it('por rubro: cuenta solo socios aprobados (sin admins), de mayor a menor', async () => {
    const respuesta = await get('/reportes/distribucion-rubros');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.totalRubros).toBe(2);
    expect(respuesta.body.data.map((f) => [f.rubro, Number(f.cantidad)])).toEqual([['Industria', 3], ['Comercio', 1]]);
  });

  it('por localidad: cuenta solo socios aprobados (sin admins), de mayor a menor', async () => {
    const respuesta = await get('/reportes/distribucion-localidad');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.totalLocalidades).toBe(2);
    expect(respuesta.body.data.map((f) => [f.localidad, Number(f.cantidad)])).toEqual([['Clorinda', 3], ['Formosa', 1]]);
  });
});

// ==========================================
// HISTORIAL DE AUDITORÍA
// ==========================================
describe('GET /api/admin/auditorias', () => {
  const registro = (datos = {}) =>
    Auditoria.create({
      usuarioNombre: 'Admin',
      usuarioRol: 'admin',
      modulo: 'GASTOS',
      accionTipo: 'CREACION',
      codigoTecnico: 'CREATE_GASTO_OPERATIVO',
      descripcion: 'Se registró un egreso',
      ...datos,
    });
  // Fija la fecha de un registro (createdAt no se puede pasar al crearlo: lo pone Sequelize).
  const conFecha = (fila, fecha) =>
    Auditoria.sequelize.query('UPDATE auditorias SET createdAt = :fecha WHERE id = :id', {
      replacements: { fecha: `${fecha} 12:00:00.000 +00:00`, id: fila.id },
    });

  it('devuelve los registros con los datos de paginación', async () => {
    await registro();
    await registro();

    const respuesta = await get('/auditorias');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ exito: true, totalRegistros: 2, totalPaginas: 1, paginaActual: 1, registrosPorPagina: 10 });
    expect(respuesta.body.data).toHaveLength(2);
  });

  it('pagina los resultados con page y limit', async () => {
    for (let i = 0; i < 5; i++) await registro();

    const respuesta = await get('/auditorias?page=2&limit=2');

    expect(respuesta.body).toMatchObject({ totalRegistros: 5, totalPaginas: 3, paginaActual: 2, registrosPorPagina: 2 });
    expect(respuesta.body.data).toHaveLength(2);
  });

  it('un page o limit inválido usa el valor por defecto en vez de fallar', async () => {
    await registro();

    const respuesta = await get('/auditorias?page=abc&limit=-5');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.paginaActual).toBe(1);
    expect(respuesta.body.registrosPorPagina).toBe(1);
  });

  it('el límite por página no puede pasar de 100', async () => {
    expect((await get('/auditorias?limit=100000')).body.registrosPorPagina).toBe(100);
  });

  it('filtra por módulo y por tipo de acción, sin importar mayúsculas', async () => {
    await registro({ modulo: 'GASTOS', accionTipo: 'CREACION' });
    await registro({ modulo: 'GASTOS', accionTipo: 'ELIMINACION' });
    await registro({ modulo: 'ADMIN', accionTipo: 'CREACION' });

    const respuesta = await get('/auditorias?modulo=gastos&accionTipo=eliminacion');

    expect(respuesta.body.totalRegistros).toBe(1);
    expect(respuesta.body.data[0]).toMatchObject({ modulo: 'GASTOS', accionTipo: 'ELIMINACION' });
  });

  it('filtra por rango de fechas, incluyendo el día completo de la fecha final', async () => {
    await conFecha(await registro({ descripcion: 'octubre' }), '2026-10-15');
    await conFecha(await registro({ descripcion: 'noviembre' }), '2026-11-05');
    await conFecha(await registro({ descripcion: 'diciembre' }), '2026-12-01');

    const respuesta = await get('/auditorias?fechaInicio=2026-11-01&fechaFin=2026-11-05');

    expect(respuesta.body.data.map((r) => r.descripcion)).toEqual(['noviembre']);
  });

  it('ordena del registro más reciente al más viejo', async () => {
    await conFecha(await registro({ descripcion: 'viejo' }), '2026-01-01');
    await conFecha(await registro({ descripcion: 'nuevo' }), '2026-06-01');

    expect((await get('/auditorias')).body.data.map((r) => r.descripcion)).toEqual(['nuevo', 'viejo']);
  });

  it.each(['fechaInicio=ayer', 'fechaFin=2026-13-45'])('una fecha inválida (%s) responde 400 con un mensaje claro', async (query) => {
    const respuesta = await get(`/auditorias?${query}`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toBe('Las fechas deben tener el formato AAAA-MM-DD.');
  });

  it('un filtro que llega como lista (?modulo[]=x) se ignora en vez de romper', async () => {
    await registro();

    const respuesta = await get('/auditorias?modulo[]=GASTOS&modulo[]=ADMIN');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.totalRegistros).toBe(1);
  });

  it('si falla la base responde 500 sin mostrar el error interno', async () => {
    vi.spyOn(Auditoria, 'findAndCountAll').mockRejectedValue(new Error('relation "auditorias" does not exist'));

    const respuesta = await get('/auditorias');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ exito: false, mensaje: 'Error al consultar la auditoría del sistema' });
  });
});
