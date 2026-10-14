import { Tarifa } from '../models/tarifa.models.js';
import { User } from '../models/user.models.js';

// Montos simulados que ya usaba el sistema antes de tener tarifas editables.
// Solo se usan para sembrar la tabla la primera vez; después manda lo que cargue el admin.
const MONTOS_INICIALES = { activo: 15000, adherente: 10000, padrino: 25000 };

// Las categorías válidas salen del modelo User, así no hay dos listas que desincronizar.
export const categoriasValidas = () => User.rawAttributes.categoria.values;

// Crea la tarifa de cada categoría que todavía no tenga una. No pisa las existentes.
export const asegurarTarifasIniciales = async () => {
  for (const categoria of categoriasValidas()) {
    await Tarifa.findOrCreate({
      where: { categoria },
      defaults: { monto: MONTOS_INICIALES[categoria] ?? 0 },
    });
  }
};

// Devuelve { activo: 15000, adherente: 10000, ... } con los montos como Number
// (Sequelize devuelve los DECIMAL como string).
export const obtenerMapaDeTarifas = async () => {
  const tarifas = await Tarifa.findAll();
  return Object.fromEntries(tarifas.map((t) => [t.categoria, Number(t.monto)]));
};