import { Gasto } from '../models/gasto.models.js';
import { v2 as cloudinary } from 'cloudinary'; // Importamos el SDK para borrar de la nube

// Función para limpiar la nube si ocurre un error en PostgreSQL
const eliminarArchivoNube = async (public_id) => {
  if (public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error al borrar archivo de Cloudinary:', error);
    }
  }
};

// ==========================================
// 1. REGISTRAR UN NUEVO GASTO (Egreso)
// ==========================================
export const registrarGasto = async (req, res) => {
  const comprobanteFile = req.file; // ¡Este archivo ya está en Cloudinary gracias al middleware!

  try {
    const { fecha, concepto, monto, medio_pago } = req.body;

    const nuevoGasto = await Gasto.create({
      fecha,
      concepto,
      monto,
      medio_pago: medio_pago || 'Transferencia',
      url_comprobante: comprobanteFile ? comprobanteFile.path : null, // Guardamos la URL pública (ej: https://res.cloudinary.com/...)
    });

    // 📝 Dejamos la nota para tu Middleware de Auditoría
    req.auditoriaMensaje = `Se registró un gasto por $${monto} (Concepto: ${concepto})`;
    req.auditoriaCodigo = 'CREATE_GASTO_OPERATIVO';

    res.status(201).json({
      exito: true,
      mensaje: 'Gasto registrado correctamente en la nube.',
      data: nuevoGasto,
    });
  } catch (error) {
    // Si la BD falla, borramos la imagen que recién subimos a Cloudinary para no ocupar espacio basura
    if (comprobanteFile) await eliminarArchivoNube(comprobanteFile.filename);
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
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']], 
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

    req.auditoriaMensaje = `Se eliminó el registro del gasto #${id} (${gasto.concepto})`;
    req.auditoriaCodigo = 'DELETE_GASTO';

    res.status(200).json({ exito: true, mensaje: 'Gasto eliminado del registro.' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};