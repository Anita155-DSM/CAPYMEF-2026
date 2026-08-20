import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true // Puede ser null si es una acción del sistema o usuario sin loguear
  },
  usuarioNombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Sistema'
  },
  usuarioRol: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'SISTEMA'
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false // Ej: 'SOCIOS', 'GASTOS', 'CUOTAS', 'AUTH'
  },
  accionTipo: {
    type: DataTypes.STRING(20),
    allowNull: false // Ej: 'CREACION', 'MODIFICACION', 'ELIMINACION', 'ACCESO'
  },
  codigoTecnico: {
    type: DataTypes.STRING(50),
    allowNull: false // Ej: 'UPDATE_SOCIO', 'CREATE_GASTO', 'DELETE_PAGO'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false // Texto en español claro para los administrativos
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'auditorias',
  timestamps: true,
  updatedAt: false // Un log nunca se edita, solo guarda la fecha de creación (createdAt)
});