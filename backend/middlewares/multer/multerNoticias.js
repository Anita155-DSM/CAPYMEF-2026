import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/noticias';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `noticia-${uniqueSuffix}${ext}`);
  }
});

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
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB
  fileFilter: fileFilter
});