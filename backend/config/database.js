import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(
	process.env.DB_NAME ,
	process.env.DB_USER ,
	process.env.DB_PASSWORD ,
	{
		host: process.env.DB_HOST ,
		port: process.env.DB_PORT ,
		dialect: process.env.DB_DIALECT ,
		logging: false,
	}
);

export const connectDB = async () => {
	try {
		await sequelize.authenticate();
		console.log('Conexion a la base de datos exitosa');
	} catch (error) {
		console.error('Error al conectar con la base de datos:', error.message);
	}
};

export default sequelize;
