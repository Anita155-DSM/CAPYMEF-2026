import { Router } from 'express';
import { iniciarPagoOnline, recibirWebhook } from '../controllers/pago.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// El socio logueado inicia el pago de SU cuota
router.post('/:id/iniciar', verificarToken, iniciarPagoOnline);

// Mercado Pago llama a esta ruta SIN token — es el propio servidor de MP quien la invoca
router.post('/webhook', recibirWebhook);

export default router;