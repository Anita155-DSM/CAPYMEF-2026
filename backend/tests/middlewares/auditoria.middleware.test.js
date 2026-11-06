import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Auditoria } from '../../models/auditoria.models.js';
import { interceptorAuditoria } from '../../middlewares/auditoria.middleware.js';
import { reiniciarBase, cerrarBase } from '../helpers/baseDeDatos.js';

// App mínima con el interceptor delante de /api, igual que en app.js. Las rutas de prueba imitan lo que
// hacen los controladores reales: responden con un estado y, a veces, dejan un mensaje de auditoría.
// Un encabezado "x-usuario" simula lo que verificarToken deja en req.usuario.
const app = express();
app.use(express.json());
app.use('/api', (req, res, next) => {
  if (req.headers['x-usuario']) req.usuario = JSON.parse(req.headers['x-usuario']);
  next();
});
app.use('/api', interceptorAuditoria);
app.post('/api/gastos', (req, res) => res.status(201).json({ ok: true }));
app.put('/api/admin/socios/7', (req, res) => {
  req.auditoriaMensaje = 'Se actualizaron los datos del socio Empresa SA';
  req.auditoriaCodigo = 'SOCIO_ACTUALIZADO';
  res.status(200).json({ ok: true });
});
app.delete('/api/eventos/1', (req, res) => res.status(200).json({ ok: true }));
app.get('/api/gastos', (req, res) => res.status(200).json({ ok: true }));
app.post('/api/falla', (req, res) => res.status(400).json({ ok: false }));
app.post('/api/error', (req, res) => res.status(500).json({ ok: false }));
app.post('/api', (req, res) => res.status(200).json({ ok: true }));

beforeEach(async () => {
  await reiniciarBase();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

// El registro se guarda cuando termina de enviarse la respuesta (evento "finish"), un instante después
// de que supertest la recibe: por eso se espera con vi.waitFor.
const esperarRegistros = async (cantidad) => {
  await vi.waitFor(async () => expect(await Auditoria.count()).toBe(cantidad));
  return Auditoria.findAll({ order: [['id', 'ASC']] });
};

describe('interceptorAuditoria: qué operaciones registra', () => {
  it('un POST exitoso queda registrado como CREACION', async () => {
    await request(app).post('/api/gastos').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.accionTipo).toBe('CREACION');
  });

  it('un PUT exitoso queda registrado como MODIFICACION', async () => {
    await request(app).put('/api/admin/socios/7').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.accionTipo).toBe('MODIFICACION');
  });

  it('un DELETE exitoso queda registrado como ELIMINACION', async () => {
    await request(app).delete('/api/eventos/1');

    const [registro] = await esperarRegistros(1);
    expect(registro.accionTipo).toBe('ELIMINACION');
  });

  it('un GET no se registra (solo se auditan las operaciones que modifican datos)', async () => {
    await request(app).get('/api/gastos');
    // Una operación registrable después, para saber que el interceptor ya procesó la anterior.
    await request(app).post('/api/gastos').send({});

    const registros = await esperarRegistros(1);
    expect(registros[0].accionTipo).toBe('CREACION');
  });

  it('una operación rechazada (4xx) o fallida (5xx) no se registra', async () => {
    await request(app).post('/api/falla').send({});
    await request(app).post('/api/error').send({});
    await request(app).post('/api/gastos').send({});

    const registros = await esperarRegistros(1);
    expect(registros[0].modulo).toBe('GASTOS');
  });
});

describe('interceptorAuditoria: qué datos guarda', () => {
  it('deduce el módulo de la URL (/api/gastos -> GASTOS) y arma descripción y código por defecto', async () => {
    await request(app).post('/api/gastos?origen=panel').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.modulo).toBe('GASTOS');
    expect(registro.descripcion).toBe('Operación de creacion realizada en el módulo GASTOS.');
    expect(registro.codigoTecnico).toBe('POST_GASTOS');
  });

  it('usa el mensaje y el código que dejó el controlador cuando existen', async () => {
    await request(app).put('/api/admin/socios/7').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.modulo).toBe('ADMIN');
    expect(registro.descripcion).toBe('Se actualizaron los datos del socio Empresa SA');
    expect(registro.codigoTecnico).toBe('SOCIO_ACTUALIZADO');
  });

  it('sin módulo en la URL (/api) usa GENERAL', async () => {
    await request(app).post('/api').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.modulo).toBe('GENERAL');
  });

  it('con usuario logueado guarda su id, su razón social y su rol', async () => {
    const usuario = { id: 15, razonSocial: 'Empresa del Admin', email: 'admin@test.com', rol: 'admin' };

    await request(app).post('/api/gastos').set('x-usuario', JSON.stringify(usuario)).send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.usuarioId).toBe(15);
    expect(registro.usuarioNombre).toBe('Empresa del Admin');
    expect(registro.usuarioRol).toBe('admin');
  });

  it('sin razón social usa el email del usuario como nombre', async () => {
    await request(app).post('/api/gastos').set('x-usuario', JSON.stringify({ id: 3, email: 'socio@test.com', rol: 'socio' })).send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.usuarioNombre).toBe('socio@test.com');
  });

  it('sin usuario (por ejemplo, un registro público) queda como "Sistema" con rol ANONIMO', async () => {
    await request(app).post('/api/gastos').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.usuarioId).toBeNull();
    expect(registro.usuarioNombre).toBe('Sistema');
    expect(registro.usuarioRol).toBe('ANONIMO');
  });

  it('guarda la IP y el navegador (user-agent) de quien hizo la operación', async () => {
    await request(app).post('/api/gastos').set('User-Agent', 'Navegador de prueba 1.0').send({});

    const [registro] = await esperarRegistros(1);
    expect(registro.ipAddress).toBeTruthy();
    expect(registro.userAgent).toBe('Navegador de prueba 1.0');
  });
});

describe('interceptorAuditoria: si falla la base', () => {
  it('no rompe la respuesta al usuario: el error queda solo en el log del servidor', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Auditoria, 'create').mockRejectedValue(new Error('base caída'));

    const respuesta = await request(app).post('/api/gastos').send({});

    expect(respuesta.status).toBe(201);
    await vi.waitFor(() => expect(errorLog).toHaveBeenCalledWith('Error al registrar auditoría en PostgreSQL:', expect.any(Error)));
  });
});
