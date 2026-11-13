import path from 'path';
import { crearSubidaACloudinary } from './subirACloudinary.js';

// Imágenes PÚBLICAS (sin type 'authenticated'): se muestran en la página pública de eventos.
// La configuración de Cloudinary y la subida están en subirACloudinary.js (ver el por qué ahí).
const opcionesDeSubida = {
  folder: 'capymef_eventos',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  resource_type: 'image',
};

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

// 5 MB máximo (el tope por defecto de crearSubidaACloudinary), cortado antes de subir.
export const uploadEvento = crearSubidaACloudinary({ opcionesDeSubida, fileFilter });
