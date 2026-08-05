import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { pool } from './config/database.js';
// 1. IMPORTAMOS TUS RUTAS LIMPIAS, unciamente las que tenemos por ahora
import authRoutes from './routes/authRoutes.js'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); 

// 2. CONECTAMOS LAS RUTAS A EXPRESS
// Todo lo que esté en authRoutes responderá bajo la url /api/auth
app.use('/api/auth', authRoutes); 

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor backend de CAPYMEF funcionando',
    status: 'ok',
  });
});

// Función para probar DB y levantar el servidor
const startServer = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(` Conectado a PostgreSQL a las: ${res.rows[0].now}`);

    app.listen(port, () => {
      console.log(` Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(' Error crítico: No se pudo conectar a PostgreSQL', error.message);
    process.exit(1); 
  }
};

startServer();