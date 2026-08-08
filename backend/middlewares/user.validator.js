import { body, validationResult } from 'express-validator';

// Middleware que revisa si express-validator atrapó algún error de formato
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
  body('razonSocial')
    .trim()
    .notEmpty().withMessage('La Razón Social es obligatoria.')
    .isLength({ min: 6, max: 150 }).withMessage('La Razón Social debe tener entre 6 y 150 caracteres.'),

  body('cuit')
    .trim()
    .notEmpty().withMessage('El CUIT es obligatorio.')
    .matches(/^\d{2}-\d{8}-\d{1}$|\d{11}$/).withMessage('Formato de CUIT inválido (ej: 20-12345678-9 o 20123456789).'),

  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(), // convierte todo el email a minusculas para evitar inconsistencias

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