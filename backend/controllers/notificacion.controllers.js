import { Notificacion } from '../models/notificacion.models.js';
import { contarNoLeidas } from '../services/notificacion.service.js';

// Todas las funciones trabajan SOLO con las notificaciones del usuario dueño del token:
// el id sale de req.usuario (firmado por nosotros), nunca de un parámetro que mande el cliente.
// Así un usuario no puede ver ni marcar las alertas de otro.

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==========================================
// 1. LISTAR MIS NOTIFICACIONES
// ==========================================
// GET /api/notificaciones?soloNoLeidas=true&page=1&limit=20
export const obtenerMisNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Paginación con tope, para que nadie pida 100000 filas de una vez.
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const where = { usuario_id: usuarioId };
    if (req.query.soloNoLeidas === 'true') where.leida = false;

    const { count, rows } = await Notificacion.findAndCountAll({
      where,
      attributes: ['id', 'tipo', 'titulo', 'mensaje', 'enlace', 'leida', 'leidaAt', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    res.status(200).json({
      exito: true,
      total: count,
      noLeidas: await contarNoLeidas(usuarioId),
      paginaActual: page,
      totalPaginas: Math.ceil(count / limit),
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al obtener tus notificaciones.' });
  }
};

// ==========================================
// 2. CONTADOR DE NO LEÍDAS
// ==========================================
// GET /api/notificaciones/contador  -> para el globito de la campanita
export const obtenerContador = async (req, res) => {
  try {
    res.status(200).json({ exito: true, noLeidas: await contarNoLeidas(req.usuario.id) });
  } catch (error) {
    console.error('Error al contar las notificaciones:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al contar tus notificaciones.' });
  }
};

// ==========================================
// 3. MARCAR UNA COMO LEÍDA
// ==========================================
// PUT /api/notificaciones/:id/leer
export const marcarComoLeida = async (req, res) => {
  try {
    // Un id que no es UUID haría fallar la consulta en Postgres (500): lo cortamos antes.
    if (!REGEX_UUID.test(req.params.id)) {
      return res.status(404).json({ exito: false, mensaje: 'Notificación no encontrada.' });
    }

    // Buscamos por id Y por dueño: si es de otro usuario respondemos 404, sin confirmar que existe.
    const notificacion = await Notificacion.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
    });

    if (!notificacion) {
      return res.status(404).json({ exito: false, mensaje: 'Notificación no encontrada.' });
    }

    // Idempotente: si ya estaba leída no pisamos la fecha original.
    if (!notificacion.leida) {
      await notificacion.update({ leida: true, leidaAt: new Date() });
    }

    res.status(200).json({
      exito: true,
      mensaje: 'Notificación marcada como leída.',
      data: { id: notificacion.id, leida: notificacion.leida, leidaAt: notificacion.leidaAt },
    });
  } catch (error) {
    console.error('Error al marcar la notificación como leída:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al marcar la notificación.' });
  }
};

// ==========================================
// 4. MARCAR TODAS COMO LEÍDAS
// ==========================================
// PUT /api/notificaciones/leer-todas
export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const [actualizadas] = await Notificacion.update(
      { leida: true, leidaAt: new Date() },
      { where: { usuario_id: req.usuario.id, leida: false } }
    );

    res.status(200).json({
      exito: true,
      mensaje: `${actualizadas} notificación(es) marcada(s) como leída(s).`,
      actualizadas,
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al marcar tus notificaciones.' });
  }
};
