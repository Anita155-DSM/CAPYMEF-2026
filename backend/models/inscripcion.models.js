import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Evento } from './evento.models.js';
import { User } from './user.models.js';

export const Inscripcion = sequelize.define('Inscripcion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fechaInscripcion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  // Campo clave para el "checklist" de asistencia que pedía el doc:
  // el admin lo marca manualmente el día del evento/capacitación.
  asistio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'inscripciones',
  indexes: [
    // Evita que un mismo socio se inscriba dos veces al mismo evento
    { unique: true, fields: ['evento_id', 'usuario_id'] },
  ],
});

// ==========================================
// RELACIONES
// ==========================================
Evento.hasMany(Inscripcion, { foreignKey: 'evento_id', as: 'inscripciones' });
Inscripcion.belongsTo(Evento, { foreignKey: 'evento_id', as: 'evento' });

User.hasMany(Inscripcion, { foreignKey: 'usuario_id', as: 'inscripciones' });
Inscripcion.belongsTo(User, { foreignKey: 'usuario_id', as: 'socio' });
