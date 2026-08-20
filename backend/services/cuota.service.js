import { User } from '../models/user.models.js';
import { Cuota } from '../models/cuota.models.js';

// Montos simulados (luego Capymef te dirá los valores reales)
const MONTOS_POR_CATEGORIA = {
  activo: 15000.00,
  adherente: 10000.00,
  padrino: 25000.00
};

export const generarCuotasDelMes = async () => {
  try {
    const hoy = new Date();
    // Armamos el string "YYYY-MM" (Ej: 2026-08). El +1 es porque getMonth() arranca en 0
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    
    // El vencimiento es el día 10 del mes actual (Regla BBVA)
    const fechaVencimiento = `${mesActual}-10`;

    console.log(`⏳ Iniciando generación de cuotas para el periodo: ${mesActual}`);

    // 1. Traemos a TODOS los socios que estén APROBADOS
    const sociosActivos = await User.findAll({
      where: { estado: 'aprobado' }
    });

    let cuotasCreadas = 0;

    // 2. Recorremos cada socio
    for (const socio of sociosActivos) {
      // Verificamos si este socio ya tiene una cuota este mes para no duplicar
      const cuotaExistente = await Cuota.findOne({
        where: { usuario_id: socio.id, mes_anio: mesActual }
      });

      if (!cuotaExistente) {
        // Creamos la cuota
        await Cuota.create({
          usuario_id: socio.id,
          mes_anio: mesActual,
          monto: MONTOS_POR_CATEGORIA[socio.categoria] || 10000.00,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente'
        });
        cuotasCreadas++;
      }
    }

    console.log(` Proceso finalizado. Se generaron ${cuotasCreadas} cuotas nuevas.`);
    return { exito: true, creadas: cuotasCreadas, periodo: mesActual };

  } catch (error) {
    console.error(' Error al generar las cuotas automáticas:', error);
    throw error;
  }
};