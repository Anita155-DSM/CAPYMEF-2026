import { Router } from 'express';
import { loginUsuario, registrarUsuario } from '../controllers/user.controllers.js';
import { validacionRegistro, validacionLogin } from '../middlewares/user.validator.js';
import { upload } from '../middlewares/multerMiddleware.js'; // Tu middleware de Multer

const router = Router();

// 1. Ruta de Registro (Multer procesa el archivo, luego se valida el texto, esto para evitr archivos huerfanos)
router.post('/registro', upload.single('constancia'), validacionRegistro, registrarUsuario);

// 2. Ruta de Login
router.post('/login', validacionLogin, loginUsuario);

export default router;