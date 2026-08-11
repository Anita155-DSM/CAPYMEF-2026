import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database.js';

// IMPORTAMOS MODELOS
import './models/user.models.js'; 

// IMPORTAMOS RUTAS
import authRoutes from './routes/authRoutes.js'; 
import adminRoutes from './routes/admin.routes.js'

dotenv.config();

const app = express();

// Cambiamos el puerto por defecto a 3000 para no chocar con el puerto 5000 de Postgres, exceptuando como lo tengan
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); 

// Rutas
app.use('/api/auth', authRoutes);   // Maneja /registro, /login, /perfil
app.use('/api/admin', adminRoutes); //rutas de administrador

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