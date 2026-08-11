import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Exportación limpia sin espacios raros
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
  // Dejamos un solo campo localidad
  localidad: { type: DataTypes.STRING(100), allowNull: false },

  // ==========================================
  // 3. Categorización Capymef y Reportes
  // ==========================================
  categoria: {
    type: DataTypes.ENUM('activo', 'adherente', 'padrino'),
    allowNull: false,
    defaultValue: 'adherente'
  },
  rubro: {
    type: DataTypes.ENUM('Comercio', 'Industria', 'Servicios', 'Agropecuario', 'Otro'),
    allowNull: false, // Obligatorio para los reportes de Fabián
  },
  actividad: {
    type: DataTypes.STRING,
    allowNull: true, // Puede ser opcional, texto libre
  },
  tamanoEmpresa: {
    // Acomodado a los valores exactos que manda tu Frontend en Register.jsx
    type: DataTypes.ENUM('Micro', 'Pequena', 'Mediana', 'Grande'),
    allowNull: true, 
  },

  // ==========================================
  // 4. Control de Administración y Accesos
  // ==========================================
  // Unificamos a un solo campo 'estado' para manejar todo el flujo de vida del socio
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado', 'inactivo'),
    defaultValue: 'pendiente'
  },
  rol: {
    type: DataTypes.ENUM('socio', 'admin'),
    defaultValue: 'socio'
  }
}, {
  paranoid: true,
  timestamps: true
});