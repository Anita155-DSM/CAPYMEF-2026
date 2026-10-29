import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'capymef_eventos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image'
  }
});

// Filtro LOCAL (igual que en multerNoticias.js y multerCloudinary.js): rechaza el
// archivo antes de gastar el viaje de red a Cloudinary, en vez de confiar solo en
// "allowed_formats" (que recién rechaza DESPUÉS de haber subido el archivo).
// La extensión y el tipo MIME se comparan con expresiones ANCLADAS (^...$). Antes se usaba una sola
// regex sin anclas para las dos cosas, que solo buscaba esas letras en cualquier parte del texto:
// "foto.pngx" o "x.jpgphp" pasaban el filtro. Son dos regex distintas porque la extensión (".png")
// y el MIME ("image/png") tienen formatos diferentes.
// "pjpeg" es el MIME que mandan algunos navegadores viejos para un JPEG; la regex anterior lo aceptaba.
const EXTENSIONES_PERMITIDAS = /^\.(jpe?g|png|webp)$/i;
const MIMETYPES_PERMITIDOS = /^image\/(jpe?g|pjpeg|png|webp)$/i;

export const fileFilter = (req, file, cb) => {
  const extname = EXTENSIONES_PERMITIDAS.test(path.extname(file.originalname).toLowerCase());
  const mimetype = MIMETYPES_PERMITIDOS.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP.'));
  }
};

export const uploadEvento = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter
});
