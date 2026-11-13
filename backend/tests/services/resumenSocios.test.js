import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTypes } from 'sequelize';
import { User } from '../../models/user.models.js';
import { Evento } from '../../models/evento.models.js';
import { calcularResumenInicio } from '../../services/resumenInicio.service.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Bloque "socios" de resumen-inicio: los conteos del padrón que antes calculaba el frontend. Sin admins, solo
// con consultas de conteo. La base es SQLite real.
// resumenInicio usa el modelo Evento, cuya columna logosExternos es un ARRAY de Postgres que SQLite no tiene:
// solo en los tests se la trata como JSON. No cambia el modelo real.
Evento.rawAttributes.logosExternos.type = DataTypes.JSON;
Evento.refreshAttributes();

const HOY = '2026-11-13';
const resumen = () => calcularResumenInicio({ hoy: HOY });

beforeEach(async () => {
  await reiniciarBase();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

// Escenario calculado a mano:
//   aprobados → activo 3, adherente 2 (1 degradado por mora), padrino 1, honorario 1  → total 7
//   pendientes 2 · rechazado 1 · inactivos 2 (no cuentan en el total ni en porCategoria)
//   2 admins aprobados (uno activo y uno adherente degradado): no cuentan en ningún número
const cargarEscenario = async () => {
  for (const categoria of ['activo', 'activo', 'activo', 'adherente', 'padrino', 'honorario']) await crearUsuario({ categoria });
  await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });
  await crearUsuario({ categoria: 'activo', estado: 'pendiente' });
  await crearUsuario({ categoria: 'adherente', estado: 'pendiente' });
  await crearUsuario({ categoria: 'activo', estado: 'rechazado' });
  await crearUsuario({ categoria: 'activo', estado: 'inactivo' });
  await crearUsuario({ categoria: 'padrino', estado: 'inactivo' });
  await crearUsuario({ rol: 'admin', categoria: 'activo' });
  await crearUsuario({ rol: 'admin', categoria: 'adherente', degradadoPorMora: true });
};

describe('resumen-inicio: bloque socios', () => {
  it('con socios de cada categoría y estado, y 2 admins, los conteos dan lo calculado a mano', async () => {
    await cargarEscenario();

    expect((await resumen()).socios).toEqual({
      totalSocios: 7,
      porCategoria: { activo: 3, adherente: 2, padrino: 1, honorario: 1 },
      solicitudesPendientes: 2,
      degradadosPorMora: 1,
    });
  });

  it('el total es la suma de porCategoria', async () => {
    await cargarEscenario();

    const { socios } = await resumen();

    expect(Object.values(socios.porCategoria).reduce((a, b) => a + b, 0)).toBe(socios.totalSocios);
  });

  it('los admin no cuentan en ningún número (ni aprobados, ni pendientes, ni degradados)', async () => {
    await crearUsuario({ rol: 'admin', categoria: 'activo' });
    await crearUsuario({ rol: 'admin', categoria: 'honorario' });
    await crearUsuario({ rol: 'admin', categoria: 'adherente', estado: 'pendiente' });
    await crearUsuario({ rol: 'admin', categoria: 'adherente', degradadoPorMora: true });

    expect((await resumen()).socios).toEqual({
      totalSocios: 0,
      porCategoria: { activo: 0, adherente: 0, padrino: 0, honorario: 0 },
      solicitudesPendientes: 0,
      degradadosPorMora: 0,
    });
  });

  it.each(['pendiente', 'rechazado', 'inactivo'])('una cuenta %s no cuenta en el total ni en porCategoria', async (estado) => {
    await crearUsuario({ categoria: 'activo', estado });

    const { socios } = await resumen();

    expect(socios.totalSocios).toBe(0);
    expect(socios.porCategoria.activo).toBe(0);
  });

  it('un socio degradado pero no aprobado (por ejemplo, dado de baja) no cuenta como degradado', async () => {
    await crearUsuario({ categoria: 'adherente', degradadoPorMora: true, estado: 'inactivo' });

    expect((await resumen()).socios.degradadosPorMora).toBe(0);
  });

  it('una cuenta borrada (borrado lógico) no cuenta', async () => {
    const borrada = await crearUsuario({ categoria: 'activo' });
    await borrada.destroy();

    expect((await resumen()).socios.totalSocios).toBe(0);
  });

  it('una cuenta con el rol sin cargar (null) se cuenta como socio, igual que en el resto del sistema', async () => {
    const sinRol = await crearUsuario({ categoria: 'padrino' });
    await User.sequelize.query('UPDATE Users SET rol = NULL WHERE id = :id', { replacements: { id: sinRol.id } });

    expect((await resumen()).socios.porCategoria.padrino).toBe(1);
  });

  it('con la base vacía todo da 0 (nunca null)', async () => {
    expect((await resumen()).socios).toEqual({
      totalSocios: 0,
      porCategoria: { activo: 0, adherente: 0, padrino: 0, honorario: 0 },
      solicitudesPendientes: 0,
      degradadosPorMora: 0,
    });
  });

  // La única lectura de usuarios del resumen es la que ya hacía la morosidad (solo los id de los Activos, para
  // contar los socios en riesgo). El bloque socios no agrega ninguna: todo son COUNT.
  it('se calcula con consultas de conteo: el bloque socios no descarga usuarios', async () => {
    await cargarEscenario();
    const descargar = vi.spyOn(User, 'findAll');
    const contar = vi.spyOn(User, 'count');

    await resumen();

    expect(descargar).toHaveBeenCalledOnce();
    expect(descargar.mock.calls[0][0]).toMatchObject({ attributes: ['id'], where: { categoria: 'activo' } });
    expect(contar).toHaveBeenCalledTimes(3);
  });

  it('las claves que ya existían siguen iguales y socios se suma al final', async () => {
    const resultado = await resumen();

    expect(Object.keys(resultado)).toEqual(['periodo', 'recaudacion', 'morosidad', 'proximoEvento', 'socios']);
    expect(resultado.periodo).toBe('2026-11');
    expect(Object.keys(resultado.recaudacion)).toEqual(['montoRecaudado', 'cuotasDelMes', 'cuotasPagadas', 'porcentajeCobrado']);
    expect(Object.keys(resultado.morosidad)).toEqual(['indice', 'sociosConDeuda', 'sociosConCuotas', 'sociosEnRiesgo', 'umbralRiesgo', 'cuotasVencidas']);
    expect(resultado.proximoEvento).toBeNull();
  });
});
