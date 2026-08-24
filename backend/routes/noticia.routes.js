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
import { uploadNoticia } from '../middlewares/multer/multerNoticias.js';
import { validacionNoticia } from '../middlewares/validator/noticia.validator.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// ==========================================
// Rutas Públicas (Landing)
// ==========================================
router.get('/publicas', obtenerNoticiasLanding);

// ==========================================
// Rutas Protegidas para Socios Logueados
// ==========================================
// IMPORTANTE: esta ruta literal debe ir ANTES que '/:id'. Express matchea en orden,
// y '/:id' captura cualquier segmento (incluido "socios"), por lo que este endpoint
// nunca se ejecutaba y ni siquiera pasaba por verificarToken.
router.get('/socios', verificarToken, obtenerNoticiasSocios);

// Esta ruta con parámetro dinámico va al final para no "tapar" rutas literales
router.get('/:id', obtenerNoticiaPorId);

// ==========================================
// Rutas Administrativas (Gestión de Noticias)
// ==========================================
router.post('/admin', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, crearNoticia);
router.put('/admin/:id', verificarToken, verificarAdmin, uploadNoticia.single('imagen'), validacionNoticia, actualizarNoticia);
router.delete('/admin/:id', verificarToken, verificarAdmin, eliminarNoticia);

export default router;