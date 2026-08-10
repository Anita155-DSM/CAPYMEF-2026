import { Router } from 'express';
import { obtenerSolicitudesPendientes, gestionarSolicitud } from '../controllers/admin.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de este archivo exigirán que el usuario esté logueado
router.use(verificarToken); 

// Rutas para la gestión de nuevos socios
router.get('/solicitudes', obtenerSolicitudesPendientes);
router.put('/solicitudes/:id', gestionarSolicitud);

/* ÉPICA 2 (FINANZAS):
  cuando hagamos el panel financiero,
  podremos agregar aquí tus rutas de finanzas, ej
  router.get('/finanzas/morosos', obtenerReporteMorosos);
  router.post('/egresos', registrarGasto);
*/

export default router;