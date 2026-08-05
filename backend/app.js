import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { pool } from './config/database.js'; // Importamos el pool de PostgreSQL

dotenv.config();

const app = express();
const port = process.env.PORT || 5000; // Valor por defecto en caso de que falle process.env.PORT

// Middlewares
app.use(cors());
app.use(express.json()); // Permite recibir JSON en los body de las peticiones HTTP

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
    // Probamos la conexión haciendo una consulta simple a PostgreSQL
    const res = await pool.query('SELECT NOW()');
    console.log(` Conectado a PostgreSQL a las: ${res.rows[0].now}`);

    // Una vez confirmada la DB, iniciamos el servidor Express
    app.listen(port, () => {
      console.log(` Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(' Error crítico: No se pudo conectar a PostgreSQL', error.message);
    process.exit(1); // Detiene la aplicación si la DB no responde
  }
};

startServer();