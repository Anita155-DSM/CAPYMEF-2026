import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';
import { CATEGORIAS_NOTICIAS } from '../../config/categoriasNoticias.js';

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

export const validacionNoticia = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio.')
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),

  body('subtitulo')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('El subtítulo no puede superar los 300 caracteres.'),

  body('contenido')
    .trim()
    .notEmpty().withMessage('El contenido de la noticia es obligatorio.'),

  // Opcional: si no se envía, el controlador asigna la categoría por defecto ("Otras").
  // Si se envía, tiene que ser EXACTAMENTE una de la lista (GET /api/noticias/categorias): así todas
  // las noticias quedan agrupables y no aparecen "Institucional" e "institucional" como distintas.
  body('categoria')
    .optional()
    .trim()
    .isIn(CATEGORIAS_NOTICIAS).withMessage(`La categoría no es válida. Opciones: ${CATEGORIAS_NOTICIAS.join(', ')}.`),

  body('visibilidad')
    .optional()
    .isIn(['publico', 'socios', 'todos']).withMessage('La visibilidad debe ser "publico", "socios" o "todos".'),

  body('estado')
    .optional()
    .isIn(['borrador', 'publicado']).withMessage('El estado debe ser "borrador" o "publicado".'),

  validarResultado
];

export const validacionActualizarNoticia = [
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),

  body('subtitulo')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('El subtítulo no puede superar los 300 caracteres.'),

  body('contenido')
    .optional()
    .trim()
    .notEmpty().withMessage('El contenido no puede quedar vacío.'),

  body('categoria')
    .optional()
    .trim()
    .isIn(CATEGORIAS_NOTICIAS).withMessage(`La categoría no es válida. Opciones: ${CATEGORIAS_NOTICIAS.join(', ')}.`),

  body('visibilidad')
    .optional()
    .isIn(['publico', 'socios', 'todos']).withMessage('La visibilidad debe ser "publico", "socios" o "todos".'),

  body('estado')
    .optional()
    .isIn(['borrador', 'publicado']).withMessage('El estado debe ser "borrador" o "publicado".'),

  validarResultado
];