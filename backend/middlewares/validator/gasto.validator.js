import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';

// Validación del alta de un gasto operativo (POST /api/gastos). Antes no había ninguna: un monto con letras,
// una fecha inválida o un gasto sin concepto llegaban a la base, que los rechazaba con un 500 sin explicar
// por qué. Ahora se responde 400 con el campo que está mal, y validarResultado borra el comprobante que
// multer ya había subido a Cloudinary.

// La columna monto es DECIMAL(10,2): hasta 8 dígitos enteros y 2 decimales. Se valida el texto (llega como
// texto en el formulario multipart) para que "10.125" no se redondee a escondidas.
const MONTO_VALIDO = /^\d{1,8}(\.\d{1,2})?$/;
export const montoDeGastoValido = (valor) => {
  if (typeof valor !== 'number' && typeof valor !== 'string') return false;
  if (typeof valor === 'number' && !Number.isFinite(valor)) return false;
  const texto = String(valor).trim();
  return MONTO_VALIDO.test(texto) && Number(texto) > 0;
};

export const MEDIOS_DE_PAGO_GASTO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'];

export const validacionGasto = [
  body('fecha')
    .notEmpty().withMessage('La fecha del gasto es obligatoria.')
    .bail()
    .isISO8601({ strict: true }).withMessage('La fecha debe tener un formato válido (AAAA-MM-DD).'),

  body('concepto')
    .trim()
    .notEmpty().withMessage('El concepto del gasto es obligatorio.')
    .bail()
    .isLength({ max: 200 }).withMessage('El concepto puede tener como máximo 200 caracteres.'),

  body('monto')
    .exists({ checkNull: true }).withMessage('El monto es obligatorio.')
    .bail()
    .custom(montoDeGastoValido).withMessage('El monto debe ser un número mayor a 0, con hasta 2 decimales.'),

  // Opcional: si no se manda, el controlador usa Transferencia.
  body('medio_pago')
    .optional({ values: 'falsy' })
    .isIn(MEDIOS_DE_PAGO_GASTO).withMessage(`El medio de pago no es válido. Opciones: ${MEDIOS_DE_PAGO_GASTO.join(', ')}.`),

  validarResultado,
];
