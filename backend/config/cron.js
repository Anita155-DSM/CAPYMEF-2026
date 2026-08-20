import cron from 'node-cron';
import { generarCuotasDelMes } from '../services/cuota.service.js';

export const iniciarCronJobs = () => {
  // Sintaxis cron: '0 0 1 * *' -> Minuto 0, Hora 0, Día 1 de cada mes
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON JOB] Iniciando generación automática de cuotas mensuales...');
    try {
      await generarCuotasDelMes();
      console.log('[CRON JOB] Generación de cuotas completada con éxito.');
    } catch (error) {
      console.error('[CRON JOB] Error al ejecutar generación automática:', error);
    }
  });

  console.log('Tareas programadas (Cron Jobs) inicializadas.');
};