import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';
import { aceptoLosTerminos, terminosObligatorios, MENSAJE_TERMINOS_OBLIGATORIOS } from '../../config/terminos.js';

// Categorías que se pueden pedir al registrarse y las que solo asigna la Cámara (ver validacionRegistro).
export const CATEGORIAS_DEL_REGISTRO = ['activo', 'adherente'];
export const CATEGORIAS_QUE_ASIGNA_LA_CAMARA = ['padrino', 'honorario'];

// La columna users.telefono es VARCHAR(20) (models/user.models.js): un teléfono más largo hacía fallar el
// guardado en la base con un 500. Con este tope se responde un 400 que dice qué está mal.
export const LARGO_MAXIMO_TELEFONO = 20;

// La columna users.localidad es VARCHAR(100) (models/user.models.js): mismo motivo que el teléfono.
export const LARGO_MAXIMO_LOCALIDAD = 100;

// Un solo texto por tope, para que el registro, la edición del admin y "mi perfil" digan lo mismo.
const MENSAJE_TOPE_TELEFONO = `El teléfono puede tener como máximo ${LARGO_MAXIMO_TELEFONO} caracteres.`;
const MENSAJE_TOPE_LOCALIDAD = `La localidad puede tener como máximo ${LARGO_MAXIMO_LOCALIDAD} caracteres.`;

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
  // Además de obligatorios, con el largo de su columna: un texto más largo daba un 500 de la base.
  // bail(): si falta el dato, se informa solo eso (no también el tope).
  body('telefono')
    .trim()
    .notEmpty().withMessage('El número de teléfono es obligatorio.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_TELEFONO }).withMessage(MENSAJE_TOPE_TELEFONO),

  body('localidad')
    .trim()
    .notEmpty().withMessage('La localidad es obligatoria.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_LOCALIDAD }).withMessage(MENSAJE_TOPE_LOCALIDAD),

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

  // 4. Términos y condiciones: la aceptación tiene que venir explícita (aceptaTerminos = true). Mientras el
  // frontend no mande el campo, la exigencia está apagada (ver terminosObligatorios en config/terminos.js).
  body('aceptaTerminos').custom((valor) => {
    if (!terminosObligatorios() || aceptoLosTerminos(valor)) return true;
    throw new Error(MENSAJE_TERMINOS_OBLIGATORIOS);
  }),

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

  // Mismos topes que en el registro (largo de la columna en la base).
  body('telefono')
    .optional()
    .trim()
    .notEmpty().withMessage('El teléfono no puede quedar vacío.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_TELEFONO }).withMessage(MENSAJE_TOPE_TELEFONO),

  body('localidad')
    .optional()
    .trim()
    .notEmpty().withMessage('La localidad no puede quedar vacía.')
    .bail()
    .isLength({ max: LARGO_MAXIMO_LOCALIDAD }).withMessage(MENSAJE_TOPE_LOCALIDAD),

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
    .withMessage(MENSAJE_TOPE_TELEFONO),

  // La localidad también la puede cambiar el socio y va a la misma columna VARCHAR(100).
  body('localidad')
    .optional()
    .trim()
    .isLength({ max: LARGO_MAXIMO_LOCALIDAD })
    .withMessage(MENSAJE_TOPE_LOCALIDAD),

  validarResultado
];