// ⚠️ DEPRECADO: este middleware guarda archivos en disco local y ya no se usa en ninguna ruta
// (el registro de socios ahora usa multerCloudinary.js -> uploadNube).
// No se encontraron referencias a este archivo en el resto del backend.
// Se deja por si tu compañero lo necesita en otra rama; si no, se puede eliminar junto
// con la carpeta 'uploads/constancias' local que quedó de cuando sí se usaba.
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 1. Asegurarnos de que el directorio de destino exista
const uploadDir = 'uploads/constancias';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// La extensión y el tipo MIME se comparan con expresiones ANCLADAS (^...$). Antes se usaba una sola
// regex sin anclas para las dos cosas, que solo buscaba esas letras en cualquier parte del texto:
// "foto.pngx" o "x.jpgphp" pasaban el filtro. Son dos regex distintas porque la extensión (".png")
// y el MIME ("image/png") tienen formatos diferentes.
// "pjpeg" es el MIME que mandan algunos navegadores viejos para un JPEG; la regex anterior lo aceptaba.
const EXTENSIONES_PERMITIDAS = /^\.(pdf|jpe?g|png)$/i;
const MIMETYPES_PERMITIDOS = /^(application\/pdf|image\/(jpe?g|pjpeg|png))$/i;

// 2. Configuración del almacenamiento (dónde y cómo se guarda)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Generamos un nombre único usando la fecha actual y un número aleatorio
    // Ej: 1723145000000-constancia.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // La extensión pasa a formar parte del nombre del archivo en disco: solo se usa si es una de las
    // permitidas (y en minúsculas), así el nombre nunca puede traer caracteres como "/" o "..".
    const ext = path.extname(file.originalname).toLowerCase();
    const extSegura = EXTENSIONES_PERMITIDAS.test(ext) ? ext : '';
    cb(null, `${uniqueSuffix}-${file.fieldname}${extSegura}`);
  }
});

// 3. Filtro de seguridad: solo permitir PDFs e Imágenes
export const fileFilter = (req, file, cb) => {
  const extname = EXTENSIONES_PERMITIDAS.test(path.extname(file.originalname).toLowerCase());
  const mimetype = MIMETYPES_PERMITIDOS.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato inválido. Solo se permiten archivos PDF, JPG, JPEG o PNG.'));
  }
};

// 4. Exportar el middleware configurado
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño: 5MB máximo
  fileFilter: fileFilter
});