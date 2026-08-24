import { Router } from 'express';
import { registrarGasto, obtenerGastos, eliminarGasto } from '../controllers/gasto.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

//middleware configurado para guardar en la nube (cloudinary)
import { uploadNube } from '../middlewares/multer/multerCloudinary.js';

// Asumiendo que reutilizas tu middleware de subida, o creas uno para gastos
//import { upload } from '../middlewares/multer/multerMiddleware.js'; 

const router = Router();

// Todo el módulo de gastos es estrictamente administrativo, por lo que bloqueamos todo con token
router.use(verificarToken);
router.use(verificarAdmin);

// Rutas de Finanzas -> Egresos
//router.post('/', upload.single('comprobante'), registrarGasto); antes teniamos local
router.post('/', uploadNube.single('comprobante'), registrarGasto);
router.get('/', obtenerGastos);
router.delete('/:id', eliminarGasto);

export default router;