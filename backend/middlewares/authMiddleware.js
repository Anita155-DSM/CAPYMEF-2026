import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Un token firmado solo prueba que el usuario se logueó en algún momento de las últimas 8 horas,
// no que su cuenta siga habilitada. Antes, un socio dado de baja (estado 'inactivo') seguía
// usando el sistema hasta que su token venciera. Ahora, además de verificar la firma, se consulta
// la base: la cuenta tiene que existir y estar 'aprobado'.
// De paso, rol y categoría se toman de la base y no del token: si la categoría cambia (por ejemplo
// Activo -> Adherente por deuda) el cambio vale desde la próxima petición, sin esperar un nuevo login.
// Devuelve el usuario actualizado para armar req.usuario, o null si la cuenta no puede operar.
const cargarUsuarioHabilitado = async (decodificado) => {
  const usuario = await User.findByPk(decodificado.id, {
    attributes: ['id', 'email', 'rol', 'estado', 'categoria'],
  });

  if (!usuario) return { usuario: null, motivo: 'La cuenta ya no existe.' };
  if (usuario.estado !== 'aprobado') return { usuario: null, motivo: 'Tu cuenta no está habilitada.' };

  return {
    usuario: {
      ...decodificado,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      categoria: usuario.categoria,
    },
    motivo: null,
  };
};

export const verificarToken = async (req, res, next) => {
  // El token se envía normalmente en la cabecera "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. No se proporcionó un token de sesión.',
    });
  }

  // Se separan los dos tipos de falla: un token inválido es 403, pero un error de base de datos
  // (por ejemplo, un corte momentáneo) es 500. Así no se le cierra la sesión a nadie por un problema nuestro.
  let decodificado;
  try {
    decodificado = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
    });
  }

  try {
    const { usuario, motivo } = await cargarUsuarioHabilitado(decodificado);

    if (!usuario) {
      return res.status(403).json({ exito: false, mensaje: motivo });
    }

    req.usuario = usuario; // Adjuntamos los datos del usuario a la petición
    next(); // Continuar a la ruta protegida
  } catch (error) {
    console.error('Error al verificar la cuenta del token:', error.message);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al verificar la sesión.',
    });
  }
};

// Versión "opcional" de verificarToken: si viene un token válido, decodifica
// y adjunta req.usuario (igual que verificarToken). Si no viene token, o es
// inválido, NO bloquea la petición — simplemente sigue sin req.usuario.
// Pensado para rutas públicas que quieren dar más información SI hay un
// admin/socio autenticado, sin exigir login a todo el mundo.
export const verificarTokenOpcional = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // sin token, seguimos como visitante anónimo
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    // Mismo control que en verificarToken: un token de una cuenta dada de baja no debe dar
    // acceso a la información extra que ven los usuarios logueados. Si la cuenta no está
    // habilitada, se sigue como visitante anónimo.
    const { usuario } = await cargarUsuarioHabilitado(decodificado);
    if (usuario) req.usuario = usuario;
  } catch (error) {
    // Token presente pero inválido/vencido (o falla al consultar la base): lo ignoramos
    // silenciosamente, no rechazamos la petición (a diferencia de verificarToken).
  }

  next();
};