import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database.js';

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

// Middlewares
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // recomendado para parsear formularios

// Servir la carpeta de archivos subidos públicamente (constancias, imágenes de noticias, etc.)
app.use('/uploads', express.static('uploads'));

// 4. REGISTRO DE RUTAS API
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

// Función para conectar a la base de datos, sincronizar tablas y levantar el servidor
const startServer = async () => {
  try {
    // 1. Probar la conexión y sincronizar tablas (las crea si no existen)
    await sequelize.sync({ alter: true }); 
    console.log('Conexión exitosa a PostgreSQL y tablas sincronizadas con Sequelize');

    // 2. Levantar el servidor Express
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error crítico: No se pudo conectar a PostgreSQL', error.message);
  }
};

startServer();