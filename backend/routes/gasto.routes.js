import { Router } from 'express';
import { registrarGasto, obtenerGastos, eliminarGasto, obtenerComprobanteGasto } from '../controllers/gasto.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';
import { uploadGasto } from '../middlewares/multer/multerCloudinary.js'; // Sube el comprobante a Cloudinary como archivo privado
import { paramUuid } from '../middlewares/validarParametros.js';
import { validacionGasto } from '../middlewares/validator/gasto.validator.js';

const router = Router();

// El :id es el UUID de un gasto: el formato se valida antes de consultar la base y se responde 400
// (sin esto, un id inválido terminaba en un 500).
router.param('id', paramUuid);

// Todo el módulo de gastos es estrictamente administrativo, por lo que bloqueamos todo con token
router.use(verificarToken);
router.use(verificarAdmin);

// Rutas de Finanzas -> Egresos
// El validador va después de multer (necesita los campos del formulario); si rechaza, borra el comprobante subido.
router.post('/', uploadGasto.single('comprobante'), validacionGasto, registrarGasto);
router.get('/', obtenerGastos);
router.get('/:id/comprobante', obtenerComprobanteGasto); // URL temporal del comprobante (privado)
router.delete('/:id', eliminarGasto);

export default router;