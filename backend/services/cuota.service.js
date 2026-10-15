import { Op } from 'sequelize';
import { User } from '../models/user.models.js';
import { Cuota } from '../models/cuota.models.js';
import { obtenerMapaDeTarifas } from './tarifa.service.js';
import {
  crearNotificacion,
  notificarAdmins,
  formatearFecha,
  formatearMonto,
  formatearPeriodo,
  diasEntre,
} from './notificacion.service.js';

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
        const cuotaNueva = await Cuota.create({
          usuario_id: socio.id,
          mes_anio: mesActual,
          monto,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente'
        });
        cuotasCreadas++;

        // Aviso interno al socio. crearNotificacion nunca lanza error: si fallara,
        // la cuota ya quedó creada y el proceso sigue con el próximo socio.
        await crearNotificacion({
          usuarioId: socio.id,
          tipo: 'cuota_nueva',
          titulo: `Ya está disponible tu cuota de ${formatearPeriodo(mesActual)}`,
          mensaje: `Tu cuota es de ${formatearMonto(monto)} y podés pagarla hasta el ${formatearFecha(fechaVencimiento)}.`,
          referencia: `cuota-nueva:${cuotaNueva.id}`,
        });
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

  // Antes era un único UPDATE masivo. Ahora primero identificamos QUÉ cuotas vencen,
  // porque necesitamos saber a qué socios avisarles.
  const porVencer = await Cuota.findAll({
    where: { estado: 'pendiente', fecha_vencimiento: { [Op.lt]: hoy } },
    attributes: ['id'],
  });

  let marcadas = 0;

  if (porVencer.length > 0) {
    const ids = porVencer.map((cuota) => cuota.id);

    // Se repite estado:'pendiente' en el UPDATE por si alguien pagó justo entre la consulta y acá.
    const [cantidad] = await Cuota.update(
      { estado: 'vencida' },
      { where: { id: ids, estado: 'pendiente' } }
    );
    marcadas = cantidad;

    // Avisamos solo por las que efectivamente quedaron vencidas.
    const vencidas = await Cuota.findAll({
      where: { id: ids, estado: 'vencida' },
      attributes: ['id', 'usuario_id', 'mes_anio', 'monto'],
    });

    for (const cuota of vencidas) {
      await crearNotificacion({
        usuarioId: cuota.usuario_id,
        tipo: 'cuota_vencida',
        titulo: `Tu cuota de ${formatearPeriodo(cuota.mes_anio)} está vencida`,
        mensaje: `Tenés pendiente ${formatearMonto(cuota.monto)}. Podés regularizarla desde la sección de pagos.`,
        referencia: `cuota-vencida:${cuota.id}`,
      });
    }
  }

  // Aviso a los administradores solo el día en que vencen cuotas nuevas (no todos los días):
  // una alerta repetida a diario con el mismo texto se vuelve ruido y se deja de leer.
  // El detalle de la deuda a demanda está en el panel de Finanzas (resumen-financiero).
  // La referencia lleva la fecha, así que si el cron corre dos veces el mismo día no se repite.
  if (marcadas > 0) {
    const totalVencidas = await Cuota.count({ where: { estado: 'vencida' } });
    await notificarAdmins({
      tipo: 'resumen_vencidas',
      titulo: 'Cuotas vencidas sin pagar',
      mensaje: `Hoy vencieron ${marcadas} cuota(s). En total hay ${totalVencidas} cuota(s) vencida(s) sin pagar.`,
      referencia: `resumen-vencidas:${hoy}`,
    });
  }

  console.log(` Cuotas marcadas como vencidas: ${marcadas}`);
  return { exito: true, marcadas, fechaCorte: hoy };
};

// Recordatorio previo al vencimiento: avisa a quienes todavía tienen la cuota pendiente
// dentro de la ventana de pago (vencimiento hoy o más adelante).
// Se corre una vez por mes (día 7). Si se corriera de nuevo no duplica alertas:
// la referencia es única por cuota.
export const enviarRecordatoriosDeVencimiento = async () => {
  const hoy = fechaHoyArgentina();

  const pendientes = await Cuota.findAll({
    where: { estado: 'pendiente', fecha_vencimiento: { [Op.gte]: hoy } },
    attributes: ['id', 'usuario_id', 'mes_anio', 'monto', 'fecha_vencimiento'],
  });

  let enviados = 0;

  for (const cuota of pendientes) {
    const dias = diasEntre(hoy, cuota.fecha_vencimiento);
    const cuando = dias === 0 ? 'vence hoy' : dias === 1 ? 'vence mañana' : `vence en ${dias} días`;

    const creada = await crearNotificacion({
      usuarioId: cuota.usuario_id,
      tipo: 'recordatorio_cuota',
      titulo: `Tu cuota de ${formatearPeriodo(cuota.mes_anio)} ${cuando}`,
      mensaje: `Recordá abonar ${formatearMonto(cuota.monto)} hasta el ${formatearFecha(cuota.fecha_vencimiento)} para estar al día.`,
      referencia: `recordatorio:${cuota.id}`,
    });
    if (creada) enviados++;
  }

  console.log(` Recordatorios de vencimiento enviados: ${enviados}`);
  return { exito: true, enviados, fechaCorte: hoy };
};
