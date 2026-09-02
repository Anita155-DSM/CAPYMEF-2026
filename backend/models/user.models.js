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
  rubro: { 
    type: DataTypes.ENUM('Comercio', 'Industria', 'Servicios', 'Agropecuario', 'Otro'), 
    allowNull: false 
  },
  actividad: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  tamano_empresa: { 
    type: DataTypes.ENUM('Micro', 'Pequena', 'Mediana', 'Grande'), 
    allowNull: true 
  },
  // ...
  
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
   // ==========================================
  // 5. Recuperación de contraseña
  // ==========================================
  // Guardamos el hash SHA-256 del token, nunca el token en texto plano —
  // así, si alguien accede a la base, no puede generar links de reset válidos.
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, 
{ 
  paranoid: true,
  timestamps: true 
});