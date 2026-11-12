import '../helpers/entorno.js';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Tarifa } from '../../models/tarifa.models.js';
import {
  asegurarTarifasIniciales,
  obtenerMapaDeTarifas,
  categoriasValidas,
  CATEGORIA_CON_CUOTA,
  MONTO_MAXIMO_TARIFA,
} from '../../services/tarifa.service.js';
import { reiniciarBase, cerrarBase } from '../helpers/baseDeDatos.js';

beforeEach(async () => {
  await reiniciarBase();
});

afterAll(async () => {
  await cerrarBase();
});

describe('constantes de tarifas', () => {
  it('la única categoría que paga cuota es "activo"', () => {
    expect(CATEGORIA_CON_CUOTA).toBe('activo');
  });

  it('el tope de seguridad es de $10.000.000', () => {
    expect(MONTO_MAXIMO_TARIFA).toBe(10000000);
  });

  it('las categorías válidas salen del modelo de usuario (una sola lista para todo el sistema)', () => {
    expect(categoriasValidas()).toEqual(['activo', 'adherente', 'padrino', 'honorario']);
  });
});

describe('asegurarTarifasIniciales', () => {
  it('con la tabla vacía crea una tarifa por categoría: activo $10.000 y las demás $0', async () => {
    await asegurarTarifasIniciales();

    expect(await obtenerMapaDeTarifas()).toEqual({ activo: 10000, adherente: 0, padrino: 0, honorario: 0 });
  });

  it('no pisa una tarifa que el admin ya cambió', async () => {
    await Tarifa.create({ categoria: 'activo', monto: 15000 });

    await asegurarTarifasIniciales();

    expect((await obtenerMapaDeTarifas()).activo).toBe(15000);
  });

  it('correrla varias veces (cada arranque del servidor) no duplica filas', async () => {
    await asegurarTarifasIniciales();
    await asegurarTarifasIniciales();

    expect(await Tarifa.count()).toBe(4);
  });

  it('completa solo las categorías que faltan', async () => {
    await Tarifa.create({ categoria: 'adherente', monto: 0 });

    await asegurarTarifasIniciales();

    expect(await Tarifa.count()).toBe(4);
  });
});

describe('obtenerMapaDeTarifas', () => {
  it('devuelve los montos como número, aunque la base los guarde como DECIMAL (texto)', async () => {
    await Tarifa.create({ categoria: 'activo', monto: '12500.50' });

    const mapa = await obtenerMapaDeTarifas();

    expect(mapa).toEqual({ activo: 12500.5 });
    expect(typeof mapa.activo).toBe('number');
  });

  it('sin tarifas cargadas devuelve un objeto vacío', async () => {
    expect(await obtenerMapaDeTarifas()).toEqual({});
  });
});
