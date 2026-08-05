import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// 1. Instanciamos el Pool con las variables de entorno
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432, // Aseguramos que sea un número
});

// 2. Escuchamos el evento para saber cuándo se conecta un nuevo cliente
pool.on('connect', () => {
  console.log(' Conexión exitosa a la base de datos PostgreSQL');
});

// 3. Capturamos errores globales del Pool (Muy recomendado para producción)
pool.on('error', (err) => {
  console.error(' Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1);
});

// 4. Exportamos una función helper limpia para hacer queries en tus modelos/servicios
export const query = (text, params) => pool.query(text, params);