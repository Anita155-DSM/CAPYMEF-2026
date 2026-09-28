import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';

export const validacionTarifa = [
  body('monto')
    .exists({ checkNull: true }).withMessage('El monto es obligatorio.')
    .isFloat({ min: 0 }).withMessage('El monto debe ser un número mayor o igual a 0.'),

  validarResultado
];