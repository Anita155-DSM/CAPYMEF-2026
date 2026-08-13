import { generarCuotasDelMes } from '../services/cuota.service.js';
import { Cuota } from '../models/cuota.models.js';
import { User } from '../models/user.models.js';
import { Pago } from '../models/pago.models.js';

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

// ==========================================
// 1. OBTENER CUOTAS PENDIENTES / DEUDAS (MOROSOS)
// ==========================================
export const obtenerCuotasPendientes = async (req, res) => {
  try {
    const pendientes = await Cuota.findAll({
      where: { estado: 'pendiente' },
      include: [{
        model: User,
        as: 'socio',
        attributes: ['id', 'razonSocial', 'cuit', 'email', 'telefono', 'categoria']
      }],
      order: [['fecha_vencimiento', 'ASC']]
    });

    res.status(200).json({ exito: true, total: pendientes.length, data: pendientes });
  } catch (error) {
    console.error('Error al obtener deudas pendientes:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar deudas pendientes.' });
  }
};

// ==========================================
// 2. MARCAR CUOTA COMO PAGADA (REGISTRO MANUAL DE PAGO)
// ==========================================
export const registrarPagoManual = async (req, res) => {
  try {
    const { id } = req.params; // ID de la Cuota
    const { metodoPago, nroComprobante, observaciones } = req.body;

    const cuota = await Cuota.findByPk(id);

    if (!cuota) {
      return res.status(404).json({ exito: false, mensaje: 'Cuota no encontrada.' });
    }

    if (cuota.estado === 'pagada') {
      return res.status(400).json({ exito: false, mensaje: 'Esta cuota ya fue abonada anteriormente.' });
    }

    // 1. Creamos el registro del Pago
    const nuevoPago = await Pago.create({
      cuota_id: cuota.id,
      usuario_id: cuota.usuario_id,
      montoAbonado: cuota.monto,
      metodoPago: metodoPago || 'Transferencia',
      nroComprobante: nroComprobante || null,
      observaciones: observaciones || 'Registro manual por administración'
    });

    // 2. Actualizamos el estado de la cuota
    cuota.estado = 'pagada';
    await cuota.save();

    res.status(200).json({
      exito: true,
      mensaje: 'El pago ha sido registrado e impactado correctamente.',
      data: { cuota, pago: nuevoPago }
    });

  } catch (error) {
    console.error('Error al registrar el pago:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al procesar el pago.' });
  }
};

// ==========================================
// 3. RESUMEN FINANCIERO (Dashboard Admin)
// ==========================================
export const obtenerResumenFinanciero = async (req, res) => {
  try {
    const totalPendientes = await Cuota.count({ where: { estado: 'pendiente' } });
    const totalPagadas = await Cuota.count({ where: { estado: 'pagada' } });

    const recaudacionTotal = await Pago.sum('montoAbonado') || 0;

    res.status(200).json({
      exito: true,
      data: {
        cuotasPendientesCount: totalPendientes,
        cuotasPagadasCount: totalPagadas,
        totalRecaudado: recaudacionTotal
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar resumen financiero.' });
  }
};