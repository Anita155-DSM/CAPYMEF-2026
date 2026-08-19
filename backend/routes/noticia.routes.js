import { Router } from 'express';
import {
  obtenerNoticiasLanding,
  obtenerNoticiasSocios,
  obtenerNoticiaPorId,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia
} from '../controllers/noticia.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { uploadNoticia } from '../middlewares/multerNoticias.js';
import { validacionNoticia } from '../middlewares/validator/noticia.validator.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// ==========================================
// Rutas Públicas (Landing)
// ==========================================
router.get('/publicas', obtenerNoticiasLanding);
router.get('/:id', obtenerNoticiaPorId);

// ==========================================
// Rutas Protegidas para Socios Logueados
// ==========================================
router.get('/socios', verificarToken, obtenerNoticiasSocios);

// ==========================================
// Rutas Administrativas (Gestión de Noticias)
// ==========================================
router.post('/admin', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, crearNoticia);
router.put('/admin/:id', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, actualizarNoticia);
router.delete('/admin/:id', verificarToken, verificarAdmin, eliminarNoticia);

export default router;