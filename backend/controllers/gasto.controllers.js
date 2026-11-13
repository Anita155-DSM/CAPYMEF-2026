import { Gasto } from '../models/gasto.models.js';
import { eliminarArchivoDeCloudinary, urlTemporalDeArchivo, reemplazarUrlPorIndicador } from '../services/cloudinary.service.js';

// El comprobante de un gasto es privado en Cloudinary: ningún JSON devuelve su URL, sino tieneComprobante, y la
// URL temporal se pide a GET /api/gastos/:id/comprobante.
const sinUrlDeComprobante = (gasto) => reemplazarUrlPorIndicador(gasto, 'url_comprobante', 'tieneComprobante');

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

    //auditoria
    req.auditoriaMensaje = `Se registró un egreso por $${monto} (Concepto: ${concepto})`;
    req.auditoriaCodigo = 'CREATE_GASTO_OPERATIVO';

    res.status(201).json({
      exito: true,
      mensaje: 'Gasto registrado correctamente.',
      data: sinUrlDeComprobante(nuevoGasto),
    });
  } catch (error) {
    // El comprobante ya subido se borra (es privado: se borra indicando su tipo, ver cloudinary.service.js).
    if (comprobanteFile) eliminarArchivoDeCloudinary(comprobanteFile.path);
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

    res.status(200).json({ exito: true, data: gastos.map(sinUrlDeComprobante) });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2.b COMPROBANTE DE UN GASTO (URL temporal, solo admin)
// ==========================================
export const obtenerComprobanteGasto = async (req, res) => {
  try {
    const gasto = await Gasto.findByPk(req.params.id, { attributes: ['id', 'url_comprobante'] });
    if (!gasto) {
      return res.status(404).json({ exito: false, mensaje: 'Gasto no encontrado.' });
    }
    const urlGuardada = gasto.url_comprobante;
    if (!urlGuardada) {
      return res.status(404).json({ exito: false, mensaje: 'Este gasto no tiene comprobante.' });
    }
    const data = urlTemporalDeArchivo(urlGuardada);
    if (!data) {
      // Una URL que no es de Cloudinary (por ejemplo, un archivo local de antes de usar Cloudinary).
      return res.status(404).json({ exito: false, mensaje: 'El archivo no está disponible.' });
    }
    res.status(200).json({ exito: true, data });
  } catch (error) {
    console.error('Error al obtener el comprobante del gasto:', error.message);
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

    const conceptoEliminado = gasto.concepto;
    const montoEliminado = gasto.monto;

    await gasto.destroy(); // Soft delete gracias a paranoid: true

    //auditoria
    req.auditoriaMensaje = `Se eliminó el registro de gasto #${id}: ${conceptoEliminado} ($${montoEliminado})`;
    req.auditoriaCodigo = 'DELETE_GASTO_OPERATIVO';

    res.status(200).json({
      exito: true,
      mensaje: 'Gasto eliminado del registro.',
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};