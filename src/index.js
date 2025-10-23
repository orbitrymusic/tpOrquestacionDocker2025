import 'dotenv/config';

import mongoose from 'mongoose';
mongoose.set('strictQuery', true); 
import { envs } from "./config/envs.js";
import app from "./app.js";

// Solo necesitamos el puerto y la URI de conexión
const PORT = envs.PORT;
const MONGODB_URI = envs.MONGODB_URI; 

mongoose.connection.on('error', (err) => {
  console.error(' Error de conexión a la base de datos:', err);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('¡Conexión exitosa a la base de datos de MongoDB!');
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
});

// Intentar la conexión a la base de datos
const connectDB = async () => {
  try {
    // Usamos la variable MONGO_URI configurada en .env
    await mongoose.connect(MONGODB_URI); 
  } catch (err) {
    console.error('Error al intentar conectar a MongoDB:', err.message);
  }
};

// Iniciar la conexión
connectDB();