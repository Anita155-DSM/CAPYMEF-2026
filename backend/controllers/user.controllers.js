import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
//import fs from 'fs'; YA NO LO USAMOS 
import { User } from '../models/user.models.js';

const JWT_SECRET = process.env.JWT_SECRET;
// ==========================================
// NUEVA Función auxiliar para borrar de la NUBE
// ==========================================
const eliminarArchivoNube = async (public_id) => {
  if (public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error al borrar archivo de Cloudinary:', error);
    }
  }
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
      eliminarArchivoNube(constanciaFile.path); // Borramos el archivo subido para no ocupar espacio
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
    if (constanciaFile) eliminarArchivoNube(constanciaFile.path);
    console.error('Error al registrar solicitud de socio:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2. INICIO DE SESIÓN (LOGIN)
// ==========================================
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar al usuario
    const usuario = await User.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

    // Validar Contraseña
    const passwordEsCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordEsCorrecta) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

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

    // Buscamos al usuario excluyendo la contraseña por seguridad
    const usuario = await User.findByPk(usuarioId, {
      attributes: { exclude: ['password'] }
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
    
    // 1. Agregamos los 3 nuevos campos a la extracción
    const { 
      telefono, 
      localidad, 
      rubro, 
      actividad, 
      tamano_empresa 
    } = req.body; 

    const usuario = await User.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    // 2. Actualizamos si los envían desde el Frontend
    if (telefono) usuario.telefono = telefono;
    if (localidad) usuario.localidad = localidad;
    if (rubro) usuario.rubro = rubro;
    if (actividad) usuario.actividad = actividad;
    if (tamano_empresa) usuario.tamano_empresa = tamano_empresa;

    await usuario.save(); // Sequelize guarda los cambios en PostgreSQL

    // 3. Adaptamos el mensaje de auditoría (ya que ahora no es solo contacto)
    req.auditoriaMensaje = `El usuario actualizó los datos de su perfil comercial/contacto`;
    req.auditoriaCodigo = 'UPDATE_MI_PERFIL';

    res.status(200).json({ 
      exito: true, 
      mensaje: 'Perfil actualizado correctamente.',
      // 4. Devolvemos los datos actualizados al Frontend
      data: {
        telefono: usuario.telefono,
        localidad: usuario.localidad,
        rubro: usuario.rubro,
        actividad: usuario.actividad,
        tamano_empresa: usuario.tamano_empresa
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};