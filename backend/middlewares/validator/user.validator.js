import { body, validationResult } from 'express-validator';

// Middleware genérico que revisa si express-validator atrapó algún error
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

// ==========================================
// Reglas para el Registro de Socio
// ==========================================
export const validacionRegistro = [
  // 1. Datos de Identificación
  body('razonSocial')
    .trim()
    .notEmpty().withMessage('La Razón Social es obligatoria.')
    .isLength({ min: 3, max: 150 }).withMessage('La Razón Social debe tener entre 3 y 150 caracteres.'),

  body('cuit')
    .trim()
    .notEmpty().withMessage('El CUIT es obligatorio.')
    .matches(/^\d{2}-\d{8}-\d{1}$|\d{11}$/).withMessage('Formato de CUIT inválido (ej: 20-12345678-9 o 20123456789).'),

  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula.'),

  // 2. Datos de Contacto (Nuevos por Estatuto)
  body('telefono')
    .trim()
    .notEmpty().withMessage('El número de teléfono es obligatorio.'),

  body('localidad')
    .trim()
    .notEmpty().withMessage('La localidad es obligatoria.'),

  // 3. Categorización
  body('categoria')
    .optional() // Es opcional porque el controlador le pone 'adherente' por defecto si no lo envían
    .isIn(['activo', 'adherente', 'padrino']).withMessage('La categoría no es válida.'),

  validarResultado
];

// ==========================================
// Reglas para el Inicio de Sesión (Login)
// ==========================================
export const validacionLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.'),

  validarResultado
];

// ==========================================
// Reglas para Actualización de Socio (uso administrativo)
// ==========================================
export const validacionActualizarSocio = [
  body('razonSocial')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('La Razón Social debe tener entre 3 y 150 caracteres.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),

  body('telefono')
    .optional()
    .trim()
    .notEmpty().withMessage('El teléfono no puede quedar vacío.'),

  body('localidad')
    .optional()
    .trim()
    .notEmpty().withMessage('La localidad no puede quedar vacía.'),

  body('categoria')
    .optional()
    .isIn(['activo', 'adherente', 'padrino']).withMessage('La categoría no es válida.'),

  body('rubro')
    .optional()
    .isIn(['Comercio', 'Industria', 'Servicios', 'Agropecuario', 'Otro']).withMessage('El rubro no es válido.'),

  body('tamano_empresa')
    .optional()
    .isIn(['Micro', 'Pequena', 'Mediana', 'Grande']).withMessage('El tamaño de empresa no es válido.'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'aprobado', 'rechazado', 'inactivo']).withMessage('El estado no es válido.'),

  validarResultado
];