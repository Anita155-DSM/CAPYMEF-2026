import fs from 'fs';
import { Op } from 'sequelize';
import { Noticia } from '../models/noticia.models.js';

// Función auxiliar para eliminar archivos
const eliminarArchivo = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==========================================
// 1. OBTENER NOTICIAS PARA LA LANDING (Públicas)
// ==========================================
export const obtenerNoticiasLanding = async (req, res) => {
  try {
    const noticias = await Noticia.findAll({
      where: {
        estado: 'publicado',
        visibilidad: { [Op.in]: ['publico', 'todos'] }
      },
      order: [['fechaPublicacion', 'DESC']],
    });

    res.status(200).json({ exito: true, data: noticias });
  } catch (error) {
    console.error('Error al obtener noticias para la landing:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2. OBTENER NOTICIAS PARA SOCIOS (Protegida)
// ==========================================
export const obtenerNoticiasSocios = async (req, res) => {
  try {
    const noticias = await Noticia.findAll({
      where: {
        estado: 'publicado',
        visibilidad: { [Op.in]: ['socios', 'todos'] }
      },
      order: [['fechaPublicacion', 'DESC']],
    });

    res.status(200).json({ exito: true, data: noticias });
  } catch (error) {
    console.error('Error al obtener noticias para socios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};
// ==========================================
// 3. OBTENER NOTICIAS PARA ADMINS (ocultos y publicos)
// ==========================================
export const obtenerTodasLasNoticiasAdmin = async (req, res) => {
  try {
    // Volvemos a forzar el ordenamiento por la fecha original de publicación
    const noticias = await Noticia.findAll({
      order: [['fechaPublicacion', 'DESC']]
    });

    return res.status(200).json({
      exito: true,
      data: noticias
    });
  } catch (error) {
    console.error("ERROR CRÍTICO EN obtenerTodasLasNoticiasAdmin:", error);
    return res.status(500).json({
      exito: false,
      mensaje: "Error interno del servidor al cargar las noticias."
    });
  }
};
// ==========================================
// 4. OBTENER UNA NOTICIA POR ID
// ==========================================
export const obtenerNoticiaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({ exito: false, mensaje: 'Noticia no encontrada.' });
    }

    res.status(200).json({ exito: true, data: noticia });
  } catch (error) {
    console.error('Error al obtener la noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 5. CREAR NOTICIA (Admin)
// ==========================================
export const crearNoticia = async (req, res) => {
  const imagenFile = req.file;

  try {
    const { titulo, subtitulo, contenido, visibilidad, estado } = req.body;

    const nuevaNoticia = await Noticia.create({
      titulo,
      subtitulo,
      contenido,
      visibilidad: visibilidad || 'todos',
      estado: estado || 'publicado',
      imagenUrl: imagenFile ? imagenFile.path : null,
    });

    //auditoria
    req.auditoriaMensaje = `Se creó la noticia: "${titulo}" (${visibilidad})`;
    req.auditoriaCodigo = 'CREATE_NOTICIA';

    res.status(201).json({
      exito: true,
      mensaje: 'Noticia creada exitosamente.',
      data: nuevaNoticia,
    });
  } catch (error) {
    if (imagenFile) eliminarArchivo(imagenFile.path);
    console.error('Error al crear noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 6. ACTUALIZAR NOTICIA (Admin)
// ==========================================
export const actualizarNoticia = async (req, res) => {
  const imagenFile = req.file;

  try {
    const { id } = req.params;
    const { titulo, subtitulo, contenido, visibilidad, estado } = req.body;

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      if (imagenFile) eliminarArchivo(imagenFile.path);
      return res.status(404).json({ exito: false, mensaje: 'Noticia no encontrada.' });
    }

    // Actualizamos campos
    if (titulo) noticia.titulo = titulo;
    if (subtitulo !== undefined) noticia.subtitulo = subtitulo;
    if (contenido) noticia.contenido = contenido;
    if (visibilidad) noticia.visibilidad = visibilidad;
    if (estado) noticia.estado = estado;

    // Si subieron una nueva imagen, eliminamos la anterior y guardamos la nueva
    if (imagenFile) {
      if (noticia.imagenUrl) eliminarArchivo(noticia.imagenUrl);
      noticia.imagenUrl = imagenFile.path;
    }

    await noticia.save();

    //auditoria
    req.auditoriaMensaje = `Se actualizó la noticia #${id}: "${noticia.titulo}"`;
    req.auditoriaCodigo = 'UPDATE_NOTICIA';

    res.status(200).json({
      exito: true,
      mensaje: 'Noticia actualizada correctamente.',
      data: noticia,
    });
  } catch (error) {
    if (imagenFile) eliminarArchivo(imagenFile.path);
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 7. ELIMINAR NOTICIA (Admin)
// ==========================================
export const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({ exito: false, mensaje: 'Noticia no encontrada.' });
    }

    await noticia.destroy(); // Soft delete por el 'paranoid: true'
    //auditoria
    req.auditoriaMensaje = `Se eliminó la noticia #${id}: "${tituloBorrado}"`;
    req.auditoriaCodigo = 'DELETE_NOTICIA';

    res.status(200).json({
      exito: true,
      mensaje: 'Noticia eliminada correctamente.',
    });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};