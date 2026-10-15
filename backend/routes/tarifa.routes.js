import { Router } from 'express';
import { obtenerTarifas, actualizarTarifa } from '../controllers/tarifa.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';
import { validacionTarifa } from '../middlewares/validator/tarifa.validator.js';

const router = Router();

// Orden importa: primero se decodifica el token, después se chequea el rol.
router.use(verificarToken);
router.use(verificarAdmin);

router.get('/', obtenerTarifas);
router.put('/:categoria', validacionTarifa, actualizarTarifa);

export default router;