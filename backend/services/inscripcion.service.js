import { Op } from 'sequelize';
import { Inscripcion } from '../models/inscripcion.models.js';
import { Evento } from '../models/evento.models.js';
import { fechaHoyArgentina } from './cuota.service.js';

// ==========================================
// Inscripciones a eventos: conteo del cupo y liberación de lugares
// ==========================================

// Cuántas personas ocupan lugar en un evento. Es la ÚNICA forma de contarlo: la usan el detalle del evento,
// la inscripción (para el cupo) y el resumen del inicio del panel, así los tres dan siempre el mismo número.
// Una inscripción cancelada se borra (no tiene estado), así que nunca cuenta.
// `transaction` permite contar dentro de la transacción de la inscripción, con la fila del evento bloqueada
// (ver inscribirseEvento en evento.controllers.js).
export const contarInscriptos = (eventoId, { transaction } = {}) =>
  Inscripcion.count({ where: { evento_id: eventoId }, transaction });

// Una cuenta que deja de estar 'aprobado' ya no puede entrar al sistema (verificarToken solo deja pasar a las
// aprobadas), así que tampoco puede ir a los eventos: si conservara sus inscripciones, seguiría ocupando un
// lugar del cupo que otro socio podría usar.
export const dejaDeTenerAcceso = (usuario) => usuario.changed('estado') && usuario.estado !== 'aprobado';

// Borra las inscripciones del socio a eventos que todavía no ocurrieron (fecha de hoy en adelante, en hora
// argentina: un evento de hoy todavía no pasó). Las de eventos pasados se conservan: son el registro de
// asistencia y sirven para emitir los certificados.
// Incluye eventos borrados (paranoid: false): si se restauran, el socio dado de baja no debe reaparecer.
// Devuelve cuántas inscripciones se borraron. Se le pasa la transacción de la baja para que el cambio de
// estado y la liberación de lugares queden juntos: o se hacen las dos cosas o ninguna.
export const liberarInscripcionesFuturas = async (usuarioId, { transaction } = {}) => {
  const futuras = await Inscripcion.findAll({
    where: { usuario_id: usuarioId },
    attributes: ['id'],
    include: [{
      model: Evento,
      as: 'evento',
      attributes: [],
      where: { fecha: { [Op.gte]: fechaHoyArgentina() } },
      paranoid: false,
    }],
    transaction,
  });
  if (futuras.length === 0) return 0;

  return Inscripcion.destroy({ where: { id: futuras.map((i) => i.id) }, transaction });
};
