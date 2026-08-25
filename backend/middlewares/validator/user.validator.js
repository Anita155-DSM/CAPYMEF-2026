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
    // Antes la segunda alternativa no tenía '^', por lo que algo como "hola12345678901" pasaba la validación
    .matches(/^(\d{2}-\d{8}-\d{1}|\d{11})$/).withMessage('Formato de CUIT inválido (ej: 20-12345678-9 o 20123456789).'),

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
  // 4. Datos Institucionales y Comerciales
  body('rubro')
    .notEmpty().withMessage('El rubro es obligatorio.')
    .isIn(['Comercio', 'Industria', 'Servicios', 'Agropecuario', 'Otro']).withMessage('El rubro seleccionado no es válido.'),

  body('actividad')
    .optional() 
    .isString().withMessage('La actividad debe ser texto.')
    .trim(),

  body('tamano_empresa')
    .optional() 
    .isIn(['Micro', 'Pequena', 'Mediana']).withMessage('El tamaño de empresa no es válido.'),

  validarResultado
];

// ==========================================
// Reglas para solicitar la recuperación (paso 1: pedir el mail)
// ==========================================
export const validacionSolicitudRecuperacion = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),

  validarResultado
];

// ==========================================
// Reglas para restablecer la contraseña (paso 2: la nueva contraseña)
// ==========================================
export const validacionNuevaPassword = [
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula.'),

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