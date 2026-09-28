import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Una fila por categoría de socio. La categoría es STRING (no ENUM) a propósito:
// cuando la Cámara defina el listado oficial de categorías, no queremos pelearnos
// con un ALTER TYPE en Postgres para cada cambio.
export const Tarifa = sequelize.define('Tarifa', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  categoria: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0, // 0 = esta categoría no genera cuota mensual
  },
}, {
  timestamps: true,
  tableName: 'tarifas',
});