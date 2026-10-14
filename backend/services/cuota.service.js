import { Op } from 'sequelize';
import { User } from '../models/user.models.js';
import { Cuota } from '../models/cuota.models.js';
import { obtenerMapaDeTarifas } from './tarifa.service.js';

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

// Fecha de hoy como "YYYY-MM-DD" según la hora de Argentina, no la del servidor.
// El locale 'en-CA' devuelve justamente ese formato.
export const fechaHoyArgentina = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

export const generarCuotasDelMes = async () => {
  try {
    // "YYYY-MM" del mes actual en hora argentina (Ej: 2026-09)
    const mesActual = fechaHoyArgentina().slice(0, 7);

    // El vencimiento es el día 10 del mes actual (ventana de pago del 1 al 10)
    const fechaVencimiento = `${mesActual}-10`;

    console.log(`Iniciando generación de cuotas para el periodo: ${mesActual}`);

    const tarifas = await obtenerMapaDeTarifas();

    const sociosActivos = await User.findAll({
      where: { estado: 'aprobado' }
    });

    let cuotasCreadas = 0;
    let sociosExentos = 0;
    const categoriasSinTarifa = new Set();

    for (const socio of sociosActivos) {
      const monto = tarifas[socio.categoria];

      // Categoría sin tarifa cargada: no adivinamos un monto, lo informamos.
      if (monto === undefined) {
        categoriasSinTarifa.add(socio.categoria);
        continue;
      }

      // Tarifa en 0: esta categoría no paga cuota mensual.
      if (monto <= 0) {
        sociosExentos++;
        continue;
      }

      const cuotaExistente = await Cuota.findOne({
        where: { usuario_id: socio.id, mes_anio: mesActual }
      });

      if (!cuotaExistente) {
        await Cuota.create({
          usuario_id: socio.id,
          mes_anio: mesActual,
          monto,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente'
        });
        cuotasCreadas++;
      }
    }

    if (categoriasSinTarifa.size > 0) {
      console.warn(`Categorías sin tarifa cargada (no se generó cuota): ${[...categoriasSinTarifa].join(', ')}`);
    }

    console.log(` Proceso finalizado. Se generaron ${cuotasCreadas} cuotas nuevas.`);
    return {
      exito: true,
      creadas: cuotasCreadas,
      periodo: mesActual,
      sociosExentos,
      categoriasSinTarifa: [...categoriasSinTarifa],
    };

  } catch (error) {
    console.error(' Error al generar las cuotas automáticas:', error);
    throw error;
  }
};

// Cierra la ventana de pago: las cuotas impagas cuyo vencimiento ya pasó
// (día 11 en adelante) dejan de estar "pendiente" y pasan a "vencida".
// Compara por fecha y no por "hoy es día 11": si el servidor estuvo apagado ese día,
// la próxima corrida igual las encuentra, y correrlo dos veces no cambia nada.
export const marcarCuotasVencidas = async () => {
  const hoy = fechaHoyArgentina();

  const [marcadas] = await Cuota.update(
    { estado: 'vencida' },
    { where: { estado: 'pendiente', fecha_vencimiento: { [Op.lt]: hoy } } }
  );

  console.log(` Cuotas marcadas como vencidas: ${marcadas}`);
  return { exito: true, marcadas, fechaCorte: hoy };
};