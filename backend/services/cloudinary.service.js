import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ==========================================
// Helpers compartidos para manejo de imágenes/archivos en Cloudinary
// Usado por: gasto.controllers.js, noticia.controllers.js, evento.controllers.js
// ==========================================

/**
 * Borra un archivo de Cloudinary a partir de su public_id.
 * No lanza error si falla — solo lo loguea, para no bloquear el flujo principal
 * (por ejemplo, si esto se llama dentro de un catch, no queremos que un fallo acá
 * tape el error real que ya se estaba manejando).
 */
export const eliminarImagenCloudinary = async (public_id) => {
  if (public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error al borrar imagen de Cloudinary:', error);
    }
  }
};

/**
 * Reconstruye el public_id de Cloudinary a partir de la URL completa guardada en la base.
 * Necesario porque solo guardamos la URL (no el public_id) en los modelos —
 * esta función deshace ese camino para poder borrar el recurso correspondiente.
 *
 * Ej: https://res.cloudinary.com/xxx/image/upload/v123456/capymef_noticias/abc123.webp
 *     -> "capymef_noticias/abc123"
 */
export const extraerPublicIdDeUrl = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const despuesDeUpload = url.split('/upload/')[1];
  if (!despuesDeUpload) return null;
  const sinVersion = despuesDeUpload.replace(/^v\d+\//, '');
  const sinExtension = sinVersion.replace(/\.[^/.]+$/, '');
  return sinExtension;
};

/**
 * Sube un PDF que ya está en memoria (Buffer) directo a Cloudinary, sin pasar por disco.
 * Usado para comprobantes de pago, que se generan al vuelo con pdfkit.
 *
 * @param {Buffer} buffer - el PDF ya generado
 * @param {Object} opciones - { folder, public_id }
 * @returns {Promise<Object>} el resultado de Cloudinary (incluye .secure_url)
 */
export const subirPDFCloudinary = (buffer, { folder, public_id }) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id, resource_type: 'auto', format: 'pdf' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};