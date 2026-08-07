import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
  razonSocial: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  cuit: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  constanciaUrl: { type: DataTypes.STRING, allowNull: true },
  
  // Control de Administración
  estado: { 
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'), 
    defaultValue: 'pendiente' 
  },
  
  // Distinguir si es un socio normal o el admin de CAPYMEF (por el momento solo dos roles, hasta definir mejor el sistema)
  rol: { 
    type: DataTypes.ENUM('socio', 'admin'), 
    defaultValue: 'socio' 
  }
}, 
{ 
  paranoid: true,
  timestamps: true 
});