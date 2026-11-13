import { Router } from 'express';
import { obtenerSolicitudesPendientes, gestionarSolicitud, obtenerAuditorias, actualizarSocio } from '../controllers/admin.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { darDeBajaSocio, obtenerTodosLosUsuarios, obtenerConstanciaDeSocio } from '../controllers/admin.controllers.js';
import { obtenerDistribucionPorLocalidad, obtenerDistribucionPorRubro } from '../controllers/admin.controllers.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';
import { validacionActualizarSocio } from '../middlewares/validator/user.validator.js';
import { obtenerResumenInicio } from '../controllers/admin.controllers.js';
import { obtenerPadron, exportarPadron } from '../controllers/padron.controllers.js';
import { obtenerTarifas, actualizarTarifa } from '../controllers/tarifa.controllers.js';
import { validacionTarifa } from '../middlewares/validator/tarifa.validator.js';
import { paramEntero } from '../middlewares/validarParametros.js';

const router = Router();

// El :id es el id numérico de un usuario: el formato se valida antes de consultar la base y se responde 400
// (sin esto, un id inválido terminaba en un 500).
router.param('id', paramEntero);

// Todas las rutas de este archivo exigirán que el usuario esté logueado
router.use(verificarToken); 
router.use(verificarAdmin);

// Rutas para la gestión de nuevos socios
router.get('/solicitudes', obtenerSolicitudesPendientes);
router.put('/solicitudes/:id', gestionarSolicitud);
router.put('/socios/:id/baja', darDeBajaSocio);
router.put('/socios/:id', validacionActualizarSocio, actualizarSocio);
router.get('/socios/:id/constancia', obtenerConstanciaDeSocio); // URL temporal de la constancia (privada)
router.get("/usuarios", obtenerTodosLosUsuarios);

// Endpoint de Reporte (Geolocalización / Rubros)
router.get("/reportes/distribucion-rubros", obtenerDistribucionPorRubro);
router.get("/reportes/distribucion-localidad", obtenerDistribucionPorLocalidad);

// enpoint de registros de logs (de acciones de quien hizo que, solo puede acceder el administrador)
router.get('/auditorias', obtenerAuditorias)

// Cifras reales para las tarjetas del inicio del panel (antes eran inventadas en el frontend)
router.get('/resumen-inicio', obtenerResumenInicio);

// Padrón de socios habilitados para votar en Asamblea (?fecha=YYYY-MM-DD opcional, por defecto hoy)
router.get('/padron', obtenerPadron);
router.get('/padron/exportar', exportarPadron);

// Tarifas (monto de la cuota mensual). Reutiliza el controlador de /api/tarifas: solo se puede cambiar la
// de los Activos, y rige para las cuotas que se generen de ahí en adelante.
router.get('/tarifas', obtenerTarifas);
router.put('/tarifas/:categoria', validacionTarifa, actualizarTarifa);


export default router;