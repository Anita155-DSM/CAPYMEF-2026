import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
  // ==========================================
  // 1. Datos de Identificación (Obligatorios)
  // ==========================================
  razonSocial: { type: DataTypes.STRING(150), allowNull: false },
  cuit: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  constanciaUrl: { type: DataTypes.STRING, allowNull: true },

  // ==========================================
  // 2. Datos de Contacto (Nuevos - Estatuto Capymef)
  // ==========================================
  telefono: { type: DataTypes.STRING(20), allowNull: false },
  localidad: { type: DataTypes.STRING(100), allowNull: false },

  // ==========================================
  // 3. Categorización Capymef
  // ==========================================
  categoria: {
    // Crucial para saber a quién cobrarle y cuánto (Épica 2)
    type: DataTypes.ENUM('activo', 'adherente', 'padrino'),
    allowNull: false,
    defaultValue: 'adherente'
  },

  // ==========================================
  // 4. Control de Administración y Accesos
  // ==========================================
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    defaultValue: 'pendiente'
  },
  rol: {
    type: DataTypes.ENUM('socio', 'admin'),
    defaultValue: 'socio'
  }, 
  // 5. esto nos permite visualizar los usuarios que esten en pendiente aprobación, y filtrarlos al admin
  estado_registro: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente', // Todo usuario nuevo nace bloqueado
    allowNull: false
  }
},
  {
    paranoid: true,
    timestamps: true
  });