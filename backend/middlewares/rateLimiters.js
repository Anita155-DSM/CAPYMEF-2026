import rateLimit from 'express-rate-limit';

export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos permitidos
  message: {
    exito: false,
    mensaje: "Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intentá de nuevo en 15 minutos."
  }
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