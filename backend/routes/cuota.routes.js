import { Router } from 'express';
import { ejecutarGeneracionCuotas, obtenerCuotas, obtenerCuotasPendientes, registrarPagoManual, obtenerResumenFinanciero, descargarComprobante, ejecutarMarcadoVencidas, confirmarPagos, obtenerPagosSinConfirmar } from '../controllers/cuota.controllers.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { verificarAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las rutas requieren token administrativo
router.use(verificarToken);
router.use(verificarAdmin)

//generacion y consulta general de cuotas
// Endpoint para disparar la generación manualmente
router.post('/generar-manual', ejecutarGeneracionCuotas);
router.post('/marcar-vencidas', ejecutarMarcadoVencidas);
// Endpoint para consultar las cuotas del sistema
router.get('/', obtenerCuotas);
router.get('/:id/comprobante', descargarComprobante); // redescarga de un comprobante ya emitido


// Gestión financiera y cobranzas
router.get('/pendientes', obtenerCuotasPendientes); //obtener cuotas pendientes
router.get('/resumen-financiero', obtenerResumenFinanciero); //resumen financiero 
router.put('/:id/pagar', registrarPagoManual); //cuando la pasarela nos confirme un pago exitoso llamamos a registrarPagoManual
router.get('/pagos/sin-confirmar', obtenerPagosSinConfirmar); // pagos que Tesorería todavía no verificó
router.put('/pagos/confirmar', confirmarPagos); // body: { "pagoIds": ["uuid1", "uuid2", ...] }


export default router;