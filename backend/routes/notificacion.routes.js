import { Router } from 'express';
import {
  obtenerMisNotificaciones,
  obtenerContador,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '../controllers/notificacion.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Cualquier usuario logueado (socio o admin) ve SUS notificaciones: no hace falta verificarAdmin.
router.use(verificarToken);

// Rutas fijas primero
router.get('/', obtenerMisNotificaciones);
router.get('/contador', obtenerContador);
router.put('/leer-todas', marcarTodasComoLeidas);

// Rutas con parámetro al final (convención del proyecto: /:id siempre último)
router.put('/:id/leer', marcarComoLeida);

export default router;
