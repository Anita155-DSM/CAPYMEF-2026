import { Op } from 'sequelize';
import { v2 as cloudinary } from 'cloudinary';
import { Noticia } from '../models/noticia.models.js';

// Antes esto borraba archivos del disco local con fs.unlinkSync. Ahora las imágenes
// viven en Cloudinary, así que borramos por su "public_id" en vez de por ruta de archivo.
const eliminarImagenCloudinary = async (public_id) => {
  if (public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error al borrar imagen de Cloudinary:', error);
    }
  }
};

// Cuando editamos una noticia vieja, en la base solo tenemos la URL guardada (no el
// public_id por separado). Esta función lo reconstruye a partir de la URL de Cloudinary.
// Si la URL no es de Cloudinary (por ejemplo, una noticia vieja de antes de este cambio,
// guardada con ruta local), devuelve null y simplemente no se intenta borrar nada.
const extraerPublicIdDeUrl = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const despuesDeUpload = url.split('/upload/')[1];
  if (!despuesDeUpload) return null;
  const sinVersion = despuesDeUpload.replace(/^v\d+\//, '');
  const sinExtension = sinVersion.replace(/\.[^/.]+$/, '');
  return sinExtension; // ej: "capymef_noticias/abc123def456"
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
// 3. OBTENER UNA NOTICIA POR ID
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
// 4. CREAR NOTICIA (Admin)
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
    if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
    console.error('Error al crear noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 5. ACTUALIZAR NOTICIA (Admin)
// ==========================================
export const actualizarNoticia = async (req, res) => {
  const imagenFile = req.file;

  try {
    const { id } = req.params;
    const { titulo, subtitulo, contenido, visibilidad, estado } = req.body;

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
      return res.status(404).json({ exito: false, mensaje: 'Noticia no encontrada.' });
    }

    // Actualizamos campos
    if (titulo) noticia.titulo = titulo;
    if (subtitulo !== undefined) noticia.subtitulo = subtitulo;
    if (contenido) noticia.contenido = contenido;
    if (visibilidad) noticia.visibilidad = visibilidad;
    if (estado) noticia.estado = estado;

    // Si subieron una nueva imagen, eliminamos la anterior (de Cloudinary) y guardamos la nueva
    if (imagenFile) {
      if (noticia.imagenUrl) {
        const publicIdAnterior = extraerPublicIdDeUrl(noticia.imagenUrl);
        eliminarImagenCloudinary(publicIdAnterior);
      }
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
    if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 6. ELIMINAR NOTICIA (Admin)
// ==========================================
export const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({ exito: false, mensaje: 'Noticia no encontrada.' });
    }

    const tituloBorrado = noticia.titulo; // Lo guardamos antes de destruir el registro
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