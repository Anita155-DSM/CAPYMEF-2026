import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// node-cron se reemplaza por un falso que solo anota qué se programó: así se puede revisar cada tarea
// (cuándo corre, en qué zona horaria, qué hace) y ejecutarla a mano, sin esperar al día 1 ni tocar la base.
const { schedule, generarCuotasDelMes, marcarCuotasVencidas, enviarRecordatoriosDeVencimiento } = vi.hoisted(() => ({
  schedule: vi.fn(),
  generarCuotasDelMes: vi.fn(),
  marcarCuotasVencidas: vi.fn(),
  enviarRecordatoriosDeVencimiento: vi.fn(),
}));
vi.mock('node-cron', () => ({ default: { schedule } }));
vi.mock('../../services/cuota.service.js', () => ({ generarCuotasDelMes, marcarCuotasVencidas, enviarRecordatoriosDeVencimiento }));

const { iniciarCronJobs } = await import('../../config/cron.js');

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  iniciarCronJobs();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// Devuelve la tarea programada con esa expresión cron: [expresión, función, opciones].
const tarea = (expresion) => schedule.mock.calls.find(([e]) => e === expresion);

describe('iniciarCronJobs: qué se programa', () => {
  it('programa exactamente tres tareas', () => {
    expect(schedule).toHaveBeenCalledTimes(3);
  });

  it('día 1 a las 00:00: generar las cuotas del mes', () => {
    expect(tarea('0 0 1 * *')).toBeDefined();
  });

  it('día 7 a las 09:00: recordatorios de vencimiento', () => {
    expect(tarea('0 9 7 * *')).toBeDefined();
  });

  it('todos los días a las 00:05: marcar cuotas vencidas', () => {
    expect(tarea('5 0 * * *')).toBeDefined();
  });

  it('todas usan la hora de Argentina (no la del servidor, que suele estar en UTC)', () => {
    for (const [, , opciones] of schedule.mock.calls) {
      expect(opciones).toEqual({ timezone: 'America/Argentina/Buenos_Aires' });
    }
  });
});

describe('iniciarCronJobs: qué hace cada tarea al ejecutarse', () => {
  it.each([
    ['0 0 1 * *', generarCuotasDelMes],
    ['0 9 7 * *', enviarRecordatoriosDeVencimiento],
    ['5 0 * * *', marcarCuotasVencidas],
  ])('la tarea "%s" llama a su servicio', async (expresion, servicio) => {
    servicio.mockResolvedValue({});

    await tarea(expresion)[1]();

    expect(servicio).toHaveBeenCalledOnce();
  });

  it.each([
    ['0 0 1 * *', generarCuotasDelMes, '[CRON JOB] Error al ejecutar generación automática:'],
    ['0 9 7 * *', enviarRecordatoriosDeVencimiento, '[CRON JOB] Error al enviar recordatorios de vencimiento:'],
    ['5 0 * * *', marcarCuotasVencidas, '[CRON JOB] Error al marcar cuotas vencidas:'],
  ])('si la tarea "%s" falla, el error queda en el log y no tira abajo el servidor', async (expresion, servicio, mensaje) => {
    const error = new Error('base caída');
    servicio.mockRejectedValue(error);

    await expect(tarea(expresion)[1]()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(mensaje, error);
  });
});
