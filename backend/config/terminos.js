// ==========================================
// Términos y condiciones: versión vigente y si su aceptación es obligatoria
// ==========================================
// Por qué existe: por relevancia legal hay que poder demostrar QUÉ términos aceptó cada socio y CUÁNDO. La
// versión la define el backend (nunca el cliente) y la fecha la pone el servidor al registrar la cuenta.

// Versión vigente de los términos. Tiene que cambiar cada vez que cambie el texto de
// frontend/src/features/auth/data/terminos.js (ese archivo hoy no tiene versión ni fecha: se usa el mes en que
// se empezó a registrar la aceptación). Cada socio queda con la versión que aceptó al registrarse.
export const VERSION_TERMINOS = '2026-11';

export const MENSAJE_TERMINOS_OBLIGATORIOS = 'Tenés que aceptar los términos y condiciones para registrarte.';

// ¿El registro exige la aceptación? Hoy el frontend muestra el checkbox pero todavía no le manda el campo al
// backend: si se exigiera ya, nadie se podría registrar. Por eso se activa con la variable de entorno
// TERMINOS_OBLIGATORIOS=true en el .env, cuando el frontend mande "aceptaTerminos". Sin la variable rige el modo
// transitorio (se registra igual, sin fecha ni versión), salvo en los tests, donde por defecto es obligatoria.
// Se lee en cada registro (no al cargar el módulo), así un cambio en el .env rige con solo reiniciar el servidor.
export const terminosObligatorios = () => {
  const valor = process.env.TERMINOS_OBLIGATORIOS;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return process.env.NODE_ENV === 'test';
};

// ¿El body trae la aceptación explícita? El registro llega como multipart/form-data (por la constancia), donde
// todo viaja como texto: se acepta true o "true", y nada más (ni "1", ni "si", ni un checkbox vacío).
export const aceptoLosTerminos = (valor) => valor === true || valor === 'true';
