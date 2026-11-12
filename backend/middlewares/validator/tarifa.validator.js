import { body } from 'express-validator';
import { validarResultado } from './validarResultado.js';
import { MONTO_MAXIMO_TARIFA } from '../../services/tarifa.service.js';

// El monto de la cuota: un número (o un texto con un número) mayor a 0, con 2 decimales como máximo y
// hasta MONTO_MAXIMO_TARIFA. Antes se aceptaba 0 (dejaba a todos sin cuota) y cualquier cantidad de
// decimales. Se valida el TEXTO del número (no el número con decimales) para que 10.125 no pase por 10.13.
const MONTO_VALIDO = /^\d{1,8}(\.\d{1,2})?$/;

export const montoDeTarifaValido = (valor) => {
  if (typeof valor !== 'number' && typeof valor !== 'string') return false;
  if (typeof valor === 'number' && !Number.isFinite(valor)) return false;
  const texto = String(valor).trim();
  if (!MONTO_VALIDO.test(texto)) return false;
  const numero = Number(texto);
  return numero > 0 && numero <= MONTO_MAXIMO_TARIFA;
};

export const validacionTarifa = [
  body('monto')
    .exists({ checkNull: true }).withMessage('El monto es obligatorio.')
    .custom(montoDeTarifaValido)
    .withMessage(`El monto debe ser un número mayor a 0, con hasta 2 decimales y de hasta $${MONTO_MAXIMO_TARIFA.toLocaleString('es-AR')}.`),

  validarResultado
];
