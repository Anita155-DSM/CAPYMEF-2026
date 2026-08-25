import rateLimit from 'express-rate-limit';

export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos permitidos
  message: {
    exito: false,
    mensaje: "Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intentá de nuevo en 15 minutos."
  }
});

// Evita que alguien mande cientos de mails de recuperación seguidos (spam / abuso)
export const limitadorRecuperacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Solo 3 solicitudes de recuperación por IP cada 15 minutos
  message: {
    exito: false,
    mensaje: "Demasiadas solicitudes de recuperación. Intentá de nuevo en 15 minutos."
  }
});