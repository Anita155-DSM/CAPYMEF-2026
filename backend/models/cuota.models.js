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
  tableName: 'cuotas',
  indexes: [
    // Una sola cuota por socio y por mes. La generación ya busca antes de crear, pero dos generaciones al mismo
    // tiempo podían crear dos cuotas iguales (y cobrarle dos veces el mismo mes). Mismo nombre que el índice
    // creado a mano en Neon, así una base nueva (y la de los tests) queda igual que la real.
    { unique: true, fields: ['usuario_id', 'mes_anio'], name: 'cuotas_usuario_mes_unico' },
  ],
});

// ==========================================
// DEFINICIÓN DE RELACIONES EN SEQUELIZE
// ==========================================
// Un Usuario tiene muchas Cuotas
User.hasMany(Cuota, { foreignKey: 'usuario_id', as: 'cuotas' });
// Una Cuota pertenece a un solo Usuario
Cuota.belongsTo(User, { foreignKey: 'usuario_id', as: 'socio' });