import { Tarifa } from '../models/tarifa.models.js';
import { categoriasValidas } from '../services/tarifa.service.js';

// ==========================================
// 1. LISTAR TARIFAS (Admin)
// ==========================================
export const obtenerTarifas = async (req, res) => {
  try {
    const tarifas = await Tarifa.findAll({ order: [['categoria', 'ASC']] });
    res.status(200).json({ exito: true, data: tarifas });
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2. ACTUALIZAR EL MONTO DE UNA CATEGORÍA (Admin)
// ==========================================
export const actualizarTarifa = async (req, res) => {
  try {
    const { categoria } = req.params;
    const { monto } = req.body;

    if (!categoriasValidas().includes(categoria)) {
      return res.status(400).json({
        exito: false,
        mensaje: `Categoría inválida. Valores permitidos: ${categoriasValidas().join(', ')}.`,
      });
    }

    const [tarifa] = await Tarifa.findOrCreate({ where: { categoria }, defaults: { monto: 0 } });

    // Guardamos el valor anterior antes de pisarlo, para dejarlo en el log de auditoría.
    const montoAnterior = Number(tarifa.monto);
    tarifa.monto = monto;
    await tarifa.save();
    await tarifa.reload(); // devolvemos el valor tal cual quedó en la base, con el mismo formato que el GET

    //auditoria
    req.auditoriaMensaje = `Se cambió la tarifa de la categoría "${categoria}" de $${montoAnterior} a $${Number(tarifa.monto)}`;
    req.auditoriaCodigo = 'UPDATE_TARIFA';

    res.status(200).json({
      exito: true,
      mensaje: `Tarifa de "${categoria}" actualizada. Rige para las cuotas que se generen de ahora en adelante.`,
      data: tarifa,
    });
  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};