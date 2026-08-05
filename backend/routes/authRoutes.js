import { Router } from 'express';
// Importamos los controladores desde tu archivo user.controllers.js
import { loginUsuario, registrarUsuario } from '../controllers/user.controllers.js';

const router = Router();

// Rutas públicas (El prefijo /api/auth se agregará en app.js)
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

// La ruta de gastos la dejamos comentada 
// import { crearGasto } from '../controllers/gastosController.js';
// import { verificarToken } from '../middlewares/authMiddleware.js';
// router.post('/gastos', verificarToken, crearGasto);

export default router;