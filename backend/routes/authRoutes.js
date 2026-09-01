import { Router } from 'express';
import { loginUsuario, registrarUsuario, obtenerPerfil, actualizarPerfil, recuperarPassword, restablecerPassword } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin } from '../middlewares/validator/user.validator.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { uploadNube } from '../middlewares/multer/multerCloudinary.js';
import { limitadorLogin, limitadorRecuperacion } from '../middlewares/rateLimiters.js';

const router = Router();

// Rutas Públicas (No requieren token)
router.post('/registro', uploadNube.single('constancia'), validacionRegistro, registrarUsuario);
router.post('/login', limitadorLogin, validacionLogin, loginUsuario);
router.post('/recuperar-password', limitadorRecuperacion, recuperarPassword);
router.put('/restablecer-password/:token', restablecerPassword);

// Rutas Protegidas (SÍ requieren token)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;