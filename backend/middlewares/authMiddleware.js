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