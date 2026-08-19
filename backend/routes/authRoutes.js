import { Router } from 'express';
import { loginUsuario, registrarUsuario, obtenerPerfil, actualizarPerfil } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin } from '../middlewares/validator/user.validator.js';
import { verificarToken } from '../middlewares/authMiddleware.js'; // Importamos guardia de seguridad
import { upload } from '../middlewares/multerMiddleware.js';
import { limitadorLogin } from '../middlewares/rateLimiters.js';

const router = Router();

// Rutas Públicas (No requieren token)
router.post('/registro', upload.single('constancia'), validacionRegistro, registrarUsuario);
router.post('/login', limitadorLogin, validacionLogin, loginUsuario);

// Rutas Protegidas (SÍ requieren token)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);

export default router;