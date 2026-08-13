import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Noticia = sequelize.define('Noticia', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  subtitulo: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imagenUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Determina en dónde se debe mostrar la noticia
  visibilidad: {
    type: DataTypes.ENUM('publico', 'socios', 'todos'),
    allowNull: false,
    defaultValue: 'todos', // 'publico' = Solo Landing, 'socios' = Solo Portal Socios, 'todos' = Ambos
  },
  estado: {
    type: DataTypes.ENUM('borrador', 'publicado'),
    allowNull: false,
    defaultValue: 'publicado',
  },
  fechaPublicacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  paranoid: true, // Borrado lógico (soft delete)
  timestamps: true,
  tableName: 'noticias'
});