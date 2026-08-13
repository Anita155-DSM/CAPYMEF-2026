import { Router } from 'express';
import { registrarGasto, obtenerGastos, eliminarGasto } from '../controllers/gasto.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

// Asumiendo que reutilizas tu middleware de subida, o creas uno para gastos
import { upload } from '../middlewares/multerMiddleware.js'; 

const router = Router();

// Todo el módulo de gastos es estrictamente administrativo, por lo que bloqueamos todo con token
router.use(verificarToken);

// Rutas de Finanzas -> Egresos
router.post('/', upload.single('comprobante'), registrarGasto);
router.get('/', obtenerGastos);
router.delete('/:id', eliminarGasto);

export default router;