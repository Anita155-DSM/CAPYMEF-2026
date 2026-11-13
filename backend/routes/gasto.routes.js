import { Router } from 'express';
import { registrarGasto, obtenerGastos, eliminarGasto, obtenerComprobanteGasto } from '../controllers/gasto.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';
import { uploadGasto } from '../middlewares/multer/multerCloudinary.js'; // Sube el comprobante a Cloudinary como archivo privado
import { paramUuid } from '../middlewares/validarParametros.js';

const router = Router();

// El :id es el UUID de un gasto: el formato se valida antes de consultar la base y se responde 400
// (sin esto, un id inválido terminaba en un 500).
router.param('id', paramUuid);

// Todo el módulo de gastos es estrictamente administrativo, por lo que bloqueamos todo con token
router.use(verificarToken);
router.use(verificarAdmin);

// Rutas de Finanzas -> Egresos
router.post('/', uploadGasto.single('comprobante'), registrarGasto);
router.get('/', obtenerGastos);
router.get('/:id/comprobante', obtenerComprobanteGasto); // URL temporal del comprobante (privado)
router.delete('/:id', eliminarGasto);

export default router;