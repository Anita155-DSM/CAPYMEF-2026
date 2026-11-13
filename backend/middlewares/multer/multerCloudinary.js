import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { eliminarArchivoDeCloudinary } from '../../services/cloudinary.service.js';

// 1. Configuramos Cloudinary leyendo tus variables de entorno seguras
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const crearSubidaPrivada = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'],
      resource_type: 'auto', // Permite tanto imágenes como documentos PDF
      type: 'authenticated', // privado: sin URL firmada no se puede abrir
    },
  });
  // Cuando multer aborta una petición (por ejemplo, un archivo que supera los 5 MB), borra lo que ya llegó a
  // subir llamando a _removeFile. El de multer-storage-cloudinary llama a destroy solo con el public_id, y un
  // archivo privado no se borra así (Cloudinary lo busca entre los públicos): quedaba huérfano. Acá se borra a
  // partir de su URL, que dice si es privado y de qué tipo de recurso es. Nunca devuelve error a multer.
  storage._removeFile = (req, file, callback) => {
    eliminarArchivoDeCloudinary(file.path).then(() => callback(null), () => callback(null));
  };
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter,
  });
};

// 4. Los middlewares listos para usar en las rutas
export const uploadConstancia = crearSubidaPrivada(CARPETA_CONSTANCIAS); // registro de socios
export const uploadGasto = crearSubidaPrivada(CARPETA_GASTOS); // comprobantes de gastos (Finanzas)
