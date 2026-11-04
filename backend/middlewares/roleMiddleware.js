import { CODIGOS_AUTH } from './codigosAuth.js';

// Middleware para verificar si el usuario es Administrador
export const verificarAdmin = (req, res, next) => {
  try {
    // Asumimos que tu middleware "verificarToken" guardó los datos del token en req.usuario
    const usuario = req.usuario;

    // Verificamos si el rol no es ADMIN 
    if (!usuario || usuario.rol !== 'admin') {
      // SIN_PERMISOS: la sesión es válida, así que el frontend NO debe cerrarla por este 403.
      return res.status(403).json({
        exito: false,
        mensaje: "Acceso denegado. Se requieren permisos de Administrador para realizar esta acción.",
        codigo: CODIGOS_AUTH.SIN_PERMISOS
      });
    }

    // Si es administrador, lo dejamos pasar al controlador
    next();
  } catch (error) {
    console.error("Error en verificarAdmin:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error interno al verificar permisos."
    });
  }
};