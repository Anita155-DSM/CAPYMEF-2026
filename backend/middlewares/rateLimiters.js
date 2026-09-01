import rateLimit from 'express-rate-limit';

export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos permitidos
  message: {
    exito: false,
    mensaje: "Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intentá de nuevo en 15 minutos."
  }
});