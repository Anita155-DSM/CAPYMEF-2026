import { Router } from 'express';
import { iniciarPagoOnline, recibirWebhook, obtenerMisCuotas, descargarMiComprobante, redirigirRetornoPago } from '../controllers/pago.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { paramUuid } from '../middlewares/validarParametros.js';
import { verificarOrigenWebhook } from '../middlewares/firmaMercadoPago.js';

const router = Router();

// El :id de estas rutas es siempre el UUID de una cuota: si no tiene ese formato se responde 400
// sin consultar la base (antes terminaba en un 500).
router.param('id', paramUuid);

// El socio logueado consulta SUS cuotas (solo lectura, filtrado por el id del token)
router.get('/mis-cuotas', verificarToken, obtenerMisCuotas);
router.get('/mis-cuotas/:id/comprobante', verificarToken, descargarMiComprobante);

// El socio logueado inicia el pago de SU cuota
router.post('/:id/iniciar', verificarToken, iniciarPagoOnline);

// Mercado Pago llama a esta ruta SIN token — es el propio servidor de MP quien la invoca.
// Como no hay token, se verifica la firma del aviso para que nadie pueda mandar uno falso
// (según MP_WEBHOOK_MODE: off / log / enforce).
router.post('/webhook', verificarOrigenWebhook, recibirWebhook);

// Vuelta del socio desde Mercado Pago (puente para desarrollo local, ver redirigirRetornoPago).
// Pública: la abre el navegador del socio al terminar de pagar, y solo redirige al frontend.
router.get('/retorno/:resultado', redirigirRetornoPago);

export default router;