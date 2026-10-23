export const EMAIL_CAPYMEF = "info@capymef.ar";
export const LARGO_MAXIMO_SOLICITUD = 1000;

/**
 * Mismas restricciones que las columnas del modelo User (telefono STRING(20), localidad STRING(100)).
 * El PUT /auth/perfil no valida en el backend, así que se valida acá antes de enviar.
 * Devuelve el mensaje de error o "" si está todo bien.
 */
export function validarContacto({ telefono, localidad }) {
  if (!/^[+\d\s()-]{6,20}$/.test(telefono)) return "Ingresá un teléfono válido (solo números, espacios, +, - o paréntesis; entre 6 y 20 caracteres).";
  if (!/^[\p{L}\s.'-]{2,100}$/u.test(localidad)) return "Ingresá una localidad válida (solo letras; entre 2 y 100 caracteres).";
  return "";
}
