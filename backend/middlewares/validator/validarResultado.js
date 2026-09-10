import { validationResult } from 'express-validator';

// Middleware genérico que revisa si express-validator atrapó algún error.
// Compartido entre user.validator.js, evento.validator.js y noticia.validator.js
// para no repetir la misma lógica en 3 lugares. En caso de necesitar repetirla la repetimos en siguientes validators
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