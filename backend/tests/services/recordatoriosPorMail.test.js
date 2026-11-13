import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Recordatorios de cuotas por mail: el del día 7 (cuota por vencer) y el aviso de cuota vencida, además de la
// notificación interna. Se manda solo si la notificación se creó en ese momento (no se repite), solo a socios
// aprobados y nunca a cuentas de gestión (admin). Nada sale: el envío es falso; la plantilla (el texto) es la real.
// Solo se simula el reloj (Date); la base es SQLite real.
vi.mock('../../config/mailer.js', async (importOriginal) => ({
  ...(await importOriginal()),
  enviarMailRecordatorioCuota: vi.fn(async () => {}),
  smtpConfigurado: vi.fn(() => true),
}));

const { enviarMailRecordatorioCuota, smtpConfigurado, armarMailRecordatorioCuota, periodoEnPalabras, montoEnPesos } = await import('../../config/mailer.js');
const { Cuota } = await import('../../models/cuota.models.js');
const { Notificacion } = await import('../../models/notificacion.models.js');
const { generarCuotasDelMes, marcarCuotasVencidas, enviarRecordatoriosDeVencimiento, reiniciarAvisosDeMails } = await import('../../services/cuota.service.js');
const { asegurarTarifasIniciales } = await import('../../services/tarifa.service.js');
const { reiniciarBase, cerrarBase, crearUsuario } = await import('../helpers/baseDeDatos.js');

const fijarHoy = (fechaHora) => vi.setSystemTime(new Date(`${fechaHora}-03:00`));

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('FRONTEND_URL', 'https://capymef.ejemplo.test');
  reiniciarAvisosDeMails();
  await reiniciarBase();
  await asegurarTarifasIniciales();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  smtpConfigurado.mockImplementation(() => true);
  enviarMailRecordatorioCuota.mockImplementation(async () => {});
});

afterAll(async () => {
  await cerrarBase();
});

const cuota = (socio, datos = {}) =>
  Cuota.create({ usuario_id: socio.id, mes_anio: '2026-11', monto: 10000, fecha_vencimiento: '2026-11-10', estado: 'pendiente', ...datos });
const avisos = (socio, tipo) => Notificacion.count({ where: { usuario_id: socio.id, tipo } });
const mailsA = (socio) => enviarMailRecordatorioCuota.mock.calls.filter(([email]) => email === socio.email);

// ==========================================
// Día 7: recordatorio de cuota por vencer
// ==========================================
describe('recordatorio del día 7 por mail', () => {
  beforeEach(() => fijarHoy('2026-11-07T09:00:00'));

  it('un socio con la cuota pendiente recibe 1 mail y 1 notificación, con los datos de su cuota', async () => {
    const socio = await crearUsuario({ razonSocial: 'Empresa Socia SA' });
    const pendiente = await cuota(socio);

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado).toMatchObject({ enviados: 1, mailsEnviados: 1 });
    expect(await avisos(socio, 'recordatorio_cuota')).toBe(1);
    expect(mailsA(socio)).toHaveLength(1);
    expect(mailsA(socio)[0][1]).toEqual({ tipo: 'por_vencer', razonSocial: 'Empresa Socia SA', mesAnio: '2026-11', monto: pendiente.monto, fechaVencimiento: '2026-11-10' });
  });

  it('el socio que ya pagó no recibe nada', async () => {
    const socio = await crearUsuario();
    await cuota(socio, { estado: 'pagada' });

    await enviarRecordatoriosDeVencimiento();

    expect(enviarMailRecordatorioCuota).not.toHaveBeenCalled();
  });

  it('correr el recordatorio dos veces sigue siendo 1 mail (la notificación ya existía)', async () => {
    const socio = await crearUsuario();
    await cuota(socio);

    await enviarRecordatoriosDeVencimiento();
    const segunda = await enviarRecordatoriosDeVencimiento();

    expect(segunda.mailsEnviados).toBe(0);
    expect(mailsA(socio)).toHaveLength(1);
  });

  it('un admin con una cuota pendiente no recibe nada (ni mail ni notificación)', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    await cuota(admin);

    await enviarRecordatoriosDeVencimiento();

    expect(enviarMailRecordatorioCuota).not.toHaveBeenCalled();
    expect(await avisos(admin, 'recordatorio_cuota')).toBe(0);
  });

  it.each(['pendiente', 'rechazado', 'inactivo'])('una cuenta %s no recibe mail', async (estado) => {
    const cuenta = await crearUsuario({ estado });
    await cuota(cuenta);

    await enviarRecordatoriosDeVencimiento();

    expect(mailsA(cuenta)).toHaveLength(0);
  });
});

// ==========================================
// Cierre diario: aviso de cuota vencida
// ==========================================
describe('aviso de cuota vencida por mail', () => {
  beforeEach(() => fijarHoy('2026-11-11T00:05:00'));

  it('cuando la cuota vence, el socio recibe 1 mail de cuota vencida', async () => {
    const socio = await crearUsuario({ razonSocial: 'Empresa Morosa SRL' });
    await cuota(socio);

    const resultado = await marcarCuotasVencidas();

    expect(resultado).toMatchObject({ marcadas: 1, mailsEnviados: 1 });
    expect(mailsA(socio)).toHaveLength(1);
    expect(mailsA(socio)[0][1]).toMatchObject({ tipo: 'vencida', razonSocial: 'Empresa Morosa SRL', mesAnio: '2026-11', fechaVencimiento: '2026-11-10' });
  });

  it('correr el cierre diario dos veces sigue siendo 1 mail', async () => {
    const socio = await crearUsuario();
    await cuota(socio);

    await marcarCuotasVencidas();
    await marcarCuotasVencidas();

    expect(mailsA(socio)).toHaveLength(1);
  });

  it('si la notificación de cuota vencida ya existía (otra corrida ya avisó), no se manda el mail de nuevo', async () => {
    const socio = await crearUsuario();
    const impaga = await cuota(socio);
    await Notificacion.create({ usuario_id: socio.id, tipo: 'cuota_vencida', titulo: 't', mensaje: 'm', referencia: `cuota-vencida:${impaga.id}` });

    await marcarCuotasVencidas();

    expect(mailsA(socio)).toHaveLength(0);
  });

  it('un admin con una cuota vieja pendiente no recibe nada', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    await cuota(admin);

    await marcarCuotasVencidas();

    expect(enviarMailRecordatorioCuota).not.toHaveBeenCalled();
  });

  it('una cuenta dada de baja no recibe el mail (la cuota igual se marca vencida, como antes)', async () => {
    const baja = await crearUsuario({ estado: 'inactivo' });
    const impaga = await cuota(baja);

    await marcarCuotasVencidas();

    expect((await impaga.reload()).estado).toBe('vencida');
    expect(mailsA(baja)).toHaveLength(0);
  });
});

// ==========================================
// Fallas y configuración
// ==========================================
describe('si un mail falla o falta configuración', () => {
  beforeEach(() => fijarHoy('2026-11-07T09:00:00'));

  it('si el mailer falla con un socio, los demás reciben igual y el cron no lanza', async () => {
    const falla = await crearUsuario({ email: 'falla@ejemplo.test' });
    const otros = [await crearUsuario(), await crearUsuario()];
    for (const socio of [falla, ...otros]) await cuota(socio);
    enviarMailRecordatorioCuota.mockImplementation(async (email) => {
      if (email === 'falla@ejemplo.test') throw Object.assign(new Error('550 mailbox unavailable: falla@ejemplo.test'), { code: 'EENVELOPE' });
    });

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado.mailsEnviados).toBe(2);
    for (const socio of otros) expect(mailsA(socio)).toHaveLength(1);
    // El log nombra la cuota y el código del error, pero no la dirección completa ni el detalle del servidor.
    const log = console.error.mock.calls.flat().join(' ');
    expect(log).toContain('EENVELOPE');
    expect(log).toContain('fa***@ejemplo.test');
    expect(log).not.toContain('falla@ejemplo.test');
  });

  it('manda de a 5 como mucho al mismo tiempo', async () => {
    for (let i = 0; i < 12; i++) await cuota(await crearUsuario());
    let enCurso = 0;
    let maximo = 0;
    enviarMailRecordatorioCuota.mockImplementation(async () => {
      enCurso++;
      maximo = Math.max(maximo, enCurso);
      await new Promise((resolver) => setTimeout(resolver, 5));
      enCurso--;
    });

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado.mailsEnviados).toBe(12);
    expect(maximo).toBeLessThanOrEqual(5);
  });

  it('sin SMTP configurado no intenta mandar, la notificación se crea igual y avisa en el log una sola vez', async () => {
    smtpConfigurado.mockImplementation(() => false);
    const socio = await crearUsuario();
    await cuota(socio);
    await cuota(socio, { mes_anio: '2026-12', fecha_vencimiento: '2026-12-10' });

    await enviarRecordatoriosDeVencimiento();
    await enviarRecordatoriosDeVencimiento();

    expect(enviarMailRecordatorioCuota).not.toHaveBeenCalled();
    expect(await avisos(socio, 'recordatorio_cuota')).toBe(2);
    const avisosSmtp = console.warn.mock.calls.filter(([texto]) => String(texto).includes('SMTP no está configurado'));
    expect(avisosSmtp).toHaveLength(1);
  });

  it('sin FRONTEND_URL los mails salen igual y avisa en el log una sola vez', async () => {
    vi.stubEnv('FRONTEND_URL', '');
    await cuota(await crearUsuario());
    await cuota(await crearUsuario());

    const resultado = await enviarRecordatoriosDeVencimiento();

    expect(resultado.mailsEnviados).toBe(2);
    expect(console.warn.mock.calls.filter(([texto]) => String(texto).includes('FRONTEND_URL'))).toHaveLength(1);
  });

  it('la cuota nueva del día 1 no va por mail (solo la notificación interna)', async () => {
    fijarHoy('2026-11-01T00:00:00');
    await crearUsuario({ categoria: 'activo' });

    await generarCuotasDelMes();

    expect(enviarMailRecordatorioCuota).not.toHaveBeenCalled();
  });
});

// ==========================================
// Contenido del mail (plantilla real)
// ==========================================
describe('contenido del mail', () => {
  const datos = { razonSocial: 'Empresa Formoseña SRL', mesAnio: '2026-11', monto: '12500.50', fechaVencimiento: '2026-11-10' };

  it('el recordatorio dice el período en palabras, el monto con formato argentino y el vencimiento', () => {
    const mail = armarMailRecordatorioCuota({ ...datos, tipo: 'por_vencer' });

    expect(mail.subject).toBe('Recordatorio: tu cuota de noviembre de 2026 vence el 10 de noviembre de 2026 - CAPYMEF');
    for (const parte of [mail.text, mail.html]) {
      expect(parte).toContain('Empresa Formoseña SRL');
      expect(parte).toContain('noviembre de 2026');
      expect(parte).toContain('$12.500,50');
      expect(parte).toContain('10 de noviembre de 2026');
      expect(parte).toContain('https://capymef.ejemplo.test');
    }
  });

  it('el de cuota vencida dice que venció y sigue impaga', () => {
    const mail = armarMailRecordatorioCuota({ ...datos, tipo: 'vencida' });

    expect(mail.subject).toBe('Tu cuota de noviembre de 2026 está vencida - CAPYMEF');
    expect(mail.text).toContain('venció el 10 de noviembre de 2026 y todavía figura impaga');
    expect(mail.text).toContain('Para regularizarla');
  });

  it('no contiene el CUIT ni links firmados (solo recibe razón social, período, monto y vencimiento)', async () => {
    fijarHoy('2026-11-07T09:00:00');
    const socio = await crearUsuario({ cuit: '30-71234567-8' });
    await cuota(socio);

    await enviarRecordatoriosDeVencimiento();

    const [, datosDelMail] = mailsA(socio)[0];
    expect(Object.keys(datosDelMail).sort()).toEqual(['fechaVencimiento', 'mesAnio', 'monto', 'razonSocial', 'tipo']);
    const mail = armarMailRecordatorioCuota(datosDelMail);
    expect(JSON.stringify(mail)).not.toContain('30-71234567-8');
    expect(JSON.stringify(mail)).not.toContain('71234567');
  });

  it('sin FRONTEND_URL la línea de cómo pagar no inventa una dirección', () => {
    vi.stubEnv('FRONTEND_URL', '');

    const mail = armarMailRecordatorioCuota({ ...datos, tipo: 'por_vencer' });

    expect(mail.text).toContain('ingresá a la plataforma de CAPYMEF con tu usuario');
    expect(mail.text).not.toMatch(/https?:\/\//);
  });

  it('la razón social se escapa en el HTML (no se puede meter código en el mail)', () => {
    const mail = armarMailRecordatorioCuota({ ...datos, tipo: 'vencida', razonSocial: '<script>alert(1)</script> SA' });

    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it.each([['2026-01', 'enero de 2026'], ['2026-12', 'diciembre de 2026']])('periodoEnPalabras(%s) = %s', (mesAnio, esperado) => {
    expect(periodoEnPalabras(mesAnio)).toBe(esperado);
  });

  it.each([[10000, '$10.000,00'], ['12500.5', '$12.500,50'], [0, '$0,00']])('montoEnPesos(%j) = %s', (monto, esperado) => {
    expect(montoEnPesos(monto)).toBe(esperado);
  });
});
