import { Router } from 'express';
import { loginUsuario, registrarUsuario, obtenerPerfil, actualizarPerfil, recuperarPassword, restablecerPassword, obtenerMiConstancia } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin, validacionActualizarPerfil } from '../middlewares/validator/user.validator.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { uploadConstancia } from '../middlewares/multer/multerCloudinary.js';
import { limitadorLoginPorIp, limitadorLoginPorCuenta, limitadorRecuperacion, limitadorRestablecer } from '../middlewares/rateLimiters.js';

const router = Router();

// Rutas Públicas (No requieren token)
// La constancia de AFIP/DGR se sube como archivo privado (ver multerCloudinary.js).
router.post('/registro', uploadConstancia.single('constancia'), validacionRegistro, registrarUsuario);
router.post('/login', limitadorLoginPorIp, limitadorLoginPorCuenta, validacionLogin, loginUsuario);
router.post('/recuperar-password', limitadorRecuperacion, recuperarPassword);
router.put('/restablecer-password/:token', limitadorRestablecer, restablecerPassword);

// Rutas Protegidas (SÍ requieren token)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, validacionActualizarPerfil, actualizarPerfil);
// URL temporal de la constancia del socio del token (solo la propia: el id sale del token).
router.get('/perfil/constancia', verificarToken, obtenerMiConstancia);

export default router;