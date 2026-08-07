import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// 1. REGISTRO DE SOLICITUD DE SOCIO
// ==========================================
export const registrarUsuario = async (req, res) => {
  try {
    const { razonSocial, cuit, email, password } = req.body;
    const constanciaFile = req.file; // Archivo subido mediante Multer

    // A. Validar campos obligatorios de texto
    if (!razonSocial || !cuit || !email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos de texto (Razón Social, CUIT, Email y Contraseña) son obligatorios.',
      });
    }

    // B. Validar que se haya adjuntado el comprobante AFIP/DGR
    if (!constanciaFile) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe adjuntar el archivo comprobante de AFIP/DGR.',
      });
    }

    // C. Verificar si el email o el CUIT ya están registrados
    const emailExistente = await User.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El correo electrónico ya se encuentra registrado.',
      });
    }

    const cuitExistente = await User.findOne({ where: { cuit } });
    if (cuitExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El CUIT ingresado ya se encuentra registrado.',
      });
    }

    // D. Encriptar la contraseña (Hash)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // E. Crear el registro en PostgreSQL
    const nuevoUsuario = await User.create({
      razonSocial,
      cuit,
      email,
      password: passwordHash,
      constanciaUrl: constanciaFile.path, // Guarda la ruta local del archivo
      estado: 'pendiente',                 // Queda pendiente para revisión manual
      rol: 'socio'
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Solicitud enviada correctamente. Queda pendiente de revisión por la administración.',
      data: {
        id: nuevoUsuario.id,
        razonSocial: nuevoUsuario.razonSocial,
        cuit: nuevoUsuario.cuit,
        email: nuevoUsuario.email,
        estado: nuevoUsuario.estado,
      },
    });
  } catch (error) {
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

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son obligatorios.',
      });
    }

    // A. Buscar al usuario en la BD mediante Sequelize
    const usuario = await User.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

    // B. Comparar la contraseña enviada con el HASH almacenado
    const passwordEsCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordEsCorrecta) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

    // C. Verificar estado de aprobación por administración
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

    // D. Generar el Token JWT
    const tokenPayload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '8h',
    });

    // E. Responder al Frontend
    res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        razonSocial: usuario.razonSocial,
        cuit: usuario.cuit,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};