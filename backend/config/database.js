import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Neon (y Supabase) exigen SSL; un Postgres local normalmente no. Lo decide DB_SSL del .env
// para poder cambiar de base sin tocar el código.
const usarSSL = process.env.DB_SSL === 'true';

export const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432, // el puerto estándar de Postgres; si el tuyo es otro, va en DB_PORT del .env
    dialect: 'postgres',
    logging: true, // en true se ven las consultas SQL en la consola

    // Neon duerme el cómputo tras 5 min sin uso y cierra las conexiones ociosas. Si el pool
    // se quedara con conexiones muertas, la primera consulta después del descanso fallaría.
    pool: {
      max: 5,
      min: 0,
      idle: 10000,    // suelta conexiones ociosas a los 10 s, antes de que Neon las corte
      acquire: 30000, // espera hasta 30 s por una conexión (cubre el despertar de la base)
      evict: 5000,
    },
    retry: { max: 3 }, // reintenta si la conexión falla justo cuando la base despierta

    dialectOptions: usarSSL
      ? { ssl: { require: true, rejectUnauthorized: true } }
      : {},
  }
);

// Probamos la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa a PostgreSQL con Sequelize');
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
};
testConnection();