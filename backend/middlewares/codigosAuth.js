// ==========================================
// Códigos de las respuestas de error de autenticación y permisos
// ==========================================
// Por qué existen: el frontend decidía si cerrar la sesión leyendo el TEXTO del mensaje (si decía
// "token"). Pero verificarToken también responde 403 con otros textos (cuenta dada de baja, contraseña
// cambiada...) y en esos casos el usuario quedaba adentro con todo fallando. Al revés, un 403 por falta
// de permisos (un socio entrando a algo de admin) NO debe cerrar la sesión. Con un código fijo el
// frontend decide sin depender de cómo esté redactado el mensaje, que puede cambiar.
//
// Regla para el frontend:
//   - SIN_SESION, TOKEN_INVALIDO o SESION_INVALIDA → cerrar la sesión y mandar al login.
//   - SIN_PERMISOS → NO cerrar la sesión: la sesión es válida, solo no puede hacer eso.
//   - CUENTA_BLOQUEADA_TEMPORALMENTE → NO cerrar la sesión (llega en el login, donde todavía no hay una):
//     mostrar el mensaje, que dice cuántos minutos faltan.
export const CODIGOS_AUTH = Object.freeze({
  SIN_SESION: 'SIN_SESION', // no se mandó ningún token (401)
  TOKEN_INVALIDO: 'TOKEN_INVALIDO', // token mal firmado, roto o vencido (403)
  SESION_INVALIDA: 'SESION_INVALIDA', // token bien firmado, pero la cuenta ya no existe, no está habilitada o cambió la contraseña (403)
  SIN_PERMISOS: 'SIN_PERMISOS', // sesión válida, pero sin permiso para esta acción (403)
  CUENTA_BLOQUEADA_TEMPORALMENTE: 'CUENTA_BLOQUEADA_TEMPORALMENTE', // login bloqueado por intentos fallidos (429)
});
