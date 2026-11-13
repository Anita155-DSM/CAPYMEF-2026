import path from 'path';
import { crearSubidaACloudinary } from './subirACloudinary.js';

// Antes esto guardaba las imágenes en disco local (uploads/noticias).
// Ahora usamos el mismo patrón que gastos y constancia: se suben directo a Cloudinary,
// en su propia carpeta separada para mantener todo ordenado. Son PÚBLICAS (sin type 'authenticated'):
// se muestran en la página pública. La configuración de Cloudinary y la subida están en subirACloudinary.js.
const opcionesDeSubida = {
  folder: 'capymef_noticias',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  resource_type: 'image',
};

// Filtro LOCAL: igual que en multerCloudinary.js, esto corta el archivo antes de
// intentar subirlo a Cloudinary, en vez de confiar solo en "allowed_formats"
// (que recién rechaza DESPUÉS de haber subido el archivo).
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

// Máximo 5 MB, igual que antes (el tope por defecto de crearSubidaACloudinary), cortado antes de subir.
export const uploadNoticia = crearSubidaACloudinary({ opcionesDeSubida, fileFilter });
