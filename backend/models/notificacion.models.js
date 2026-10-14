import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './user.models.js';

// Alerta interna del sistema dirigida a UN usuario (socio o admin).
// Los mails siguen funcionando igual: esto es un canal más, visible dentro de la aplicación.
export const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Destinatario. Lo declaramos explícito (y no solo por la asociación) para poder
  // usarlo en el índice único de abajo.
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Clasifica la alerta (ej: 'cuota_nueva', 'cuota_vencida', 'pago_registrado').
  // Es STRING y no ENUM a propósito: sumar un tipo nuevo no debe exigir tocar la base.
  tipo: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  // Ruta del frontend a la que debería llevar al hacer clic (ej: '/socios/pagos'). Es opcional.
  enlace: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  // Identifica el HECHO que originó la alerta (ej: 'cuota-vencida:<id de la cuota>').
  // Junto con usuario y tipo forma un índice único: si un cron corre dos veces
  // no se duplica la misma alerta. Si es null no se controla duplicado.
  referencia: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  leida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  leidaAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'notificaciones',
  indexes: [
    // En Postgres los NULL se consideran distintos entre sí, así que las alertas
    // sin referencia nunca chocan con este índice.
    { unique: true, fields: ['usuario_id', 'tipo', 'referencia'] },
    // Acelera el listado y el contador de "no leídas" de cada usuario.
    { fields: ['usuario_id', 'leida'] },
  ],
});

// Un usuario tiene muchas notificaciones; si se borra el usuario, se van con él.
User.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones', onDelete: 'CASCADE' });
Notificacion.belongsTo(User, { foreignKey: 'usuario_id', as: 'destinatario' });
