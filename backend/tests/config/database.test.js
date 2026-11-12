import '../helpers/entorno.js';
import { afterAll, describe, expect, it } from 'vitest';
import { sequelize } from '../../config/database.js';

// Garantía de seguridad de toda la suite: con NODE_ENV=test la conexión es una base SQLite en memoria,
// nunca la base real (Neon). Si esto fallara, los tests podrían borrar datos reales (reiniciarBase usa
// sync({ force: true })).
afterAll(async () => {
  await sequelize.close();
});

describe('config/database.js en los tests', () => {
  it('usa SQLite, no Postgres', () => {
    expect(sequelize.getDialect()).toBe('sqlite');
  });

  it('la base vive en memoria (no se escribe ningún archivo)', () => {
    expect(sequelize.options.storage).toBe(':memory:');
  });

  it('no tiene host configurado: no se conecta a ningún servidor', () => {
    expect(sequelize.options.host).toBeUndefined();
    expect(String(sequelize.config.host)).not.toMatch(/neon|amazonaws|supabase/i);
  });

  it('no imprime las consultas SQL (logging apagado)', () => {
    expect(sequelize.options.logging).toBe(false);
  });

  it('la conexión funciona', async () => {
    await expect(sequelize.authenticate()).resolves.toBeUndefined();
  });
});
