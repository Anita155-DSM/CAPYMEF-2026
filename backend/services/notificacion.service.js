import { Notificacion } from '../models/notificacion.models.js';
import { User } from '../models/user.models.js';

// Crea UNA notificación para un usuario. Devuelve true si se creó, false si ya existía
// (misma referencia) o si falló.
//
// IMPORTANTE: nunca lanza error. Una alerta interna es un "extra": si fallara no puede
// tumbar el registro de un pago ni un cron. El error se loguea y se sigue.
export const crearNotificacion = async ({ usuarioId, tipo, titulo, mensaje, enlace = null, referencia = null }) => {
  try {
    const datos = { usuario_id: usuarioId, tipo, titulo, mensaje, enlace, referencia };

    // Sin referencia no hay forma de detectar duplicados: se crea siempre.
    if (!referencia) {
      await Notificacion.create(datos);
      return true;
    }

    // Con referencia: si ya existe la misma alerta (usuario + tipo + referencia) no la repetimos.
    const [, creada] = await Notificacion.findOrCreate({
      where: { usuario_id: usuarioId, tipo, referencia },
      defaults: datos,
    });
    return creada;
  } catch (error) {
    console.error(`No se pudo crear la notificación "${tipo}" para el usuario ${usuarioId}:`, error.message);
    return false;
  }
};

// Crea la misma notificación para cada admin activo (aprobado). Para avisos de gestión
// (pagos por confirmar, cuotas vencidas, etc.). Devuelve cuántas se crearon.
export const notificarAdmins = async ({ tipo, titulo, mensaje, enlace = null, referencia = null }) => {
  try {
    const admins = await User.findAll({
      where: { rol: 'admin', estado: 'aprobado' },
      attributes: ['id'],
    });

    let creadas = 0;
    for (const admin of admins) {
      const creada = await crearNotificacion({ usuarioId: admin.id, tipo, titulo, mensaje, enlace, referencia });
      if (creada) creadas++;
    }
    return creadas;
  } catch (error) {
    console.error(`No se pudo notificar a los administradores ("${tipo}"):`, error.message);
    return 0;
  }
};

// Cantidad de notificaciones sin leer de un usuario (para el globito del frontend).
export const contarNoLeidas = (usuarioId) =>
  Notificacion.count({ where: { usuario_id: usuarioId, leida: false } });
