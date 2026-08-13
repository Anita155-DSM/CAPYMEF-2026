import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATEONLY, // Solo la fecha (YYYY-MM-DD), sin la hora
    allowNull: false,
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    // Ej: "Factura REFSA Luz", "Mantenimiento Aire Acondicionado"
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2), // Permite números con 2 decimales (ej: 15400.50)
    allowNull: false,
  },
  medio_pago: {
    type: DataTypes.ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'),
    allowNull: false,
    defaultValue: 'Transferencia'
  },
  url_comprobante: {
    type: DataTypes.STRING,
    allowNull: true, // Puede ser null si por alguna razón no tienen el ticket
  }
}, {
  paranoid: true, // Mantenemos el borrado lógico por seguridad contable
  timestamps: true,
  tableName: 'gastos' // Forzamos el nombre de la tabla en plural
});