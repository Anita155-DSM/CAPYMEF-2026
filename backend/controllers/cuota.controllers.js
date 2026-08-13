import { generarCuotasDelMes } from '../services/cuota.service.js';
import { Cuota } from '../models/cuota.models.js';
import { User } from '../models/user.models.js';

// ==========================================
// 1. EJECUCIÓN MANUAL (Para Pruebas y Admin)
// ==========================================
export const ejecutarGeneracionCuotas = async (req, res) => {
  try {
    const resultado = await generarCuotasDelMes();
    
    res.status(200).json({
      exito: true,
      mensaje: `Proceso finalizado. Se generaron ${resultado.creadas} cuotas para el periodo ${resultado.periodo}.`,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al generar cuotas manualmente:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar las cuotas mensuales.' });
  }
};

// ==========================================
// 2. OBTENER LISTADO DE CUOTAS
// ==========================================
export const obtenerCuotas = async (req, res) => {
  try {
    const cuotas = await Cuota.findAll({
      include: [{
        model: User,
        as: 'socio',
        attributes: ['id', 'razonSocial', 'cuit', 'email', 'categoria']
      }],
      order: [['mes_anio', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({ exito: true, data: cuotas });
  } catch (error) {
    console.error('Error al obtener cuotas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las cuotas.' });
  }
};