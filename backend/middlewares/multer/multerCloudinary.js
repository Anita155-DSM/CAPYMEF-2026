import path from 'path';
import { crearSubidaACloudinary } from './subirACloudinary.js';

// 1. La configuración de Cloudinary y la subida en sí están en subirACloudinary.js (multer en memoria +
// upload_stream), que reemplazó a multer-storage-cloudinary al pasar a Cloudinary 2.x.

// 2. Filtro LOCAL: rechaza el archivo ANTES de intentar subirlo a Cloudinary.
// "allowed_formats" de abajo no filtra nada por sí solo — solo le dice a Cloudinary
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

// 3. Subidas PRIVADAS (type 'authenticated'). Antes había un solo "uploadNube" público para dos cosas muy
// distintas, en la misma carpeta: la constancia de AFIP/DGR del registro (CUIT, domicilio fiscal) y los
// comprobantes de gastos de la Cámara (facturas, montos). Cualquiera que tuviera el link podía abrirlos.
// Ahora cada uno va a su carpeta y es privado: Cloudinary solo lo entrega con una URL firmada, que pide el
// backend después de verificar quién es (ver urlTemporalDeArchivo en services/cloudinary.service.js).
// Las imágenes de noticias y eventos siguen públicas (multerNoticias.js y multerEventos.js): se muestran en
// la página pública.
export const CARPETA_CONSTANCIAS = 'capymef_constancias';
export const CARPETA_GASTOS = 'capymef_gastos';

// Con multer en memoria, un archivo que supera los 5 MB se corta antes de subir nada. Antes, con el storage de
// Cloudinary, una parte ya podía haber llegado a subirse y había que borrarla al abortar (_removeFile).
const crearSubidaPrivada = (folder) => crearSubidaACloudinary({
  opcionesDeSubida: {
    folder,
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'],
    resource_type: 'auto', // Permite tanto imágenes como documentos PDF
    type: 'authenticated', // privado: sin URL firmada no se puede abrir
  },
  fileFilter, // 5 MB máximo (el tope por defecto de crearSubidaACloudinary)
});

// 4. Los middlewares listos para usar en las rutas
export const uploadConstancia = crearSubidaPrivada(CARPETA_CONSTANCIAS); // registro de socios
export const uploadGasto = crearSubidaPrivada(CARPETA_GASTOS); // comprobantes de gastos (Finanzas)
