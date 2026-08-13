import { Router } from 'express';
import { ejecutarGeneracionCuotas, obtenerCuotas } from '../controllers/cuota.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas requieren token administrativo
router.use(verificarToken);

// Endpoint para disparar la generación manualmente
router.post('/generar-manual', ejecutarGeneracionCuotas);

// Endpoint para consultar las cuotas del sistema
router.get('/', obtenerCuotas);

export default router;