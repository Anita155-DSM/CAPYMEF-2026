import { Router } from 'express';
import { obtenerSolicitudesPendientes, gestionarSolicitud, obtenerAuditorias } from '../controllers/admin.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { darDeBajaSocio, obtenerTodosLosUsuarios } from '../controllers/admin.controllers.js';
import { obtenerDistribucionPorLocalidad, obtenerDistribucionPorRubro } from '../controllers/admin.controllers.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las rutas de este archivo exigirán que el usuario esté logueado
router.use(verificarToken); 
router.use(verificarAdmin);

// Rutas para la gestión de nuevos socios
router.get('/solicitudes', obtenerSolicitudesPendientes);
router.put('/solicitudes/:id', gestionarSolicitud);
router.put('/socios/:id/baja', darDeBajaSocio);
router.get("/usuarios", obtenerTodosLosUsuarios);

// Endpoint de Reporte (Geolocalización / Rubros)
router.get("/reportes/distribucion-rubros", obtenerDistribucionPorRubro);
router.get("/reportes/distribucion-localidad", obtenerDistribucionPorLocalidad);

// enpoint de registros de logs (de acciones de quien hizo que, solo puede acceder el administrador)
router.get('/auditorias', obtenerAuditorias)


export default router;