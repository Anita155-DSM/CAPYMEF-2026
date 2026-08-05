import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// SECRET para firmar tokens (debe estar en tu archivo .env)
const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// 1. REGISTRO DE USUARIO
// ==========================================
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // A. Validar que no falten campos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son obligatorios.',
      });
    }

    // B. Verificar si el usuario ya existe
    const usuarioExistente = await query(
      'SELECT id FROM usuario WHERE email = $1;',
      [email]
    );

    if (usuarioExistente.rowCount > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El correo electrónico ya está registrado.',
      });
    }

    // C. Encriptar la contraseña (Hash)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // D. Guardar en PostgreSQL (NUNCA guardamos la contraseña plana)
    const nuevoUsuario = await query(
      `INSERT INTO usuario (nombre, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email, rol, creado_en;`,
      [nombre, email, passwordHash]
    );

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado correctamente',
      data: nuevoUsuario.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
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

    // A. Buscar al usuario en la base de datos
    const result = await query(
      'SELECT * FROM usuario WHERE email = $1;',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

    const usuario = result.rows[0];

    // B. Comparar la contraseña enviada con el HASH almacenado en PostgreSQL
    const passwordEsCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordEsCorrecta) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas (usuario o contraseña incorrectos).',
      });
    }

    // C. Generar el Token JWT para mantener la sesión activa
    const tokenPayload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '8h', // El token expira en 8 horas
    });

    // D. Responder al Frontend excluyendo la contraseña
    res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};