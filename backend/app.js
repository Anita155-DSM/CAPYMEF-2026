import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		message: 'Servidor backend de CAPYMEF funcionando',
		status: 'ok',
	});
});

const startServer = async () => {
	await connectDB();
	app.listen(port, () => {
		console.log(`Servidor corriendo en http://localhost:${port}`);
	});
};

startServer();
