import { Router } from 'express';
import { iniciarPagoOnline, recibirWebhook, obtenerMisCuotas, descargarMiComprobante } from '../controllers/pago.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// El socio logueado consulta SUS cuotas (solo lectura, filtrado por el id del token)
router.get('/mis-cuotas', verificarToken, obtenerMisCuotas);
router.get('/mis-cuotas/:id/comprobante', verificarToken, descargarMiComprobante);

// El socio logueado inicia el pago de SU cuota
router.post('/:id/iniciar', verificarToken, iniciarPagoOnline);

// Mercado Pago llama a esta ruta SIN token — es el propio servidor de MP quien la invoca
router.post('/webhook', recibirWebhook);

export default router;