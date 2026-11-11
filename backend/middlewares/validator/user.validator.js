import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';

// Categorías que se pueden pedir al registrarse y las que solo asigna la Cámara (ver validacionRegistro).
export const CATEGORIAS_DEL_REGISTRO = ['activo', 'adherente'];
export const CATEGORIAS_QUE_ASIGNA_LA_CAMARA = ['padrino', 'honorario'];

// La columna users.telefono es VARCHAR(20) (models/user.models.js): un teléfono más largo hacía fallar el
// guardado en la base con un 500. Con este tope se responde un 400 que dice qué está mal.
export const LARGO_MAXIMO_TELEFONO = 20;

// Middleware genérico que revisa si express-validator atrapó algún error
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
  // En el registro público solo se puede pedir Activo o Adherente. Padrino (quien hizo una donación o
  // contribución) y Honorario (designado por la Cámara) no se eligen: los asigna un admin desde la
  // edición del socio. Si se pudieran elegir acá, cualquiera podría registrarse con una categoría que no
  // le corresponde.
  body('categoria')
    .optional() // Es opcional porque el controlador le pone 'adherente' por defecto si no lo envían
    .not().isIn(CATEGORIAS_QUE_ASIGNA_LA_CAMARA)
    .withMessage('Esta categoría la asigna la Cámara: en el registro podés elegir Activo o Adherente.')
    .bail()
    .isIn(CATEGORIAS_DEL_REGISTRO).withMessage('La categoría no es válida. En el registro podés elegir Activo o Adherente.'),

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
    .isIn(['activo', 'adherente', 'padrino', 'honorario']).withMessage('La categoría no es válida.'),

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

// ==========================================
// Reglas para que el socio edite su propio perfil (PUT /api/auth/perfil)
// ==========================================
// El controlador solo toma teléfono y localidad. Hasta ahora esta ruta no tenía validador: un teléfono de
// más de 20 caracteres llegaba a la base y terminaba en un 500. El teléfono sigue siendo opcional (si no se
// manda, o llega vacío, el controlador deja el que estaba) y no se le exige un formato: no había ninguno.
export const validacionActualizarPerfil = [
  body('telefono')
    .optional()
    .trim() // igual que en el registro: los espacios de los costados no cuentan ni se guardan
    .isLength({ max: LARGO_MAXIMO_TELEFONO })
    .withMessage(`El teléfono puede tener como máximo ${LARGO_MAXIMO_TELEFONO} caracteres.`),

  validarResultado
];