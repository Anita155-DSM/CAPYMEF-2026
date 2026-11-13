import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ==========================================
// Helpers compartidos para manejo de imágenes/archivos en Cloudinary
// Usado por: gasto.controllers.js, noticia.controllers.js, evento.controllers.js, y los comprobantes de pago
// (cuota.controllers.js, pago.controllers.js y comprobanteGuardado.service.js)
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
// Forma de una URL de entrega de Cloudinary:
//   https://res.cloudinary.com/<cuenta>/<tipo de recurso>/<tipo de entrega>/[s--firma--/][v123/]<public_id>.<ext>
// El tipo de entrega es "upload" en los archivos públicos (imágenes de noticias y eventos, y los comprobantes
// subidos antes de este cambio) y "authenticated" en los privados (comprobantes de pago nuevos). Las URL
// privadas traen además una firma ("s--...--") antes de la versión.
const URL_DE_CLOUDINARY = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/([^/]+)\/(upload|authenticated)\/(?:s--[^/]+--\/)?(?:v\d+\/)?([^?#]+)/;

// Devuelve { resourceType, tipoEntrega, publicId, formato } de una URL de Cloudinary, o null si no lo es.
export const leerUrlDeCloudinary = (url) => {
  if (typeof url !== 'string') return null;
  const partes = URL_DE_CLOUDINARY.exec(url);
  if (!partes) return null;
  const [, resourceType, tipoEntrega, ruta] = partes;
  const extension = /\.([^/.]+)$/.exec(ruta);
  return {
    resourceType,
    tipoEntrega,
    publicId: extension ? ruta.slice(0, -extension[0].length) : ruta,
    formato: extension ? extension[1].toLowerCase() : null,
  };
};

export const extraerPublicIdDeUrl = (url) => leerUrlDeCloudinary(url)?.publicId ?? null;

// Un comprobante privado ("authenticated") no se puede pedir con su URL: Cloudinary exige una firma. Esta función
// arma una URL de descarga firmada que VENCE en pocos minutos (private_download_url, de la API de Cloudinary).
// La usa solo el servidor para traer el PDF y entregárselo al socio o al admin: la URL nunca llega al navegador,
// y aunque quedara en algún log, a los pocos minutos ya no sirve.
// Devuelve null si la URL no es de un archivo privado de Cloudinary (las públicas viejas se piden directo).
export const MINUTOS_URL_TEMPORAL = 5;
export const urlTemporalDeDescarga = (url, { minutos = MINUTOS_URL_TEMPORAL } = {}) => {
  const datos = leerUrlDeCloudinary(url);
  if (!datos || datos.tipoEntrega !== 'authenticated') return null;
  return cloudinary.utils.private_download_url(datos.publicId, datos.formato || 'pdf', {
    resource_type: datos.resourceType,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + minutos * 60,
  });
};

// ==========================================
// Archivos privados que se le muestran al usuario (constancias del registro, comprobantes de gastos)
// ==========================================
// Para un archivo privado ("authenticated"), una URL firmada que vence a los pocos minutos. A diferencia de
// urlTemporalDeDescarga (que usa solo el servidor), esta sí se le entrega al navegador, después de que el
// endpoint verificó que quien la pide puede ver ese archivo (el dueño o un admin). Aunque se comparta o quede en
// el historial, a los minutos ya no abre nada.
// Las URLs públicas viejas ("upload", subidas antes de este cambio) se devuelven tal cual: siguen funcionando
// hasta que se migren. Devuelve { url, expiraEn, esPdf }, o null si la URL no es de Cloudinary o no se entiende.
// esPdf sale de la extensión guardada: la URL temporal es de api.cloudinary.com y no termina en ".pdf", así que
// el frontend no puede deducirlo de la URL.
export const urlTemporalDeArchivo = (urlGuardada, { minutos = MINUTOS_URL_TEMPORAL } = {}) => {
  const datos = leerUrlDeCloudinary(urlGuardada);
  if (!datos) return null;
  const esPdf = datos.formato === 'pdf';
  if (datos.tipoEntrega !== 'authenticated') return { url: urlGuardada, expiraEn: null, esPdf };

  const vencimiento = Math.floor(Date.now() / 1000) + minutos * 60;
  const url = cloudinary.utils.private_download_url(datos.publicId, datos.formato || undefined, {
    resource_type: datos.resourceType,
    type: 'authenticated',
    expires_at: vencimiento,
  });
  return { url, expiraEn: new Date(vencimiento * 1000).toISOString(), esPdf };
};

// Borra de Cloudinary el archivo de una URL guardada, sea pública o privada. Un archivo privado solo se borra
// si se le dice a destroy que es "authenticated" (y de qué tipo de recurso es): con eliminarImagenCloudinary,
// que llama a destroy solo con el public_id, Cloudinary lo busca entre los públicos y no lo encuentra.
// Nunca lanza error (se llama desde los catch, igual que eliminarImagenCloudinary).
export const eliminarArchivoDeCloudinary = async (urlGuardada) => {
  const datos = leerUrlDeCloudinary(urlGuardada);
  if (!datos) return;
  try {
    await cloudinary.uploader.destroy(datos.publicId, {
      type: datos.tipoEntrega,
      resource_type: datos.resourceType,
      invalidate: true, // que la red de Cloudinary deje de servir la copia que tenga guardada
    });
  } catch (error) {
    console.error('Error al borrar un archivo de Cloudinary:', error.message);
  }
};

// Para responder un registro sin la URL de su archivo privado: saca el campo con la URL y deja un indicador
// (true/false). El frontend usa el indicador para mostrar el botón, y pide la URL temporal al endpoint propio.
export const reemplazarUrlPorIndicador = (datos, campoUrl, campoIndicador) => {
  const { [campoUrl]: url, ...resto } = typeof datos?.toJSON === 'function' ? datos.toJSON() : datos;
  return { ...resto, [campoIndicador]: Boolean(url) };
};

/**
 * Sube un PDF que ya está en memoria (Buffer) directo a Cloudinary, sin pasar por disco.
 * Usado SOLO para comprobantes de pago, que se generan al vuelo con pdfkit.
 * Se suben como "authenticated" (privados): el comprobante tiene razón social, CUIT y monto, y antes quedaba
 * público para cualquiera que tuviera el link. Ahora solo se puede bajar con una URL firmada, y esa URL la
 * pide el servidor (ver urlTemporalDeDescarga), después de verificar que quien lo pide es el dueño o un admin.
 *
 * @param {Buffer} buffer - el PDF ya generado
 * @param {Object} opciones - { folder, public_id }
 * @returns {Promise<Object>} el resultado de Cloudinary (incluye .secure_url)
 */
export const subirPDFCloudinary = (buffer, { folder, public_id }) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id, resource_type: 'auto', format: 'pdf', type: 'authenticated' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};