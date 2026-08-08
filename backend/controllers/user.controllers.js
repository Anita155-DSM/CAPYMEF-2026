import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { User } from '../models/user.models.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Función auxiliar para borrar archivos subidos si falla el registro
const eliminarArchivo = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==========================================
// 1. REGISTRO DE SOLICITUD DE SOCIO
// ==========================================
export const registrarUsuario = async (req, res) => {
  const constanciaFile = req.file; // Archivo subido mediante Multer

  try {
    const { razonSocial, cuit, email, password } = req.body;

    // A. Validar campos obligatorios de texto
    if (!razonSocial || !cuit || !email || !password) {
      if (constanciaFile) eliminarArchivo(constanciaFile.path);
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos de texto (Razón Social, CUIT, Email y Contraseña) son obligatorios.',
      });
    }

    // B. Validar comprobante AFIP/DGR
    if (!constanciaFile) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe adjuntar el archivo comprobante de AFIP/DGR.',
      });
    }

    // C. Verificar si Email o CUIT ya existen
    const usuarioExistente = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [{ email }, { cuit }]
      }
    });

    if (usuarioExistente) {
      eliminarArchivo(constanciaFile.path); // Borramos el archivo subido innecesariamente
      const mensaje = usuarioExistente.email === email 
        ? 'El correo electrónico ya se encuentra registrado.' 
        : 'El CUIT ingresado ya se encuentra registrado.';
        
      return res.status(400).json({ exito: false, mensaje });
    }

    // D. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // E. Crear el registro en PostgreSQL
    const nuevoUsuario = await User.create({
      razonSocial,
      cuit,
      email,
      password: passwordHash,
      constanciaUrl: constanciaFile.path,
      estado: 'pendiente',
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
    if (constanciaFile) eliminarArchivo(constanciaFile.path);
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

    // Generar JWT
    const tokenPayload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

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