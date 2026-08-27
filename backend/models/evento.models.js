import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Evento = sequelize.define('Evento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  horaInicio: {
    type: DataTypes.STRING(5), // Formato "HH:MM", ej: "18:00"
    allowNull: true,
  },
  horaFin: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  modalidad: {
    type: DataTypes.ENUM('presencial', 'virtual'),
    allowNull: false,
    defaultValue: 'presencial',
  },
  lugar: {
    type: DataTypes.STRING(255),
    allowNull: true, // Dirección física, o el link de la reunión si es virtual
  },
  cupoMaximo: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = sin límite de cupo
  },
  imagenUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // URLs de logos de entidades externas (gobierno, sponsors, etc.) para estampar
  // en los certificados de este evento. Postgres soporta arrays nativamente.
  logosExternos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
  estado: {
    type: DataTypes.ENUM('programado', 'finalizado', 'cancelado'),
    allowNull: false,
    defaultValue: 'programado',
  },
}, {
  paranoid: true, // Soft delete, igual criterio que Noticia y Gasto
  timestamps: true,
  tableName: 'eventos',
});
