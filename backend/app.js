import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { interceptorAuditoria } from './middlewares/auditoria.middleware.js';

// IMPORTAMOS MODELOS
import './models/user.models.js'; 
import './models/gasto.models.js';
import './models/noticia.models.js';
import './models/pago.models.js';

// IMPORTAMOS TUS RUTAS
import authRoutes from './routes/authRoutes.js'; 
import noticiaRoutes from './routes/noticia.routes.js';
import adminRoutes from './routes/admin.routes.js';
import gastoRoutes from './routes/gasto.routes.js'
import cuotaRoutes from './routes/cuota.routes.js'
import { iniciarCronJobs } from './config/cron.js';//automatizados de cuotas


dotenv.config();

const app = express();

// Cambiamos el puerto por defecto a 3000 para no chocar con el puerto 5000 de Postgres, exceptuando como lo tengan
const port = process.env.PORT || 3000;
// 2. CORS: Define quién puede consumir nuestra API (La lista blanca)
const dominiosPermitidos = [
  'http://localhost:5173', // front de Eric en desarrollo
  // 'https://www.capymef.org.ar' masomenos esto se agregaria cuando pasen a producción
];

// //RATE LIMITING es el límite de peticiones general en 15 minutos, esto para evitar ataques de decifrado de contraseñas
//LO COMENTO ESTO PORQUE AUN ESTAMOS EN ETAPA DE DESARROLLO
// const limitadorGeneral = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 100, // Limita a 100 peticiones por IP cada 15 minutos
//   message: {
//     exito: false,
//     mensaje: "Has superado el límite de peticiones. Por favor, intentá de nuevo en 15 minutos." // aviso de que sucede
//   },
//   standardHeaders: true, 
//   legacyHeaders: false, 
// });
// // Aplicamos el limitador a todas las rutas que empiecen con /api/
// app.use('/api/', limitadorGeneral);

// Middlewares
app.use(morgan('dev'));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || dominiosPermitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true // Importante en cuanto al manejo de cookies
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // recomendado para parsear formularios
// HELMET lo que hace es, culta información sensible de Express y protege cabeceras
app.use(helmet());


// Servir la carpeta de archivos subidos públicamente (constancias, imágenes de noticias, etc.)
app.use('/uploads', express.static('uploads'));

// 4. REGISTRO DE RUTAS API
//incorporacion de logs globalmente para auditar lo que se haga:)
app.use('/api', interceptorAuditoria)
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRoutes); // wndpoints: /api/admin/solicitudes, etc
app.use('/api/noticias', noticiaRoutes);
app.use('/api/cuotas', cuotaRoutes) //pago de cuptas

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor backend de CAPYMEF funcionando',
    status: 'ok',
  });
});

// Manejador global de errores: SIEMPRE va al final, después de todas las rutas.
// Atrapa errores no controlados (ej: Multer rechazando un archivo con cb(new Error(...)))
// para no exponer el stack trace ni romper el servidor.
app.use((error, req, res, next) => {
  console.error('Error no controlado:', error);
  res.status(error.status || 500).json({
    exito: false,
    mensaje: error.message || 'Error interno del servidor.',
  });
});
 
// Función para conectar a la base de datos, sincronizar tablas y levantar el servidor
const startServer = async () => {
  try {
    // 1. Probar la conexión y sincronizar tablas (las crea si no existen)
    // Usamos sync() SIN "alter: true" para el día a día: revisa que las tablas existan,
    // pero no intenta reescribir columnas en cada arranque (eso es lento y frágil,
    // sobre todo contra el connection pooler de Supabase — puede cortarse a mitad de
    // camino y dejar la tabla desincronizada, como nos pasó).
    // Si agregás o cambiás un campo en algún modelo, cambiá esta línea a
    // sequelize.sync({ alter: true }) UNA vez, confirmá en la consola que terminó bien,
    // y volvé a dejarla como está ahora.
    await sequelize.sync({ alter: true }); //{ alter: true } en caso de adaptar nuevos modelos
    console.log('Conexión exitosa a PostgreSQL y tablas sincronizadas con Sequelize');

    // 2. Iniciar las tareas programadas (generación automática de cuotas el día 1 de cada mes)
    iniciarCronJobs();

    // 3. Levantar el servidor Express
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error crítico: No se pudo conectar a PostgreSQL', error.message);
  }
};

startServer();