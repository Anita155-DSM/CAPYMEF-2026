import { Router } from 'express';
import { loginUsuario, registrarUsuario, obtenerPerfil, actualizarPerfil } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin } from '../middlewares/validator/user.validator.js';
import { verificarToken } from '../middlewares/authMiddleware.js'; // Importamos guardia de seguridad
import { uploadNube } from '../middlewares/multer/multerCloudinary.js'; // Antes apuntaba a multerMiddleware.js (deprecado, disco local); ahora sube la constancia directo a Cloudinary
import { limitadorLogin } from '../middlewares/rateLimiters.js';

const router = Router();

// Rutas Públicas (No requieren token)
router.post('/registro', uploadNube.single('constancia'), validacionRegistro, registrarUsuario);
router.post('/login', limitadorLogin, validacionLogin, loginUsuario);

// Rutas Protegidas (SÍ requieren token)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;