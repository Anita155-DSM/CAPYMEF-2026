import cron from 'node-cron';
import { generarCuotasDelMes, marcarCuotasVencidas } from '../services/cuota.service.js';

// Sin esto node-cron usa la hora del servidor, que en un hosting suele ser UTC
// (las 00:00 UTC son las 21:00 del día anterior en Argentina).
const opciones = { timezone: 'America/Argentina/Buenos_Aires' };

export const iniciarCronJobs = () => {
  // Día 1 a las 00:00 -> se generan las cuotas del mes y abre la ventana de pago (1 al 10)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON JOB] Iniciando generación automática de cuotas mensuales...');
    try {
      await generarCuotasDelMes();
      console.log('[CRON JOB] Generación de cuotas completada con éxito.');
    } catch (error) {
      console.error('[CRON JOB] Error al ejecutar generación automática:', error);
    }
  }, opciones);

  // Todos los días a las 00:05 -> las cuotas impagas cuyo vencimiento ya pasó
  // (a partir del día 11) pasan a "vencida".
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON JOB] Revisando cuotas vencidas...');
    try {
      await marcarCuotasVencidas();
    } catch (error) {
      console.error('[CRON JOB] Error al marcar cuotas vencidas:', error);
    }
  }, opciones);

  console.log('Tareas programadas (Cron Jobs) inicializadas.');
};