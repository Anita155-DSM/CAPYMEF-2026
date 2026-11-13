import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// ==========================================
// Subida de archivos a Cloudinary (constancias, comprobantes de gastos, imágenes de noticias y eventos)
// ==========================================
// Por qué existe: antes las subidas usaban multer-storage-cloudinary, que solo funciona con Cloudinary 1.x.
// Cloudinary 1.x tiene una vulnerabilidad alta (inyección de parámetros con "&", corregida en la 2.7.0) y
// multer-storage-cloudinary no tiene ninguna versión para la 2.x, así que se reemplazó por esto:
//   1. multer lee el formulario con memoryStorage: el archivo queda en memoria (req.file.buffer), sin tocar el
//      disco ni la red. El filtro de formato y el tope de 5 MB actúan acá, ANTES de subir nada: un archivo
//      rechazado nunca llega a Cloudinary (antes, con el tope, una parte ya podía haber llegado a subirse).
//   2. Recién cuando multer terminó bien, el archivo se sube con cloudinary.uploader.upload_stream (el mismo
//      método que ya se usaba para los comprobantes de pago, ver subirPDFCloudinary).
//   3. req.file queda con EXACTAMENTE los mismos campos que dejaba multer-storage-cloudinary (path = URL
//      segura, filename = public_id, size = bytes guardados), así los controladores y validarResultado
//      (que borra lo subido si la validación rechaza el pedido) no cambian. El buffer se saca: ya no hace
//      falta y no tiene sentido que siga viajando por la petición.

// La configuración de Cloudinary es global al proceso: se hace una sola vez, acá, porque este módulo lo
// importan todas las subidas. Los comprobantes de pago (cloudinary.service.js) usan la misma configuración.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const TAMANO_MAXIMO_ARCHIVO = 5 * 1024 * 1024; // 5 MB, el mismo tope de siempre

// Error de Cloudinary al guardar el archivo. Responde 502 (Bad Gateway): el pedido del usuario estaba bien, el
// que falló es el servicio externo del que dependemos. Con status 502 lo responde así tanto manejadorErrores
// como el manejador por defecto de Express. El detalle de Cloudinary queda en "causa" para el log del servidor,
// nunca en la respuesta.
export class ErrorDeSubidaACloudinary extends Error {
  constructor(causa) {
    super('No se pudo guardar el archivo. Probá de nuevo en unos minutos.');
    this.name = 'ErrorDeSubidaACloudinary';
    this.status = 502;
    this.causa = causa;
  }
}

// Sube un buffer con upload_stream. Si Cloudinary responde con error, la subida no quedó guardada (el archivo
// se guarda recién cuando Cloudinary lo recibió entero y respondió bien), así que no hay nada que borrar.
const subirBuffer = (buffer, opciones) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(opciones, (error, resultado) => {
    if (error) return reject(error);
    resolve(resultado);
  });
  stream.on('error', reject); // por si el stream mismo falla antes de que responda Cloudinary
  stream.end(buffer);
});

// Los campos de req.file, en el mismo orden que antes: los que pone multer (fieldname, originalname, encoding,
// mimetype) y los que ponía multer-storage-cloudinary (path, size, filename).
const archivoComoAntes = (archivo, resultado) => ({
  fieldname: archivo.fieldname,
  originalname: archivo.originalname,
  encoding: archivo.encoding,
  mimetype: archivo.mimetype,
  path: resultado.secure_url,
  size: resultado.bytes,
  filename: resultado.public_id,
});

// Arma un "upload" con la misma forma que el de multer (uploadConstancia.single('constancia')), así las rutas
// no cambian. opcionesDeSubida son las que se le mandan a Cloudinary: carpeta, formatos, resource_type y, para
// los privados, type 'authenticated'. Son fijas: nada del formulario del usuario se usa como parámetro.
// Solo existe .single porque es lo único que usan las rutas (un archivo por pedido).
export const crearSubidaACloudinary = ({ opcionesDeSubida, fileFilter, tamanoMaximo = TAMANO_MAXIMO_ARCHIVO }) => {
  const lector = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: tamanoMaximo },
    fileFilter,
  });

  const single = (campo) => {
    const leerFormulario = lector.single(campo);
    return (req, res, next) => {
      leerFormulario(req, res, async (errorDeMulter) => {
        // Formato inválido, más de 5 MB, campo inesperado...: no se subió nada, se pasa el error tal cual
        // (manejadorErrores responde 400 o 413, igual que antes).
        if (errorDeMulter) return next(errorDeMulter);
        if (!req.file) return next(); // el archivo es opcional en noticias, eventos y gastos

        try {
          const resultado = await subirBuffer(req.file.buffer, { ...opcionesDeSubida });
          req.file = archivoComoAntes(req.file, resultado);
          next();
        } catch (error) {
          // Sin req.file: ni el controlador ni validarResultado tienen que tratar de usar o borrar un archivo
          // que no existe. El controlador no corre: el error va directo al manejador de errores.
          req.file = undefined;
          next(new ErrorDeSubidaACloudinary(error));
        }
      });
    };
  };

  return { single };
};
