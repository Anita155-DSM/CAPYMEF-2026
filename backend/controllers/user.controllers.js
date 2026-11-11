import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import { User } from '../models/user.models.js';
import { enviarMailRecuperacion } from '../config/mailer.js';
import { Auditoria } from '../models/auditoria.models.js';
import { CODIGOS_AUTH } from '../middlewares/codigosAuth.js';
import { notificarAdmins } from '../services/notificacion.service.js';
import {
  consultarBloqueo,
  registrarIntentoFallido,
  limpiarIntentos,
  normalizarEmail,
  MAXIMO_INTENTOS_FALLIDOS,
  DURACION_BLOQUEO_MS,
} from '../services/intentosLogin.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Función auxiliar para borrar archivos subidos si falla el registro
const eliminarArchivo = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Reglas de contraseña para el restablecimiento. DEBEN ser las mismas que en el registro
// (user.validator.js -> validacionRegistro). Antes acá se pedían solo 6 caracteres, y alguien
// podía "recuperar" su cuenta con una clave más débil que la que le exigimos al registrarse.
// Devuelve el mensaje de error, o null si la contraseña es válida.
const validarFortalezaPassword = (password) => {
  if (typeof password !== 'string' || password.length === 0) return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/\d/.test(password)) return 'La contraseña debe contener al menos un número.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula.';
  return null;
};

// ==========================================
// 1. REGISTRO DE SOLICITUD DE SOCIO
// ==========================================
export const registrarUsuario = async (req, res) => {
  const constanciaFile = req.file; // Archivo subido mediante Multer

  try {
    // Extraemos todos los campos, incluyendo los nuevos del Estatuto
    const { razonSocial, cuit, email, password, telefono, localidad, categoria, rubro, actividad, tamano_empresa } = req.body;

    // A. Validar comprobante AFIP/DGR (express-validator valida texto, nosotros validamos el archivo acá)
    if (!constanciaFile) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe adjuntar el archivo comprobante de AFIP/DGR.',
      });
    }

    // B. Verificar si Email o CUIT ya existen en la base de datos
    const usuarioExistente = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [{ email }, { cuit }]
      }
    });

    if (usuarioExistente) {
      eliminarArchivo(constanciaFile.path); // Borramos el archivo subido para no ocupar espacio
      const mensaje = usuarioExistente.email === email 
        ? 'El correo electrónico ya se encuentra registrado.' 
        : 'El CUIT ingresado ya se encuentra registrado.';
        
      return res.status(400).json({ exito: false, mensaje });
    }

    // C. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // D. Crear el registro en PostgreSQL con todos los datos
    const nuevoUsuario = await User.create({
      razonSocial,
      cuit,
      email,
      password: passwordHash,
      telefono,                 // NUEVO
      localidad,                // NUEVO
      categoria: categoria || 'adherente', // NUEVO (Por defecto adherente si no envían nada)
      rubro,             // NUEVO
      actividad,         // NUEVO
      tamano_empresa,    // NUEVO
      constanciaUrl: constanciaFile.path,
      estado: 'pendiente',      // Queda pendiente de aprobación
      rol: 'socio'
    });

    //auditoria
    req.auditoriaMensaje = `Nueva solicitud de registro recibida de la empresa ${razonSocial} (CUIT: ${cuit})`;
    req.auditoriaCodigo = 'REGISTRO_SOCIO_SOLICITUD';

    res.status(201).json({
      exito: true,
      mensaje: 'Solicitud enviada correctamente. Queda pendiente de revisión por la administración.',
      data: {
        id: nuevoUsuario.id,
        razonSocial: nuevoUsuario.razonSocial,
        cuit: nuevoUsuario.cuit,
        email: nuevoUsuario.email,
        categoria: nuevoUsuario.categoria,
        estado: nuevoUsuario.estado,
      },
    });
  } catch (error) {
    if (constanciaFile) eliminarArchivo(constanciaFile.path);
    console.error('Error al registrar solicitud de socio:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};


// ==========================================
// Intentos fallidos de login (ver services/intentosLogin.service.js)
// ==========================================
// Suma el intento fallido, avisa si con este intento el email quedó bloqueado y responde el 401 de siempre.
// El 401 es el mismo exista o no la cuenta, y el intento que provoca el bloqueo todavía responde 401 (recién el
// siguiente recibe el 429).
const responderCredencialesInvalidas = async (req, res, email) => {
  const intento = registrarIntentoFallido(email);
  if (intento.bloqueadoAhora) await avisarBloqueoDeLogin(req, email, intento.bloqueadoHasta);
  return res.status(401).json({
    exito: false,
    mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
  });
};

// Deja constancia del bloqueo en la auditoría y avisa a los admins. Se registra a mano porque el interceptor de
// auditoría solo guarda las respuestas exitosas (2xx), y esta es un 401. Nunca se guarda la contraseña.
// Nunca lanza error: si la auditoría o el aviso fallan, el bloqueo ya quedó hecho y el login responde igual.
const avisarBloqueoDeLogin = async (req, email, bloqueadoHasta) => {
  const emailNormalizado = normalizarEmail(email);
  const ip = req.ip || req.socket?.remoteAddress || null;
  const minutos = Math.round(DURACION_BLOQUEO_MS / 60000);
  const descripcion = `Se bloqueó el inicio de sesión de ${emailNormalizado} por ${minutos} minutos tras ${MAXIMO_INTENTOS_FALLIDOS} intentos fallidos (última IP: ${ip || 'desconocida'}).`;

  try {
    await Auditoria.create({
      usuarioId: null,
      usuarioNombre: emailNormalizado.slice(0, 100), // la columna es de 100 caracteres
      usuarioRol: 'ANONIMO',
      modulo: 'AUTH',
      accionTipo: 'BLOQUEO',
      codigoTecnico: 'LOGIN_BLOQUEADO',
      descripcion,
      ipAddress: ip ? String(ip).slice(0, 45) : null,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    console.error('No se pudo registrar en la auditoría el bloqueo de login:', error.message);
  }

  // La referencia identifica ESTE bloqueo (email + momento en que vence): si por algo se llamara dos veces, no se
  // duplica el aviso; un bloqueo posterior del mismo email sí avisa de nuevo. El email va resumido en un hash
  // porque la columna referencia es de 120 caracteres y un email puede ser largo.
  const huellaEmail = crypto.createHash('sha256').update(emailNormalizado).digest('hex').slice(0, 16);
  await notificarAdmins({
    tipo: 'login_bloqueado',
    titulo: 'Inicio de sesión bloqueado por intentos fallidos',
    mensaje: descripcion,
    referencia: `login-bloqueado:${huellaEmail}:${bloqueadoHasta}`,
  });
};

// ==========================================
// 2. INICIO DE SESIÓN (LOGIN)
// ==========================================
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email bloqueado por intentos fallidos: se corta ACÁ, antes de buscar la cuenta y de comparar la contraseña.
    // Así, durante el bloqueo, probar contraseñas no sirve de nada (ni la correcta entra) y la respuesta es la
    // misma exista o no el email.
    const bloqueo = consultarBloqueo(email);
    if (bloqueo.bloqueado) {
      res.set('Retry-After', String(bloqueo.segundosRestantes));
      return res.status(429).json({
        exito: false,
        mensaje: `Demasiados intentos fallidos. Probá de nuevo en ${bloqueo.minutosRestantes} ${bloqueo.minutosRestantes === 1 ? 'minuto' : 'minutos'}.`,
        codigo: CODIGOS_AUTH.CUENTA_BLOQUEADA_TEMPORALMENTE,
      });
    }

    // Buscar al usuario
    const usuario = await User.findOne({ where: { email } });

    if (!usuario) {
      // Un email que no existe cuenta igual que una contraseña incorrecta: si no se contara, que un email nunca
      // se bloquee delataría que no está registrado.
      return await responderCredencialesInvalidas(req, res, email);
    }

    // Validar Contraseña
    const passwordEsCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordEsCorrecta) {
      return await responderCredencialesInvalidas(req, res, email);
    }

    // Credenciales correctas: se borra el contador de fallidos de este email. Se hace acá (y no recién al final)
    // porque quien sabe la contraseña ya demostró que no está adivinando, aunque su cuenta esté pendiente o
    // inactiva y no pueda entrar por eso (esos 403 no cuentan como intento fallido).
    limpiarIntentos(email);

    // Validar Estado de la Cuenta
    if (usuario.estado === 'pendiente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu solicitud de registro está siendo revisada por la administración de CAPYMEF.',
      });
    }

    if (usuario.estado === 'rechazado') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu solicitud de registro fue rechazada. Ponete en contacto con la administración.',
      });
    }

    // Antes un usuario 'inactivo' (dado de baja por la administración) pasaba los controles
    // de arriba y podía iniciar sesión. Ahora solo entra quien está 'aprobado': el bloqueo
    // específico da un mensaje claro y el último chequeo cubre cualquier estado nuevo que se
    // agregue en el futuro sin acordarse de venir a tocar el login.
    if (usuario.estado === 'inactivo') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta se encuentra inactiva. Ponete en contacto con la administración.',
      });
    }

    if (usuario.estado !== 'aprobado') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Tu cuenta no está habilitada para iniciar sesión.',
      });
    }

    // Generar JWT incluyendo la categoría para que el Frontend sepa qué cobrarle
    const tokenPayload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      categoria: usuario.categoria // Agregamos la categoría al token
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    //auditoria
    req.auditoriaMensaje = `El usuario ${usuario.razonSocial} (${usuario.email}) inició sesión con éxito`;
    req.auditoriaCodigo = 'LOGIN_SUCCESS';

    res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        razonSocial: usuario.razonSocial,
        cuit: usuario.cuit,
        email: usuario.email,
        telefono: usuario.telefono,
        categoria: usuario.categoria,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 3. OBTENER PERFIL DEL USUARIO LOGUEADO
// ==========================================
export const obtenerPerfil = async (req, res) => {
  try {
    // El id viene del token gracias a tu middleware verificarToken
    const usuarioId = req.usuario.id; 

    // Buscamos al usuario sin datos internos de seguridad. Antes solo se excluía la contraseña
    // y la respuesta incluía resetPasswordToken y resetPasswordExpires (el frontend no los usa).
    const usuario = await User.findByPk(usuarioId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    res.status(200).json({ exito: true, data: usuario });
  } catch (error) {
    console.error('Error al obtener perfil:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 4. ACTUALIZAR DATOS DEL PERFIL
// ==========================================
export const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    // Extraemos SOLAMENTE los campos que está permitido editar
    const { telefono, localidad } = req.body; 

    const usuario = await User.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    // Actualizamos solo los campos de contacto
    if (telefono) usuario.telefono = telefono;
    if (localidad) usuario.localidad = localidad;

    await usuario.save(); // Sequelize guarda los cambios en PostgreSQL

    //auditoria
    req.auditoriaMensaje = `El usuario actualizó sus datos de contacto (Teléfono/Localidad)`;
    req.auditoriaCodigo = 'UPDATE_MI_PERFIL';

    res.status(200).json({ 
      exito: true, 
      mensaje: 'Perfil actualizado correctamente.',
      data: {
        telefono: usuario.telefono,
        localidad: usuario.localidad
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 5. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ==========================================
export const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await User.findOne({ where: { email } });

    // Respuesta genérica SIEMPRE, exista o no el usuario — así no revelamos
    // por este medio qué emails están registrados en el sistema.
    const mensajeGenerico = 'Si el correo está registrado, vas a recibir un mail con instrucciones para restablecer tu contraseña.';

    if (!usuario) {
      return res.status(200).json({ exito: true, mensaje: mensajeGenerico });
    }

    // Generamos un token aleatorio: la versión plana va por mail (nunca se guarda),
    // la versión hasheada (SHA-256) es la que se guarda en la base.
    const tokenPlano = crypto.randomBytes(32).toString('hex');
    const tokenHasheado = crypto.createHash('sha256').update(tokenPlano).digest('hex');

    usuario.resetPasswordToken = tokenHasheado;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // vence en 1 hora
    await usuario.save();

    // No bloqueamos la respuesta si el mail tarda o falla — el usuario ya recibió
    // la confirmación, y un error de SMTP no debería tirar un 500 acá.
    try {
      await enviarMailRecuperacion(usuario.email, tokenPlano);
    } catch (errorMail) {
      console.error('Error al enviar mail de recuperación:', errorMail.message);
    }

    //auditoria
    req.auditoriaMensaje = `Se solicitó recuperación de contraseña para ${usuario.email}`;
    req.auditoriaCodigo = 'SOLICITUD_RECUPERACION_PASSWORD';

    res.status(200).json({ exito: true, mensaje: mensajeGenerico });
  } catch (error) {
    console.error('Error al solicitar recuperación:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 6. RESTABLECER CONTRASEÑA CON TOKEN
// ==========================================
export const restablecerPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const errorPassword = validarFortalezaPassword(password);
    if (errorPassword) {
      return res.status(400).json({ exito: false, mensaje: errorPassword });
    }

    // Hasheamos el token recibido para compararlo contra el que guardamos en la base
    // (nunca guardamos el token en texto plano, así que comparamos hash contra hash).
    const tokenHasheado = crypto.createHash('sha256').update(token).digest('hex');

    const usuario = await User.findOne({
      where: {
        resetPasswordToken: tokenHasheado,
        resetPasswordExpires: { [User.sequelize.Sequelize.Op.gt]: new Date() } // no vencido
      }
    });

    if (!usuario) {
      return res.status(400).json({ exito: false, mensaje: 'El link de recuperación es inválido o ya venció.' });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    // Marca el momento del cambio: verificarToken rechaza cualquier sesión abierta antes de este instante.
    usuario.passwordChangedAt = new Date();
    await usuario.save();
    // Quien restablece la contraseña por mail demostró ser el dueño del email: se levanta el bloqueo por
    // intentos fallidos, si lo tenía, para que pueda entrar enseguida con la contraseña nueva.
    limpiarIntentos(usuario.email);

    //auditoria
    req.auditoriaMensaje = `El usuario ${usuario.email} restableció su contraseña`;
    req.auditoriaCodigo = 'RESTABLECER_PASSWORD';

    res.status(200).json({ exito: true, mensaje: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};