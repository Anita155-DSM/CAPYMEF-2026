import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cuota } from '../../models/cuota.models.js';
import { Notificacion } from '../../models/notificacion.models.js';
import { Tarifa } from '../../models/tarifa.models.js';
import {
  fechaHoyArgentina,
  generarCuotasDelMes,
  marcarCuotasVencidas,
  enviarRecordatoriosDeVencimiento,
} from '../../services/cuota.service.js';
import { asegurarTarifasIniciales } from '../../services/tarifa.service.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Estas funciones las corre el cron (día 1, día 7 y todos los días a las 00:05). Dependen de la fecha
// de hoy en Argentina, así que solo se simula el reloj (Date): la base y todo lo demás son reales.
const fijarHoy = (fechaHoraArgentina) => vi.setSystemTime(new Date(`${fechaHoraArgentina}-03:00`));

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  await reiniciarBase();
  await asegurarTarifasIniciales(); // activo $10.000; adherente, padrino y honorario $0
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const notificaciones = (tipo) => Notificacion.findAll({ where: { tipo }, order: [['createdAt', 'ASC']] });
const cuota = (socio, datos) =>
  Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente', ...datos });

describe('fechaHoyArgentina', () => {
  it('devuelve la fecha en formato AAAA-MM-DD', () => {
    fijarHoy('2026-11-06T12:00:00');

    expect(fechaHoyArgentina()).toBe('2026-11-06');
  });

  it('usa la hora de Argentina y no la del servidor: a las 23:30 del 31/10 en Formosa ya es 1/11 en UTC', () => {
    fijarHoy('2026-10-31T23:30:00');

    expect(fechaHoyArgentina()).toBe('2026-10-31');
  });
});

describe('generarCuotasDelMes', () => {
  beforeEach(() => fijarHoy('2026-11-01T00:00:00'));

  it('crea la cuota del mes a cada socio Activo aprobado, con el monto de la tarifa y vencimiento el día 10', async () => {
    const socio = await crearUsuario({ categoria: 'activo' });

    const resultado = await generarCuotasDelMes();

    expect(resultado).toMatchObject({ exito: true, creadas: 1, periodo: '2026-11', sociosExentos: 0, categoriasSinTarifa: [] });
    const [creada] = await Cuota.findAll({ where: { usuario_id: socio.id } });
    expect(creada.mes_anio).toBe('2026-11');
    expect(Number(creada.monto)).toBe(10000);
    expect(creada.fecha_vencimiento).toBe('2026-11-10');
    expect(creada.estado).toBe('pendiente');
  });

  it.each(['pendiente', 'rechazado', 'inactivo'])('no le genera cuota a una cuenta en estado %s', async (estado) => {
    await crearUsuario({ categoria: 'activo', estado });

    expect((await generarCuotasDelMes()).creadas).toBe(0);
    expect(await Cuota.count()).toBe(0);
  });

  it('las categorías con tarifa $0 (adherente, padrino, honorario) quedan exentas y se cuentan', async () => {
    await crearUsuario({ categoria: 'adherente' });
    await crearUsuario({ categoria: 'padrino' });
    await crearUsuario({ categoria: 'honorario' });

    const resultado = await generarCuotasDelMes();

    expect(resultado.creadas).toBe(0);
    expect(resultado.sociosExentos).toBe(3);
  });

  it('si una categoría no tiene tarifa cargada no inventa un monto: la informa y no genera cuota', async () => {
    await Tarifa.destroy({ where: { categoria: 'activo' } });
    await crearUsuario({ categoria: 'activo' });

    const resultado = await generarCuotasDelMes();

    expect(resultado.creadas).toBe(0);
    expect(resultado.categoriasSinTarifa).toEqual(['activo']);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('activo'));
  });

  it('avisa al socio con una notificación interna que dice el monto y hasta cuándo pagar', async () => {
    const socio = await crearUsuario({ categoria: 'activo' });

    await generarCuotasDelMes();

    const [aviso] = await notificaciones('cuota_nueva');
    expect(aviso.usuario_id).toBe(socio.id);
    expect(aviso.titulo).toBe('Ya está disponible tu cuota de 11/2026');
    expect(aviso.mensaje).toBe('Tu cuota es de $10.000 y podés pagarla hasta el 10/11/2026.');
  });

  it('correrla dos veces en el mismo mes no duplica cuotas ni avisos', async () => {
    await crearUsuario({ categoria: 'activo' });

    await generarCuotasDelMes();
    const segunda = await generarCuotasDelMes();

    expect(segunda.creadas).toBe(0);
    expect(await Cuota.count()).toBe(1);
    expect(await Notificacion.count({ where: { tipo: 'cuota_nueva' } })).toBe(1);
  });

  it('el periodo sale de la fecha argentina: el 30/11 a las 23:30 todavía genera noviembre', async () => {
    fijarHoy('2026-11-30T23:30:00');
    await crearUsuario({ categoria: 'activo' });

    expect((await generarCuotasDelMes()).periodo).toBe('2026-11');
  });

  it('cada cuota guarda el monto vigente al generarse (un cambio de tarifa posterior no la modifica)', async () => {
    const socio = await crearUsuario({ categoria: 'activo' });
    await generarCuotasDelMes();

    await Tarifa.update({ monto: 20000 }, { where: { categoria: 'activo' } });

    expect(Number((await Cuota.findOne({ where: { usuario_id: socio.id } })).monto)).toBe(10000);
  });
});

describe('marcarCuotasVencidas (cierre de la ventana de pago)', () => {
  it('a partir del día 11, las cuotas pendientes del mes pasan a vencidas', async () => {
    fijarHoy('2026-11-11T00:05:00');
    const socio = await crearUsuario();
    const impaga = await cuota(socio);

    const resultado = await marcarCuotasVencidas();

    expect(resultado).toMatchObject({ exito: true, marcadas: 1, fechaCorte: '2026-11-11' });
    expect((await impaga.reload()).estado).toBe('vencida');
  });

  it('el día 10 (último día de la ventana) la cuota sigue pendiente', async () => {
    fijarHoy('2026-11-10T23:00:00');
    const socio = await crearUsuario();
    const delMes = await cuota(socio);

    expect((await marcarCuotasVencidas()).marcadas).toBe(0);
    expect((await delMes.reload()).estado).toBe('pendiente');
  });

  it('nunca toca una cuota que ya está pagada', async () => {
    fijarHoy('2026-11-20T00:05:00');
    const socio = await crearUsuario();
    const pagada = await cuota(socio, { estado: 'pagada' });

    await marcarCuotasVencidas();

    expect((await pagada.reload()).estado).toBe('pagada');
  });

  it('avisa a cada socio por cada cuota que se le venció', async () => {
    fijarHoy('2026-11-11T00:05:00');
    const socio = await crearUsuario();
    await cuota(socio);

    await marcarCuotasVencidas();

    const [aviso] = await notificaciones('cuota_vencida');
    expect(aviso.usuario_id).toBe(socio.id);
    expect(aviso.titulo).toBe('Tu cuota de 11/2026 está vencida');
    expect(aviso.mensaje).toContain('Tenés pendiente $10.000');
  });

  it('avisa una sola vez a cada admin con el resumen del día', async () => {
    fijarHoy('2026-11-11T00:05:00');
    const admin = await crearUsuario({ rol: 'admin' });
    const socio = await crearUsuario();
    await cuota(socio);
    await cuota(socio, { mes_anio: '2026-10', fecha_vencimiento: '2026-10-10', estado: 'vencida' });

    await marcarCuotasVencidas();

    const resumenes = await notificaciones('resumen_vencidas');
    expect(resumenes).toHaveLength(1);
    expect(resumenes[0].usuario_id).toBe(admin.id);
    expect(resumenes[0].mensaje).toBe('Hoy vencieron 1 cuota(s). En total hay 2 cuota(s) vencida(s) sin pagar.');
  });

  it('un día sin cuotas nuevas vencidas no manda el resumen a los admins (para no generar ruido)', async () => {
    fijarHoy('2026-11-15T00:05:00');
    await crearUsuario({ rol: 'admin' });
    const socio = await crearUsuario();
    await cuota(socio, { estado: 'vencida' });

    await marcarCuotasVencidas();

    expect(await notificaciones('resumen_vencidas')).toHaveLength(0);
  });

  it('correrlo dos veces el mismo día no cambia nada ni repite avisos', async () => {
    fijarHoy('2026-11-11T00:05:00');
    await crearUsuario({ rol: 'admin' });
    const socio = await crearUsuario();
    await cuota(socio);

    await marcarCuotasVencidas();
    const segunda = await marcarCuotasVencidas();

    expect(segunda.marcadas).toBe(0);
    expect(await Notificacion.count()).toBe(2); // un aviso al socio y un resumen al admin
  });

  it('después del cierre aplica la regla de mora: un Activo con 3 vencidas pasa a Adherente', async () => {
    fijarHoy('2026-11-11T00:05:00');
    const socio = await crearUsuario({ categoria: 'activo' });
    await cuota(socio, { mes_anio: '2026-09', fecha_vencimiento: '2026-09-10', estado: 'vencida' });
    await cuota(socio, { mes_anio: '2026-10', fecha_vencimiento: '2026-10-10', estado: 'vencida' });
    await cuota(socio);

    const resultado = await marcarCuotasVencidas();

    expect(resultado.categorias).toEqual({ degradados: 1, recuperados: 0 });
    expect((await socio.reload()).categoria).toBe('adherente');
  });
});

describe('enviarRecordatoriosDeVencimiento (día 7)', () => {
  it('recuerda a quien todavía no pagó, diciendo cuántos días faltan', async () => {
    fijarHoy('2026-11-07T09:00:00');
    const socio = await crearUsuario();
    await cuota(socio);

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado).toEqual({ exito: true, enviados: 1, fechaCorte: '2026-11-07' });
    const [aviso] = await notificaciones('recordatorio_cuota');
    expect(aviso.titulo).toBe('Tu cuota de 11/2026 vence en 3 días');
    expect(aviso.mensaje).toBe('Recordá abonar $10.000 hasta el 10/11/2026 para estar al día.');
  });

  it.each([
    ['2026-11-09T09:00:00', 'vence mañana'],
    ['2026-11-10T09:00:00', 'vence hoy'],
  ])('el %s el título dice "%s"', async (hoy, texto) => {
    fijarHoy(hoy);
    const socio = await crearUsuario();
    await cuota(socio);

    await enviarRecordatoriosDeVencimiento();

    expect((await notificaciones('recordatorio_cuota'))[0].titulo).toBe(`Tu cuota de 11/2026 ${texto}`);
  });

  it('no le recuerda nada a quien ya pagó ni por una cuota ya vencida', async () => {
    fijarHoy('2026-11-07T09:00:00');
    const socio = await crearUsuario();
    await cuota(socio, { estado: 'pagada' });
    await cuota(socio, { mes_anio: '2026-10', fecha_vencimiento: '2026-10-10' });

    expect((await enviarRecordatoriosDeVencimiento()).enviados).toBe(0);
  });

  it('correrlo de nuevo no repite el recordatorio de la misma cuota', async () => {
    fijarHoy('2026-11-07T09:00:00');
    const socio = await crearUsuario();
    await cuota(socio);

    await enviarRecordatoriosDeVencimiento();
    const segunda = await enviarRecordatoriosDeVencimiento();

    expect(segunda.enviados).toBe(0);
    expect(await Notificacion.count({ where: { tipo: 'recordatorio_cuota' } })).toBe(1);
  });
});
