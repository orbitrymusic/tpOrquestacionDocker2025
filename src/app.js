import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';



// 1. IMPORTAR ENRUTADORES
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';


// Carga las variables de entorno desde el archivo .env
dotenv.config();

const app = express();
console.log('Mi app se está ejecutando.'); // Línea de prueba

// Middlewares
app.use(express.json());
app.use(cors());



// Rutas de Autenticación (Login, Register) - Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas de Usuario (Perfil, Update) - Rutas protegidas
app.use('/api/users', userRoutes);


// Manejador de errores para rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Exporta la instancia de la aplicación
export default app;


