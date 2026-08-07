import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5000, // mi Postgres está en el 5000, si vos lo tenes en el 5432 ponelo en ese
    dialect: 'postgres',              
    logging: true                     // en true si querés ver los CREATE TABLE en la consola
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