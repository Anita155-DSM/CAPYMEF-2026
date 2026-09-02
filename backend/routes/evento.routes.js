import { Router } from 'express';
import {
  obtenerEventosPublicos,
  obtenerEventosSocios,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  inscribirseEvento,
  cancelarInscripcion,
  obtenerInscriptos,
  marcarAsistencia,
  descargarMiCertificado,
  descargarCertificadoAdmin,
} from '../controllers/evento.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';
import { uploadEvento } from '../middlewares/multer/multerEventos.js';
import { validacionEvento } from '../middlewares/validator/evento.validator.js';

const router = Router();

// ==========================================
// Rutas Públicas (Landing)
// ==========================================
router.get('/publicos', obtenerEventosPublicos);

// ==========================================
// Rutas para Socios Logueados
// IMPORTANTE: '/socios' va ANTES que '/:id' (más abajo). Express matchea por orden,
// y '/:id' captura cualquier segmento — ya nos pasó este bug una vez con noticias.
// ==========================================
router.get('/socios', verificarToken, obtenerEventosSocios);
router.post('/:id/inscribirse', verificarToken, inscribirseEvento);
router.delete('/:id/inscribirse', verificarToken, cancelarInscripcion);
router.get('/:id/certificado', verificarToken, descargarMiCertificado);

// ==========================================
// Rutas Administrativas
// ==========================================
router.post('/admin', verificarToken, verificarAdmin, uploadEvento.single('imagen'), validacionEvento, crearEvento);
router.put('/admin/:id', verificarToken, verificarAdmin, uploadEvento.single('imagen'), validacionEvento, actualizarEvento);
router.delete('/admin/:id', verificarToken, verificarAdmin, eliminarEvento);
router.get('/admin/:id/inscriptos', verificarToken, verificarAdmin, obtenerInscriptos);
router.put('/admin/:eventoId/inscriptos/:inscripcionId/asistencia', verificarToken, verificarAdmin, marcarAsistencia);
router.get('/admin/:eventoId/inscriptos/:inscripcionId/certificado', verificarToken, verificarAdmin, descargarCertificadoAdmin);

// ==========================================
// Ruta con parámetro dinámico: SIEMPRE al final, para no "tapar" las rutas literales de arriba
// ==========================================
router.get('/:id', obtenerEventoPorId);

export default router;
