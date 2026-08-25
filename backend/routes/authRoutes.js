import { Router } from 'express';
import { loginUsuario, registrarUsuario, obtenerPerfil, actualizarPerfil, solicitarRecuperacion, restablecerPassword } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin, validacionSolicitudRecuperacion, validacionNuevaPassword } from '../middlewares/validator/user.validator.js';
import { verificarToken } from '../middlewares/authMiddleware.js'; // Importamos guardia de seguridad
//import { upload } from '../middlewares/multer/multerMiddleware.js';
import { limitadorLogin, limitadorRecuperacion } from '../middlewares/rateLimiters.js';
import { uploadNube } from '../middlewares/multer/multerCloudinary.js';

const router = Router();

// Rutas Públicas (No requieren token)
router.post('/registro', uploadNube.single('constancia'), validacionRegistro, registrarUsuario);
router.post('/login', limitadorLogin, validacionLogin, loginUsuario);

// Recuperación de contraseña (públicas, sin token porque el usuario está deslogueado)
router.post('/recuperar-password', limitadorRecuperacion, validacionSolicitudRecuperacion, solicitarRecuperacion);
router.put('/restablecer-password/:token', validacionNuevaPassword, restablecerPassword);

// Rutas Protegidas (SÍ requieren token)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;
