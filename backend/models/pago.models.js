import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Cuota } from './cuota.models.js';
import { User } from './user.models.js';

export const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  montoAbonado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fechaPago: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  metodoPago: {
    type: DataTypes.ENUM('Transferencia', 'Efectivo', 'Débito', 'Otro'),
    defaultValue: 'Transferencia',
    allowNull: false,
  },
  nroComprobante: {
    type: DataTypes.STRING(100),
    allowNull: true, // ID de transacción del BBVA o número de recibo
  },
  observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'pagos'
});

// Relaciones en Sequelize
Cuota.hasOne(Pago, { foreignKey: 'cuota_id', as: 'pago' });
Pago.belongsTo(Cuota, { foreignKey: 'cuota_id', as: 'cuota' });

User.hasMany(Pago, { foreignKey: 'usuario_id', as: 'pagosRealizados' });
Pago.belongsTo(User, { foreignKey: 'usuario_id', as: 'socio' });