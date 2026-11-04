import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../models/user.models.js';
import { Cuota } from '../../models/cuota.models.js';
import { Notificacion } from '../../models/notificacion.models.js';
import {
  evaluarCategoriaSocio,
  evaluarCategoriasDeTodos,
  LIMITE_CUOTAS_VENCIDAS,
} from '../../services/categoria.service.js';
import { reiniciarBase, cerrarBase, crearUsuario, crearCuotas } from '../helpers/baseDeDatos.js';

// Regla de mora de la Cámara: un socio Activo con 3 cuotas vencidas pasa a Adherente y vuelve
// a Activo cuando regulariza. Se prueba contra la base en memoria porque la regla depende de lo
// que está guardado (cuotas y categoría), no de valores que se le pasen a la función.

beforeEach(async () => {
  await reiniciarBase();
});

afterAll(async () => {
  await cerrarBase();
});

// Se relee de la base para comprobar lo que realmente quedó guardado, no el objeto en memoria.
const categoriaActual = async (id) => {
  const usuario = await User.findByPk(id);
  return { categoria: usuario.categoria, degradadoPorMora: usuario.degradadoPorMora };
};

describe('evaluarCategoriaSocio - degradación por mora', () => {
  it('el límite de cuotas vencidas es 3', () => {
    // Si alguien cambia el número sin querer, este test avisa que cambió una regla de negocio.
    expect(LIMITE_CUOTAS_VENCIDAS).toBe(3);
  });

  it('un socio Activo con 3 cuotas vencidas pasa a Adherente y queda marcado como degradado por mora', async () => {
    const socio = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(socio.id, 3, 'vencida');

    const resultado = await evaluarCategoriaSocio(socio.id);

    expect(resultado).toBe('degradado');
    expect(await categoriaActual(socio.id)).toEqual({ categoria: 'adherente', degradadoPorMora: true });
  });

  it('un socio Activo con solo 2 cuotas vencidas sigue siendo Activo', async () => {
    // Caso límite: una cuota menos que el límite no debe disparar la regla.
    const socio = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(socio.id, 2, 'vencida');

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect((await categoriaActual(socio.id)).categoria).toBe('activo');
  });

  it('las cuotas pendientes (todavía no vencidas) no cuentan para la mora', async () => {
    // Solo se castiga la deuda vencida: una cuota del mes en curso todavía se puede pagar.
    const socio = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(socio.id, 4, 'pendiente');

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect((await categoriaActual(socio.id)).categoria).toBe('activo');
  });

  it('al degradar avisa al socio y a los administradores con una notificación interna', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const socio = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(socio.id, 3, 'vencida');

    await evaluarCategoriaSocio(socio.id);

    const avisoSocio = await Notificacion.findOne({ where: { usuario_id: socio.id } });
    const avisoAdmin = await Notificacion.findOne({ where: { usuario_id: admin.id } });
    expect(avisoSocio.tipo).toBe('categoria_degradada');
    expect(avisoAdmin.tipo).toBe('socio_degradado');
  });

  it('una cuenta que no está aprobada (por ejemplo, inactiva) no se evalúa', async () => {
    // Solo se aplican reglas a cuentas habilitadas: una dada de baja no tiene que cambiar.
    const socio = await crearUsuario({ categoria: 'activo', estado: 'inactivo' });
    await crearCuotas(socio.id, 3, 'vencida');

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect((await categoriaActual(socio.id)).categoria).toBe('activo');
  });

  it('devuelve null sin lanzar error si el socio no existe', async () => {
    // La función nunca debe lanzar: la llaman pagos y crons, y no puede tumbarlos.
    expect(await evaluarCategoriaSocio(9999)).toBeNull();
  });
});

describe('evaluarCategoriaSocio - padrino y honorario nunca se tocan', () => {
  // it.each corre el mismo test para cada categoría protegida.
  it.each(['padrino', 'honorario'])(
    'un socio %s con muchas cuotas vencidas conserva su categoría',
    async (categoria) => {
      const socio = await crearUsuario({ categoria });
      await crearCuotas(socio.id, 5, 'vencida');

      expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
      expect(await categoriaActual(socio.id)).toEqual({ categoria, degradadoPorMora: false });
    }
  );
});

describe('evaluarCategoriaSocio - recuperación al regularizar', () => {
  it('un socio degradado por mora vuelve a Activo cuando paga todas sus cuotas vencidas', async () => {
    // Ciclo completo: Activo -> (3 vencidas) -> Adherente -> (paga todo) -> Activo.
    const socio = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(socio.id, 3, 'vencida');
    await evaluarCategoriaSocio(socio.id);

    // Simulamos que regulariza: todas sus cuotas pasan a pagadas.
    await Cuota.update({ estado: 'pagada' }, { where: { usuario_id: socio.id } });
    const resultado = await evaluarCategoriaSocio(socio.id);

    expect(resultado).toBe('recuperado');
    expect(await categoriaActual(socio.id)).toEqual({ categoria: 'activo', degradadoPorMora: false });
  });

  it('si todavía le queda una cuota vencida sigue siendo Adherente', async () => {
    // Regularizar es tener CERO vencidas: si alcanzara con bajar de 3, volvería a Activo
    // debiendo plata y caería de nuevo al mes siguiente.
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: true });
    await crearCuotas(socio.id, 1, 'vencida');

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect((await categoriaActual(socio.id)).categoria).toBe('adherente');
  });

  it('un Adherente que nunca fue degradado por mora no pasa a Activo solo', async () => {
    // Si un admin lo puso Adherente a mano (o siempre lo fue), el sistema no debe "ascenderlo".
    const socio = await crearUsuario({ categoria: 'adherente', degradadoPorMora: false });

    expect(await evaluarCategoriaSocio(socio.id)).toBeNull();
    expect((await categoriaActual(socio.id)).categoria).toBe('adherente');
  });
});

describe('evaluarCategoriasDeTodos', () => {
  it('evalúa a todos los socios y cuenta cuántos se degradaron y cuántos se recuperaron', async () => {
    const moroso = await crearUsuario({ categoria: 'activo' });
    await crearCuotas(moroso.id, 3, 'vencida');
    await crearUsuario({ categoria: 'adherente', degradadoPorMora: true }); // sin deudas: se recupera
    await crearUsuario({ categoria: 'activo' }); // al día: no cambia

    expect(await evaluarCategoriasDeTodos()).toEqual({ degradados: 1, recuperados: 1 });
  });
});
