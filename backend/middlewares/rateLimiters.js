import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// El login usa DOS limitadores encadenados, y los dos cuentan SOLO los intentos fallidos
// (skipSuccessfulRequests: una respuesta < 400 no suma). Antes un único limitador por IP contaba
// también los logins correctos: un socio que entraba y salía 5 veces quedaba bloqueado sin haberse
// equivocado nunca, y como varios socios pueden compartir IP (oficina, instituto, wifi público),
// uno que fallaba 5 veces bloqueaba a todos los demás.
// - limitadorLoginPorIp: tope amplio por IP, para frenar a quien pruebe muchos emails desde una máquina.
// - limitadorLoginPorCuenta: tope estricto por IP + email, para frenar a quien adivine la contraseña de una cuenta.
const mensajeDemasiadosIntentos = {
  exito: false,
  mensaje: "Demasiados intentos fallidos. Por favor, intentá de nuevo en 15 minutos."
};

export const limitadorLoginPorIp = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 fallos por IP, sumando todos los emails
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensajeDemasiadosIntentos
});

export const limitadorLoginPorCuenta = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 fallos por combinación IP + email
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // El limitador corre antes que las validaciones, así que el body puede venir con cualquier cosa
  // (un objeto, un array): solo se usa el email si es texto, y si no la clave queda con el email vacío.
  // ipKeyGenerator agrupa las IPv6 por subred, para que no se esquive el límite cambiando de dirección.
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${ipKeyGenerator(req.ip)}|${email}`;
  },
  message: mensajeDemasiadosIntentos
});

// Limita cuántas veces se puede pedir el mail de recuperación, para evitar
// que alguien spamee de mails a un socio o intente enumerar emails registrados.
export const limitadorRecuperacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Solo 3 solicitudes de recuperación
  message: {
    exito: false,
    mensaje: "Demasiadas solicitudes de recuperación de contraseña. Intentá de nuevo en 15 minutos."
  }
});

// Limita los intentos de restablecer la contraseña con un token. Adivinar un token es inviable,
// pero sin límite cualquiera puede martillar la ruta sin costo (cada intento consulta la base);
// 10 intentos dan margen a un socio que se equivoca al escribir la contraseña nueva.
export const limitadorRestablecer = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    exito: false,
    mensaje: "Demasiados intentos. Por favor, intentá de nuevo en 15 minutos."
  }
});