import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

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

// 3. Exportamos el middleware listo para usar en las rutas
export const uploadNube = multer({ storage });