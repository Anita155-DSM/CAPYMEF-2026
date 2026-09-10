import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const verificarToken = (req, res, next) => {
  // El token se envía normalmente en la cabecera "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. No se proporcionó un token de sesión.',
    });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    req.usuario = decodificado; // Adjuntamos los datos del usuario a la petición
    next(); // Continuar a la ruta protegida
  } catch (error) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
    });
  }
};

// Versión "opcional" de verificarToken: si viene un token válido, decodifica
// y adjunta req.usuario (igual que verificarToken). Si no viene token, o es
// inválido, NO bloquea la petición — simplemente sigue sin req.usuario.
// Pensado para rutas públicas que quieren dar más información SI hay un
// admin/socio autenticado, sin exigir login a todo el mundo.
export const verificarTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // sin token, seguimos como visitante anónimo
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    req.usuario = decodificado;
  } catch (error) {
    // Token presente pero inválido/vencido: lo ignoramos silenciosamente,
    // no rechazamos la petición (a diferencia de verificarToken).
  }

  next();
};