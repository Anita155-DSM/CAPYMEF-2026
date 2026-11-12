import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DataTypes } from 'sequelize';
import { User } from '../../models/user.models.js';
import { Cuota } from '../../models/cuota.models.js';
import { Pago } from '../../models/pago.models.js';
import { Tarifa } from '../../models/tarifa.models.js';
import { Gasto } from '../../models/gasto.models.js';
import { Evento } from '../../models/evento.models.js';
import { Inscripcion } from '../../models/inscripcion.models.js';
import { Noticia } from '../../models/noticia.models.js';
import { Notificacion } from '../../models/notificacion.models.js';
import { Auditoria } from '../../models/auditoria.models.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Reglas que viven en los modelos (valores por defecto, restricciones únicas, borrado lógico y relaciones).
// Varias protegen datos de dinero o de identidad, así que conviene que un cambio en el modelo las rompa
// en un test y no en producción.
// La columna logosExternos es un ARRAY de Postgres que SQLite no tiene: solo en los tests se la trata
// como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

beforeEach(async () => {
  await reiniciarBase();
});

afterAll(async () => {
  await cerrarBase();
});

const cuotaDe = (usuario, datos = {}) =>
  Cuota.create({ usuario_id: usuario.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', ...datos });

describe('User', () => {
  const minimo = { razonSocial: 'Empresa', cuit: '20-1-1', email: 'a@test.com', password: 'x', telefono: '1', localidad: 'Formosa', rubro: 'Comercio' };

  it('una cuenta nueva es socio Adherente pendiente de aprobación, sin degradación por mora', async () => {
    const usuario = await User.create(minimo);

    expect(usuario).toMatchObject({ categoria: 'adherente', estado: 'pendiente', rol: 'socio', degradadoPorMora: false });
    expect(usuario.fechaAprobacion ?? null).toBeNull();
  });

  it.each(['email', 'cuit'])('el %s es único: no puede haber dos cuentas con el mismo', async (campo) => {
    await User.create(minimo);

    await expect(User.create({ ...minimo, cuit: '20-2-2', email: 'b@test.com', [campo]: minimo[campo] })).rejects.toThrow();
  });

  it.each(['razonSocial', 'cuit', 'email', 'password', 'telefono', 'localidad', 'rubro'])('%s es obligatorio', async (campo) => {
    const { [campo]: _, ...sinCampo } = minimo;

    await expect(User.create(sinCampo)).rejects.toThrow();
  });

  it('dar de baja con destroy es un borrado lógico (la cuenta sigue en la base)', async () => {
    const usuario = await crearUsuario();

    await usuario.destroy();

    expect(await User.findByPk(usuario.id)).toBeNull();
    expect(await User.findByPk(usuario.id, { paranoid: false })).not.toBeNull();
  });

  it('las categorías y los estados posibles son los del Estatuto', () => {
    expect(User.rawAttributes.categoria.values).toEqual(['activo', 'adherente', 'padrino', 'honorario']);
    expect(User.rawAttributes.estado.values).toEqual(['pendiente', 'aprobado', 'rechazado', 'inactivo']);
    expect(User.rawAttributes.rol.values).toEqual(['socio', 'admin']);
  });
});

describe('Cuota y Pago', () => {
  it('una cuota nueva queda pendiente', async () => {
    expect((await cuotaDe(await crearUsuario())).estado).toBe('pendiente');
  });

  it('un pago nuevo es manual, por transferencia, con fecha de hoy y sin confirmar', async () => {
    const socio = await crearUsuario();
    const cuota = await cuotaDe(socio);

    const pago = await Pago.create({ cuota_id: cuota.id, usuario_id: socio.id, montoAbonado: 10000 });
    await pago.reload(); // los campos sin valor se leen tal cual quedaron en la base

    expect(pago).toMatchObject({ origenPago: 'manual', metodoPago: 'Transferencia', confirmadoAt: null, confirmadoPor: null });
    expect(pago.fechaPago).toBeTruthy();
  });

  it('una cuota no puede tener dos pagos (evita cobrar dos veces la misma cuota)', async () => {
    const socio = await crearUsuario();
    const cuota = await cuotaDe(socio);
    await Pago.create({ cuota_id: cuota.id, usuario_id: socio.id, montoAbonado: 10000 });

    await expect(Pago.create({ cuota_id: cuota.id, usuario_id: socio.id, montoAbonado: 10000 })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('el id de transacción de Mercado Pago es único (un webhook repetido no registra el pago dos veces)', async () => {
    const socio = await crearUsuario();
    const c1 = await cuotaDe(socio, { mes_anio: '2026-10' });
    const c2 = await cuotaDe(socio, { mes_anio: '2026-11' });
    await Pago.create({ cuota_id: c1.id, usuario_id: socio.id, montoAbonado: 1, idTransaccionExterna: 'mp-1' });

    await expect(Pago.create({ cuota_id: c2.id, usuario_id: socio.id, montoAbonado: 1, idTransaccionExterna: 'mp-1' })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('los pagos manuales (sin id de transacción) no chocan entre sí', async () => {
    const socio = await crearUsuario();
    const c1 = await cuotaDe(socio, { mes_anio: '2026-10' });
    const c2 = await cuotaDe(socio, { mes_anio: '2026-11' });

    await Pago.create({ cuota_id: c1.id, usuario_id: socio.id, montoAbonado: 1 });
    await expect(Pago.create({ cuota_id: c2.id, usuario_id: socio.id, montoAbonado: 1 })).resolves.toBeTruthy();
  });

  it('la cuota trae a su socio y a su pago por las relaciones "socio" y "pago"', async () => {
    const socio = await crearUsuario({ razonSocial: 'Empresa Relacionada' });
    const cuota = await cuotaDe(socio);
    await Pago.create({ cuota_id: cuota.id, usuario_id: socio.id, montoAbonado: 10000 });

    const conRelaciones = await Cuota.findByPk(cuota.id, { include: ['socio', 'pago'] });

    expect(conRelaciones.socio.razonSocial).toBe('Empresa Relacionada');
    expect(Number(conRelaciones.pago.montoAbonado)).toBe(10000);
  });
});

describe('Tarifa', () => {
  it('sin monto la tarifa es $0 (esa categoría no genera cuota)', async () => {
    expect(Number((await Tarifa.create({ categoria: 'activo' })).monto)).toBe(0);
  });

  it('hay una sola tarifa por categoría', async () => {
    await Tarifa.create({ categoria: 'activo', monto: 1 });

    await expect(Tarifa.create({ categoria: 'activo', monto: 2 })).rejects.toThrow();
  });
});

describe('Gasto', () => {
  it('un gasto nuevo se paga por transferencia y no tiene comprobante', async () => {
    const gasto = await Gasto.create({ fecha: '2026-11-01', concepto: 'Luz', monto: 100 });

    expect(gasto.medio_pago).toBe('Transferencia');
    expect(gasto.url_comprobante ?? null).toBeNull();
  });

  it.each(['fecha', 'concepto', 'monto'])('%s es obligatorio', async (campo) => {
    const datos = { fecha: '2026-11-01', concepto: 'Luz', monto: 100 };
    delete datos[campo];

    await expect(Gasto.create(datos)).rejects.toThrow();
  });

  it('borrar un gasto es un borrado lógico (por seguridad contable)', async () => {
    const gasto = await Gasto.create({ fecha: '2026-11-01', concepto: 'Luz', monto: 100 });

    await gasto.destroy();

    expect(await Gasto.findByPk(gasto.id, { paranoid: false })).not.toBeNull();
  });
});

describe('Evento e Inscripcion', () => {
  const crearEvento = () => Evento.create({ titulo: 'Taller', descripcion: 'x', fecha: '2026-12-01' });

  it('un evento nuevo es presencial, programado, sin cupo y sin logos', async () => {
    const evento = await crearEvento();

    expect(evento).toMatchObject({ modalidad: 'presencial', estado: 'programado', logosExternos: [] });
    expect(evento.cupoMaximo ?? null).toBeNull();
  });

  it('una inscripción nueva no tiene la asistencia marcada y guarda la fecha', async () => {
    const inscripcion = await Inscripcion.create({ evento_id: (await crearEvento()).id, usuario_id: (await crearUsuario()).id });

    expect(inscripcion.asistio).toBe(false);
    expect(inscripcion.fechaInscripcion).toBeInstanceOf(Date);
  });

  it('un socio no puede quedar inscripto dos veces al mismo evento', async () => {
    const evento = await crearEvento();
    const socio = await crearUsuario();
    await Inscripcion.create({ evento_id: evento.id, usuario_id: socio.id });

    await expect(Inscripcion.create({ evento_id: evento.id, usuario_id: socio.id })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('borrar un evento es un borrado lógico', async () => {
    const evento = await crearEvento();

    await evento.destroy();

    expect(await Evento.findByPk(evento.id, { paranoid: false })).not.toBeNull();
  });
});

describe('Noticia', () => {
  it('una noticia nueva se publica para todos, en la categoría "Otras", con fecha de publicación', async () => {
    const noticia = await Noticia.create({ titulo: 'Título', contenido: 'Contenido' });

    expect(noticia).toMatchObject({ categoria: 'Otras', visibilidad: 'todos', estado: 'publicado' });
    expect(noticia.fechaPublicacion).toBeInstanceOf(Date);
  });
});

describe('Notificacion', () => {
  const datos = (usuario, extra = {}) => ({ usuario_id: usuario.id, tipo: 'cuota_nueva', titulo: 't', mensaje: 'm', ...extra });

  it('una notificación nueva está sin leer', async () => {
    const aviso = await Notificacion.create(datos(await crearUsuario()));

    expect(aviso.leida).toBe(false);
    expect(aviso.leidaAt ?? null).toBeNull();
  });

  it('no puede repetirse la misma alerta (mismo usuario, tipo y referencia)', async () => {
    const usuario = await crearUsuario();
    await Notificacion.create(datos(usuario, { referencia: 'cuota-nueva:1' }));

    await expect(Notificacion.create(datos(usuario, { referencia: 'cuota-nueva:1' }))).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('las alertas sin referencia nunca chocan entre sí', async () => {
    const usuario = await crearUsuario();
    await Notificacion.create(datos(usuario));

    await expect(Notificacion.create(datos(usuario))).resolves.toBeTruthy();
  });
});

describe('Auditoria', () => {
  it('un registro de auditoría guarda cuándo se creó pero no tiene fecha de modificación (un log no se edita)', async () => {
    const registro = await Auditoria.create({ modulo: 'GASTOS', accionTipo: 'CREACION', codigoTecnico: 'X', descripcion: 'd' });

    expect(registro.createdAt).toBeInstanceOf(Date);
    expect(Auditoria.rawAttributes.updatedAt).toBeUndefined();
  });

  it('sin usuario queda a nombre de "Sistema" con rol SISTEMA', async () => {
    const registro = await Auditoria.create({ modulo: 'GASTOS', accionTipo: 'CREACION', codigoTecnico: 'X', descripcion: 'd' });

    expect(registro).toMatchObject({ usuarioNombre: 'Sistema', usuarioRol: 'SISTEMA' });
  });
});
