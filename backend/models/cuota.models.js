import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './user.models.js'; // Importamos User para hacer la relación

export const Cuota = sequelize.define('Cuota', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  mes_anio: {
    type: DataTypes.STRING(7), // Formato estricto: "YYYY-MM" (Ej: "2026-08")
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false, // Será siempre el día 10 del mes correspondiente
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagada', 'vencida'),
    defaultValue: 'pendiente',
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'cuotas'
});

// ==========================================
// DEFINICIÓN DE RELACIONES EN SEQUELIZE
// ==========================================
// Un Usuario tiene muchas Cuotas
User.hasMany(Cuota, { foreignKey: 'usuario_id', as: 'cuotas' });
// Una Cuota pertenece a un solo Usuario
Cuota.belongsTo(User, { foreignKey: 'usuario_id', as: 'socio' });