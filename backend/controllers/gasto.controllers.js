import fs from 'fs';
import { Gasto } from '../models/gasto.models.js';

// Función auxiliar para limpiar archivos si la base de datos falla
const eliminarArchivo = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==========================================
// 1. REGISTRAR UN NUEVO GASTO (Egreso)
// ==========================================
export const registrarGasto = async (req, res) => {
  const comprobanteFile = req.file; // Foto o PDF del ticket/factura

  try {
    const { fecha, concepto, monto, medio_pago } = req.body;

    const nuevoGasto = await Gasto.create({
      fecha,
      concepto,
      monto,
      medio_pago: medio_pago || 'Transferencia',
      url_comprobante: comprobanteFile ? comprobanteFile.path : null,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Gasto registrado correctamente.',
      data: nuevoGasto,
    });
  } catch (error) {
    if (comprobanteFile) eliminarArchivo(comprobanteFile.path);
    console.error('Error al registrar gasto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2. OBTENER EL HISTORIAL DE GASTOS
// ==========================================
export const obtenerGastos = async (req, res) => {
  try {
    const gastos = await Gasto.findAll({
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']], // Los más recientes primero
    });

    res.status(200).json({ exito: true, data: gastos });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 3. ELIMINAR UN GASTO (Borrado Lógico)
// ==========================================
export const eliminarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const gasto = await Gasto.findByPk(id);

    if (!gasto) {
      return res.status(404).json({ exito: false, mensaje: 'Gasto no encontrado.' });
    }

    await gasto.destroy(); // Soft delete gracias a paranoid: true

    res.status(200).json({
      exito: true,
      mensaje: 'Gasto eliminado del registro.',
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};