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

// 2. Configuración del almacenamiento (dónde y cómo se guarda)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Generamos un nombre único usando la fecha actual y un número aleatorio
    // Ej: 1723145000000-constancia.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}-${file.fieldname}${ext}`);
  }
});

// 3. Filtro de seguridad: solo permitir PDFs e Imágenes
const fileFilter = (req, file, cb) => {
  const permitidos = /pdf|jpg|jpeg|png/;
  const extname = permitidos.test(path.extname(file.originalname).toLowerCase());
  const mimetype = permitidos.test(file.mimetype);

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