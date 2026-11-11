// ==========================================
// Bloqueo temporal del login por intentos fallidos (comportamiento sospechoso)
// ==========================================
// Por qué existe: los limitadores de rateLimiters.js cuentan por IP (y por IP + email). Alguien que pruebe
// contraseñas de UNA cuenta desde muchas IP distintas (una red de equipos, VPN, datos móviles) nunca llega al
// tope de ninguna IP. Este bloqueo cuenta por EMAIL, venga de donde venga el intento: 5 fallidos dentro de
// 15 minutos bloquean ese email por 15 minutos, aunque después llegue la contraseña correcta.
//
// Para no revelar qué emails están registrados, los intentos se cuentan igual para un email que no existe y la
// respuesta del bloqueo es la misma en los dos casos.
//
// Se guarda en memoria (un Map), sin tocar la base. Limitación: se borra al reiniciar el servidor y no se
// comparte entre varias instancias. Para el despliegue actual (una sola instancia) alcanza; ver el informe para
// pasarlo a la base si hiciera falta.

// 5 contraseñas mal en 15 minutos ya no es un error de tipeo: el socio que se olvidó la clave tiene la
// recuperación por mail, que además desbloquea (ver restablecerPassword).
export const MAXIMO_INTENTOS_FALLIDOS = 5;
// Solo se suman los fallidos de los últimos 15 minutos: los errores sueltos y espaciados no se acumulan.
export const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
// Cuánto dura el bloqueo. Lo suficiente para que probar contraseñas sea inviable (como mucho 5 cada 30 min).
export const DURACION_BLOQUEO_MS = 15 * 60 * 1000;
// Tope de emails guardados, para que alguien que mande miles de emails inventados no llene la memoria.
export const MAXIMO_EMAILS_EN_MEMORIA = 10000;
// Cada cuánto se recorren las entradas para borrar las vencidas (no en cada intento, para no recorrer todo).
const INTERVALO_LIMPIEZA_MS = 60 * 1000;

// email normalizado -> { fallidos: [momentos de los intentos fallidos], bloqueadoHasta: momento o null }
const registros = new Map();
let ultimaLimpieza = 0;

// Mismo email aunque venga con mayúsculas o espacios: si no, "Socio@x.com " y "socio@x.com" contarían aparte
// y se podría esquivar el bloqueo.
export const normalizarEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const estaBloqueado = (registro, ahora) => registro.bloqueadoHasta !== null && registro.bloqueadoHasta > ahora;
const fallidosVigentes = (registro, ahora) => registro.fallidos.filter((momento) => ahora - momento < VENTANA_INTENTOS_MS);

// Borra lo que ya no sirve: bloqueos vencidos sin intentos recientes. Si aun así se pasa del tope, borra primero
// los emails NO bloqueados más viejos: si se borraran los bloqueados, alguien podría inundar con emails
// inventados para "desbloquear" la cuenta que está atacando.
export const limpiarVencidos = (ahora = Date.now()) => {
  for (const [email, registro] of registros) {
    if (!estaBloqueado(registro, ahora) && fallidosVigentes(registro, ahora).length === 0) registros.delete(email);
  }
  if (registros.size > MAXIMO_EMAILS_EN_MEMORIA) {
    for (const [email, registro] of registros) {
      if (registros.size <= MAXIMO_EMAILS_EN_MEMORIA) break;
      if (!estaBloqueado(registro, ahora)) registros.delete(email);
    }
  }
  ultimaLimpieza = ahora;
};

const limpiarSiCorresponde = (ahora) => {
  if (ahora - ultimaLimpieza >= INTERVALO_LIMPIEZA_MS || registros.size > MAXIMO_EMAILS_EN_MEMORIA) limpiarVencidos(ahora);
};

// ¿Este email está bloqueado ahora? Devuelve { bloqueado, minutosRestantes, segundosRestantes }.
export const consultarBloqueo = (email, ahora = Date.now()) => {
  const registro = registros.get(normalizarEmail(email));
  if (!registro || !estaBloqueado(registro, ahora)) return { bloqueado: false };
  const segundosRestantes = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
  return { bloqueado: true, segundosRestantes, minutosRestantes: Math.ceil(segundosRestantes / 60) };
};

// Suma un intento fallido. Devuelve { bloqueadoAhora: true, bloqueadoHasta } si con este intento el email
// quedó bloqueado (para avisar una sola vez), o { bloqueadoAhora: false, intentos }.
export const registrarIntentoFallido = (email, ahora = Date.now()) => {
  limpiarSiCorresponde(ahora);
  const clave = normalizarEmail(email);
  if (!clave) return { bloqueadoAhora: false, intentos: 0 };

  const registro = registros.get(clave) ?? { fallidos: [], bloqueadoHasta: null };
  if (estaBloqueado(registro, ahora)) return { bloqueadoAhora: false, intentos: registro.fallidos.length };

  registro.fallidos = [...fallidosVigentes(registro, ahora), ahora];
  if (registro.fallidos.length >= MAXIMO_INTENTOS_FALLIDOS) {
    // Al bloquear se empieza de cero: cuando termine el bloqueo, el socio vuelve a tener sus 5 intentos.
    registro.fallidos = [];
    registro.bloqueadoHasta = ahora + DURACION_BLOQUEO_MS;
    registros.set(clave, registro);
    return { bloqueadoAhora: true, bloqueadoHasta: registro.bloqueadoHasta };
  }
  registros.set(clave, registro);
  return { bloqueadoAhora: false, intentos: registro.fallidos.length };
};

// Borra el contador de un email (login exitoso o contraseña restablecida).
export const limpiarIntentos = (email) => {
  registros.delete(normalizarEmail(email));
};

// Solo para los tests: vuelve a empezar sin ningún intento guardado.
export const reiniciarIntentosLogin = () => {
  registros.clear();
  ultimaLimpieza = 0;
};

// Solo para los tests: cuántos emails hay guardados.
export const cantidadEmailsEnMemoria = () => registros.size;
