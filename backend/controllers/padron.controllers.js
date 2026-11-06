// ==========================================
// PADRÓN DE SOCIOS HABILITADOS PARA VOTAR (solo admin)
// ==========================================
// Las reglas están en services/padron.service.js. Acá solo se valida la fecha de corte y se arma la
// respuesta (JSON o CSV).
import { calcularPadron, esFechaValida, padronACsv } from '../services/padron.service.js';
import { fechaHoyArgentina } from '../services/cuota.service.js';

// ?fecha=YYYY-MM-DD opcional; sin ella, hoy en hora argentina. Devuelve null si el formato es inválido.
const leerFechaCorte = (req) => {
  const { fecha } = req.query;
  if (fecha === undefined) return fechaHoyArgentina();
  return esFechaValida(fecha) ? fecha : null;
};

const fechaInvalida = (res) =>
  res.status(400).json({ exito: false, mensaje: 'La fecha de corte debe tener el formato YYYY-MM-DD y ser una fecha válida.' });

export const obtenerPadron = async (req, res) => {
  const fechaCorte = leerFechaCorte(req);
  if (!fechaCorte) return fechaInvalida(res);

  try {
    const data = await calcularPadron({ fechaCorte });
    res.status(200).json({ exito: true, data });
  } catch (error) {
    console.error('Error al calcular el padrón:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al calcular el padrón.' });
  }
};

export const exportarPadron = async (req, res) => {
  const fechaCorte = leerFechaCorte(req);
  if (!fechaCorte) return fechaInvalida(res);

  try {
    const { habilitados } = await calcularPadron({ fechaCorte });
    res
      .status(200)
      .set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="padron-habilitados-${fechaCorte}.csv"`)
      .send(padronACsv(habilitados));
  } catch (error) {
    console.error('Error al exportar el padrón:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al exportar el padrón.' });
  }
};
