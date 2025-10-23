import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importa enrutadores


// Carga las variables de entorno desde el archivo .env
dotenv.config();

const app = express();
console.log('Mi app se está ejecutando.'); // Línea de prueba

// Middlewares
app.use(express.json());
app.use(cors());


// Rutas de la API con sus prefijos específicos
// app.use('/api/users');


// Manejador de errores para rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Exporta la instancia de la aplicación
export default app;


