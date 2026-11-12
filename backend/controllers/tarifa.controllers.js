import { Tarifa } from '../models/tarifa.models.js';
import { categoriasValidas, CATEGORIA_CON_CUOTA } from '../services/tarifa.service.js';
import { CODIGOS_AUTH } from '../middlewares/codigosAuth.js';

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
// 2. ACTUALIZAR EL MONTO DE LA CUOTA (Admin)
// ==========================================
// Solo la tarifa de los Activos (ver CATEGORIA_CON_CUOTA en tarifa.service.js). El cambio rige para las
// cuotas que se generen DESPUÉS: cada cuota guarda su propio monto al generarse (cuota.monto), así que las
// ya generadas (incluida la del mes en curso) no cambian. Eso también mantiene coherente la validación del
// webhook de Mercado Pago, que compara el pago contra cuota.monto.
// Quién y cuándo lo registra el interceptor de auditoría; acá se deja el monto anterior y el nuevo.
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

    if (categoria !== CATEGORIA_CON_CUOTA) {
      return res.status(403).json({
        exito: false,
        mensaje: `Solo se puede modificar la cuota de la categoría "${CATEGORIA_CON_CUOTA}": por estatuto, las demás categorías no pagan cuota mensual.`,
        codigo: CODIGOS_AUTH.SIN_PERMISOS,
      });
    }

    const [tarifa] = await Tarifa.findOrCreate({ where: { categoria }, defaults: { monto: 0 } });

    // Guardamos el valor anterior antes de pisarlo, para dejarlo en el log de auditoría.
    const montoAnterior = Number(tarifa.monto);
    // Se guarda como texto con 2 decimales (columna DECIMAL): así no pasa por un número con decimales
    // binarios. El validador ya garantizó que tiene como máximo 2 decimales.
    tarifa.monto = Number(monto).toFixed(2);
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