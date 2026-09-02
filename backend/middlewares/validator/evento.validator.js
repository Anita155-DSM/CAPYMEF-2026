import { body, validationResult } from 'express-validator';

export const validarResultado = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validación en los datos enviados.',
      errores: errores.array().map(err => ({ campo: err.path, mensaje: err.msg }))
    });
  }
  next();
};

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

  // logosExternos llega como un string JSON (por el multipart/form-data), por eso
  // se valida con un chequeo personalizado en vez de isArray/isURL directo.
  body('logosExternos')
    .optional()
    .custom((valor) => {
      if (!valor) return true;
      let parseado;
      try {
        parseado = JSON.parse(valor);
      } catch {
        throw new Error('logosExternos debe ser un array de URLs en formato JSON.');
      }
      if (!Array.isArray(parseado)) {
        throw new Error('logosExternos debe ser un array.');
      }
      const regexUrl = /^https?:\/\/.+/i;
      const todasValidas = parseado.every((url) => typeof url === 'string' && regexUrl.test(url));
      if (!todasValidas) {
        throw new Error('Todas las URLs de logosExternos deben ser links válidos (http/https).');
      }
      return true;
    }),

  validarResultado
];
