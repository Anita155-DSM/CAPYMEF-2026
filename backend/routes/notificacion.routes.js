import { Router } from 'express';
import {
  obtenerMisNotificaciones,
  obtenerContador,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '../controllers/notificacion.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { paramUuid } from '../middlewares/validarParametros.js';

const router = Router();

// El :id es el UUID de una notificación: el formato se valida antes de consultar la base y se responde 400
// (sin esto, un id inválido terminaba en un 500).
router.param('id', paramUuid);

// Cualquier usuario logueado (socio o admin) ve SUS notificaciones: no hace falta verificarAdmin.
router.use(verificarToken);

// Rutas fijas primero
router.get('/', obtenerMisNotificaciones);
router.get('/contador', obtenerContador);
router.put('/leer-todas', marcarTodasComoLeidas);

// Rutas con parámetro al final (convención del proyecto: /:id siempre último)
router.put('/:id/leer', marcarComoLeida);

export default router;
