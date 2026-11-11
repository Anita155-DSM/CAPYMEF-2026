import '../helpers/entorno.js';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cuota } from '../../models/cuota.models.js';
import { Notificacion } from '../../models/notificacion.models.js';
import { generarCuotasDelMes } from '../../services/cuota.service.js';
import { crearNotificacion } from '../../services/notificacion.service.js';
import { asegurarTarifasIniciales } from '../../services/tarifa.service.js';
import { reiniciarBase, cerrarBase, crearUsuario } from '../helpers/baseDeDatos.js';

// Una sola cuota por socio y por mes: índice único (usuario_id, mes_anio) en la tabla y, en el generador, el
// choque con ese índice se toma como "la cuota ya existía" (pasa si dos generaciones corren al mismo tiempo).
// Solo se simula el reloj (Date); la base es SQLite real.
const MES = '2026-11';

let socios;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T00:00:00-03:00'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await reiniciarBase();
  await asegurarTarifasIniciales();
  socios = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await cerrarBase();
});

const cuotasDe = (socio) => Cuota.count({ where: { usuario_id: socio.id, mes_anio: MES } });
const avisosDe = (socio) => Notificacion.count({ where: { usuario_id: socio.id, tipo: 'cuota_nueva' } });
const datosCuota = (socio) => ({ usuario_id: socio.id, mes_anio: MES, monto: 10000, fecha_vencimiento: `${MES}-10`, estado: 'pendiente' });

// Simula la carrera: cuando el generador busca la cuota del primer socio, "otra generación" la crea en ese
// instante y la búsqueda vuelve sin encontrar nada. El create del generador choca entonces con el índice.
// avisarTambien: si esa otra generación ya mandó su aviso de cuota nueva.
const simularOtraGeneracion = ({ avisarTambien }) => {
  const buscarOriginal = Cuota.findOne.bind(Cuota);
  let yaPaso = false;
  return vi.spyOn(Cuota, 'findOne').mockImplementation(async (opciones) => {
    if (!yaPaso && opciones?.where?.usuario_id === socios[0].id) {
      yaPaso = true;
      const creadaPorLaOtra = await Cuota.create(datosCuota(socios[0]));
      if (avisarTambien) {
        await crearNotificacion({ usuarioId: socios[0].id, tipo: 'cuota_nueva', titulo: 't', mensaje: 'm', referencia: `cuota-nueva:${creadaPorLaOtra.id}` });
      }
      return null; // la búsqueda "llegó antes" que la otra generación
    }
    return buscarOriginal(opciones);
  });
};

describe('índice único en el modelo Cuota', () => {
  it('se llama cuotas_usuario_mes_unico (igual que en Neon) y es sobre usuario_id + mes_anio', () => {
    expect(Cuota.options.indexes).toContainEqual(expect.objectContaining({
      name: 'cuotas_usuario_mes_unico', unique: true, fields: ['usuario_id', 'mes_anio'],
    }));
  });

  it('dos cuotas del mismo socio y mes creadas directo fallan con UniqueConstraintError', async () => {
    await Cuota.create(datosCuota(socios[0]));

    await expect(Cuota.create(datosCuota(socios[0]))).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('el mismo socio en otro mes, u otro socio en el mismo mes, no chocan', async () => {
    await Cuota.create(datosCuota(socios[0]));

    await expect(Cuota.create({ ...datosCuota(socios[0]), mes_anio: '2026-12', fecha_vencimiento: '2026-12-10' })).resolves.toBeTruthy();
    await expect(Cuota.create(datosCuota(socios[1]))).resolves.toBeTruthy();
  });
});

describe('generarCuotasDelMes con el índice único', () => {
  it('generar dos veces seguidas deja 1 cuota por socio', async () => {
    await generarCuotasDelMes();
    const segunda = await generarCuotasDelMes();

    expect(segunda.creadas).toBe(0);
    for (const socio of socios) expect(await cuotasDe(socio)).toBe(1);
  });

  it('si otra generación crea la cuota entre la búsqueda y el create: no falla, queda 1 cuota y 1 solo aviso, y los demás socios se generan', async () => {
    simularOtraGeneracion({ avisarTambien: true });

    const resultado = await generarCuotasDelMes();

    expect(resultado.exito).toBe(true);
    expect(resultado.creadas).toBe(2); // la del primer socio la creó la otra generación, no esta
    for (const socio of socios) {
      expect(await cuotasDe(socio)).toBe(1);
      expect(await avisosDe(socio)).toBe(1);
    }
  });

  it('cuando choca con el índice no manda ningún aviso propio (el aviso es de la generación que la creó)', async () => {
    simularOtraGeneracion({ avisarTambien: false });

    await generarCuotasDelMes();

    expect(await avisosDe(socios[0])).toBe(0);
    expect(await avisosDe(socios[1])).toBe(1);
    expect(await avisosDe(socios[2])).toBe(1);
  });

  it('un error distinto al de unicidad se sigue informando (la generación falla)', async () => {
    const crearOriginal = Cuota.create.bind(Cuota);
    vi.spyOn(Cuota, 'create').mockImplementation(async (datos, opciones) => {
      if (datos.usuario_id === socios[1].id) throw new Error('se cortó la conexión con la base');
      return crearOriginal(datos, opciones);
    });

    await expect(generarCuotasDelMes()).rejects.toThrow('se cortó la conexión con la base');
    expect(console.error).toHaveBeenCalledWith(' Error al generar las cuotas automáticas:', expect.any(Error));
  });
});
