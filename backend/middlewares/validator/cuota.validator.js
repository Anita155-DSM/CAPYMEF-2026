import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';

// La columna pagos.observaciones es VARCHAR(255) (models/pago.models.js). Sin este tope, un texto más largo
// llegaba hasta la base, Postgres lo rechazaba ("value too long") y el admin recibía un 500 sin saber por
// qué. Ahora se corta antes con un 400 que explica el problema, y la cuota no queda pagada.
export const LARGO_MAXIMO_OBSERVACIONES = 255;

// La columna pagos.nroComprobante es VARCHAR(100) (models/pago.models.js): mismo motivo que las observaciones.
export const LARGO_MAXIMO_NRO_COMPROBANTE = 100;

// Pago manual que registra la administración (PUT /api/cuotas/:id/pagar): efectivo, transferencia, etc.
export const validacionPagoManual = [
  // Opcional: si no se manda, el controlador pone "Registro manual por administración".
  // null también se acepta como "sin observaciones" (el frontend puede mandar el campo vacío así).
  body('observaciones')
    .optional({ values: 'null' })
    // Tiene que ser texto: un objeto o una lista se guardarían como "[object Object]" o fallarían en la base.
    .isString().withMessage('Las observaciones deben ser un texto.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_OBSERVACIONES })
    .withMessage(`Las observaciones pueden tener como máximo ${LARGO_MAXIMO_OBSERVACIONES} caracteres.`),

  // Número de recibo o id de la transferencia del banco. Opcional (null = sin número), como las observaciones.
  body('nroComprobante')
    .optional({ values: 'null' })
    .isString().withMessage('El número de comprobante debe ser un texto.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_NRO_COMPROBANTE })
    .withMessage(`El número de comprobante puede tener como máximo ${LARGO_MAXIMO_NRO_COMPROBANTE} caracteres.`),

  validarResultado
];
