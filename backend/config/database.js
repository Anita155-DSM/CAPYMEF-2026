import dotenv from 'dotenv';
import { Pool } from 'pg'

dotenv.config()

const connection = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT
})

export const connectDB = connection.on('connect', () => {
	console.log("conección exitosa")
})
