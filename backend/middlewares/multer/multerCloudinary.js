import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

// 1. Configuramos Cloudinary leyendo tus variables de entorno seguras
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Definimos el almacenamiento en la nube para comprobantes
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'capymef_comprobantes', // Carpeta que se creará automáticamente en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'],
    resource_type: 'auto' // Permite tanto imágenes como documentos PDF
  }
});

// 3. Filtro LOCAL: rechaza el archivo ANTES de intentar subirlo a Cloudinary.
// "allowed_formats" de arriba no filtra nada por sí solo — solo le dice a Cloudinary
// qué esperar, y recién ahí (después de ya haber subido el archivo) lo rechaza si no
// coincide. Este filtro corta el archivo localmente, sin gastar ancho de banda ni
// esperar el viaje de ida y vuelta a la nube.
// La extensión y el tipo MIME se comparan con expresiones ANCLADAS (^...$). Antes se usaba una sola
// regex sin anclas para las dos cosas, que solo buscaba esas letras en cualquier parte del texto:
// "foto.pngx" o "x.jpgphp" pasaban el filtro. Son dos regex distintas porque la extensión (".png")
// y el MIME ("image/png") tienen formatos diferentes.
// "pjpeg" es el MIME que mandan algunos navegadores viejos para un JPEG; la regex anterior lo aceptaba.
const EXTENSIONES_PERMITIDAS = /^\.(pdf|jpe?g|png|webp)$/i;
const MIMETYPES_PERMITIDOS = /^(application\/pdf|image\/(jpe?g|pjpeg|png|webp))$/i;

export const fileFilter = (req, file, cb) => {
  const extname = EXTENSIONES_PERMITIDAS.test(path.extname(file.originalname).toLowerCase());
  const mimetype = MIMETYPES_PERMITIDOS.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato inválido. Solo se permiten archivos PDF, JPG, JPEG, PNG o WEBP.'));
  }
};

// 4. Exportamos el middleware listo para usar en las rutas
export const uploadNube = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter
});