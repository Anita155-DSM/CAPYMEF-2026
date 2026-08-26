import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

// Cloudinary ya está configurado en multerCloudinary.js, pero cloudinary.config()
// es global al proceso, así que no hace falta repetirlo. Igual lo dejamos explícito
// acá por claridad, no rompe nada llamarlo dos veces.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Antes esto guardaba las imágenes en disco local (uploads/noticias).
// Ahora usamos el mismo patrón que gastos y constancia: se suben directo a Cloudinary,
// en su propia carpeta separada para mantener todo ordenado.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'capymef_noticias',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image'
  }
});

// Filtro LOCAL: igual que en multerCloudinary.js, esto corta el archivo antes de
// intentar subirlo a Cloudinary, en vez de confiar solo en "allowed_formats"
// (que recién rechaza DESPUÉS de haber subido el archivo).
const fileFilter = (req, file, cb) => {
  const permitidos = /jpg|jpeg|png|webp/;
  const extname = permitidos.test(path.extname(file.originalname).toLowerCase());
  const mimetype = permitidos.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP.'));
  }
};

export const uploadNoticia = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB, igual que antes
  fileFilter
});
