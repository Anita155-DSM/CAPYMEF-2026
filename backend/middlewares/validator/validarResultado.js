import { validationResult } from 'express-validator';
import { eliminarArchivoDeCloudinary } from '../../services/cloudinary.service.js';

// Archivos que multer ya subió en esta petición (uno con .single, o varios con .array/.fields).
const archivosSubidos = (req) => {
  const varios = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
  return [req.file, ...varios].filter((archivo) => archivo?.path);
};

// multer sube el archivo a Cloudinary ANTES de que corran los validadores (necesita leer el formulario
// multipart para que existan los campos a validar). Si la validación rechaza la petición, ese archivo quedaba
// guardado en Cloudinary sin ningún registro que lo use (constancias, comprobantes de gastos, imágenes de
// noticias y eventos). Acá se borra. Sin esperar: la respuesta al usuario no depende del borrado, y como
// eliminarArchivoDeCloudinary nunca lanza error (y por las dudas se atrapa igual), un fallo no la cambia.
// Las URLs que no son de Cloudinary (archivos locales viejos) se ignoran.
const descartarArchivosSubidos = (req) => {
  for (const archivo of archivosSubidos(req)) {
    Promise.resolve()
      .then(() => eliminarArchivoDeCloudinary(archivo.path))
      .catch((error) => console.error('No se pudo borrar un archivo subido en una petición rechazada:', error?.message));
  }
};

// Middleware genérico que revisa si express-validator atrapó algún error.
// Compartido entre todos los validadores del proyecto (usuario, evento, noticia, gasto, tarifa, cuota)
// para no repetir la misma lógica en cada uno.
export const validarResultado = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    descartarArchivosSubidos(req);
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validación en los datos enviados.',
      errores: errores.array().map(err => ({ campo: err.path, mensaje: err.msg }))
    });
  }
  next();
};
