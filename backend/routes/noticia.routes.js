import { Router } from 'express';
import {
  obtenerNoticiasLanding,
  obtenerNoticiasSocios,
  obtenerNoticiaPorId,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
  obtenerTodasLasNoticiasAdmin
} from '../controllers/noticia.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
//import { uploadNoticia } from '../middlewares/multerNoticias.js';
import { uploadNoticia } from '../middlewares/multer/multerNoticias.js';
import { validacionNoticia } from '../middlewares/validator/noticia.validator.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// ==========================================
// 1. Rutas Públicas y de Socios
// ==========================================
router.get('/publicas', obtenerNoticiasLanding);
router.get('/socios', verificarToken, obtenerNoticiasSocios);

// ==========================================
// 2. Rutas Administrativas (Siempre arriba de los :id)
// ==========================================
router.get('/admin', verificarToken, verificarAdmin, obtenerTodasLasNoticiasAdmin);
router.post('/admin', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, crearNoticia);
router.put('/admin/:id', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, actualizarNoticia);
router.delete('/admin/:id', verificarToken, verificarAdmin, eliminarNoticia);

// ==========================================
// 3. Rutas Dinámicas (Siempre al final)
// ==========================================
router.get('/:id', obtenerNoticiaPorId);

export default router;