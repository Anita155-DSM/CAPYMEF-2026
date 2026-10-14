import { Op } from 'sequelize';
import { Notificacion } from '../models/notificacion.models.js';
import { User } from '../models/user.models.js';

// ==========================================
// Helpers de formato para armar los mensajes
// ==========================================
// Viven acá para que cuotas y pagos escriban los textos de la misma manera.

// "2026-10-10" -> "10/10/2026"
export const formatearFecha = (fechaISO) => {
  const [anio, mes, dia] = String(fechaISO).split('-');
  return `${dia}/${mes}/${anio}`;
};

// "2026-10" -> "10/2026"
export const formatearPeriodo = (mesAnio) => {
  const [anio, mes] = String(mesAnio).split('-');
  return `${mes}/${anio}`;
};

// 10000 o "10000.00" -> "$10.000"
export const formatearMonto = (monto) => `$${Number(monto).toLocaleString('es-AR')}`;

// Días entre dos fechas "YYYY-MM-DD". Se calcula en UTC para que el horario de verano
// o la zona del servidor no corran el resultado un día.
export const diasEntre = (desdeISO, hastaISO) => {
  const aMilisegundos = (iso) => {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return Date.UTC(anio, mes - 1, dia);
  };
  return Math.round((aMilisegundos(hastaISO) - aMilisegundos(desdeISO)) / 86400000);
};

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
// excluirUsuarioId (opcional): no avisarle a ese admin, típicamente quien disparó la acción
// y por eso ya está al tanto.
export const notificarAdmins = async ({ tipo, titulo, mensaje, enlace = null, referencia = null, excluirUsuarioId = null }) => {
  try {
    const where = { rol: 'admin', estado: 'aprobado' };
    if (excluirUsuarioId) where.id = { [Op.ne]: excluirUsuarioId };

    const admins = await User.findAll({ where, attributes: ['id'] });

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
