export const EMAIL_CAPYMEF = "info@capymef.ar";
export const LARGO_MAXIMO_SOLICITUD = 1000;

/**
 * Misma restricción que la columna del modelo User (telefono STRING(20)).
 * El PUT /auth/perfil no valida en el backend, así que se valida acá antes de enviar.
 * Devuelve el mensaje de error o "" si está todo bien.
 */
export function validarTelefono(telefono) {
  if (!/^[+\d\s()-]{6,20}$/.test(telefono)) return "Ingresá un teléfono válido (solo números, espacios, +, - o paréntesis; entre 6 y 20 caracteres).";
  return "";
}
