import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';
import { motivoUrlDeLogoInvalida, MAXIMO_LOGOS_EXTERNOS } from '../../services/urlSegura.service.js';

// Logos externos de los certificados. Llegan como un texto JSON (por el multipart/form-data, ej.
// '["https://..."]') o como array si el pedido es JSON. El SERVIDOR los descarga al generar cada certificado,
// así que no alcanza con "parece un link": antes se aceptaba cualquier http(s), incluida una dirección interna
// (riesgo de SSRF, ver services/urlSegura.service.js). Ahora: como máximo 5, y cada uno https, sin usuario ni
// contraseña, puerto 443, hasta 255 caracteres y con un dominio público (ni IP, ni localhost).
// Es la misma regla al crear y al editar (antes estaba copiada dos veces).
const validarLogosExternos = (valor) => {
  if (!valor) return true;
  let parseado = valor;
  if (!Array.isArray(valor)) {
    try {
      parseado = JSON.parse(valor);
    } catch {
      throw new Error('logosExternos debe ser un array de URLs en formato JSON.');
    }
  }
  if (!Array.isArray(parseado)) {
    throw new Error('logosExternos debe ser un array.');
  }
  if (parseado.length > MAXIMO_LOGOS_EXTERNOS) {
    throw new Error(`Podés cargar como máximo ${MAXIMO_LOGOS_EXTERNOS} logos externos.`);
  }
  parseado.forEach((url, indice) => {
    const motivo = motivoUrlDeLogoInvalida(url);
    if (motivo) throw new Error(`El logo ${indice + 1} no es válido: ${motivo}.`);
  });
  return true;
};

// export const validarResultado = (req, res, next) => {
//   const errores = validationResult(req);
//   if (!errores.isEmpty()) {
//     return res.status(400).json({
//       exito: false,
//       mensaje: 'Error de validación en los datos enviados.',
//       errores: errores.array().map(err => ({ campo: err.path, mensaje: err.msg }))
//     });
//   }
//   next();
// };

export const validacionEvento = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio.')
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),

  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria.'),

  body('fecha')
    .notEmpty().withMessage('La fecha es obligatoria.')
    .isISO8601().withMessage('La fecha debe tener un formato válido (YYYY-MM-DD).'),

  body('horaInicio')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de inicio debe tener formato HH:MM.'),

  body('horaFin')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de fin debe tener formato HH:MM.'),

  body('modalidad')
    .optional()
    .isIn(['presencial', 'virtual']).withMessage('La modalidad debe ser "presencial" o "virtual".'),

  body('lugar')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('El lugar no puede superar los 255 caracteres.'),

  body('cupoMaximo')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('El cupo máximo debe ser un número entero mayor a 0.'),

  body('estado')
    .optional()
    .isIn(['programado', 'finalizado', 'cancelado']).withMessage('Estado inválido.'),

  // logosExternos: ver validarLogosExternos (arriba).
  body('logosExternos')
    .optional()
    .custom(validarLogosExternos),

  validarResultado
];

export const validacionActualizarEvento = [
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),
  body('descripcion')
    .optional()
    .trim()
    .notEmpty().withMessage('La descripción no puede quedar vacía.'),
  body('fecha')
    .optional()
    .isISO8601().withMessage('La fecha debe tener un formato válido (YYYY-MM-DD).'),
  body('horaInicio')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de inicio debe tener formato HH:MM.'),
  body('horaFin')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de fin debe tener formato HH:MM.'),
  body('modalidad')
    .optional()
    .isIn(['presencial', 'virtual']).withMessage('La modalidad debe ser "presencial" o "virtual".'),
  body('lugar')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('El lugar no puede superar los 255 caracteres.'),
  body('cupoMaximo')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('El cupo máximo debe ser un número entero mayor a 0.'),
  body('estado')
    .optional()
    .isIn(['programado', 'finalizado', 'cancelado']).withMessage('Estado inválido.'),
  body('logosExternos')
    .optional()
    .custom(validarLogosExternos),
  validarResultado
];
