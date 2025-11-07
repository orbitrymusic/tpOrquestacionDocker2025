//codigo anterior ////////////////////////////////////////////////////////////////////////////7
// import 'dotenv/config'; 

// import mongoose from 'mongoose';
// mongoose.set('strictQuery', true); 
// import { envs } from "./config/envs.js";
// import app from "./app.js";

// // Solo necesitamos el puerto y la URI de conexión
// const PORT = envs.PORT;
// const MONGODB_URI = envs.MONGODB_URI; 

// mongoose.connection.on('error', (err) => {
//   console.error(' Error de conexión a la base de datos:', err);
//   process.exit(1);
// });

// mongoose.connection.on('connected', () => {
//   console.log('¡Conexión exitosa a la base de datos de MongoDB!');
//   app.listen(PORT, () => {
//     console.log(`Servidor escuchando en http://localhost:${PORT}`);
//   });
// });

// // Intentar la conexión a la base de datos
// const connectDB = async () => {
//   try {
//     // Usamos la variable MONGO_URI configurada en .env
//     await mongoose.connect(MONGODB_URI); 
//   } catch (err) {
//     console.error('Error al intentar conectar a MongoDB:', err.message);
//   }
// };

// // Iniciar la conexión
// connectDB();
// //testeo EJS PD: espero no romper todo!!////////////////////////////////////////////////////////
// import 'dotenv/config';
// import mongoose from 'mongoose';
// import { envs } from "./config/envs.js";
// import app from "./app.js";
// import AmqpLogger from './services/AmqpLogger.service.js';

// mongoose.set('strictQuery', true);

// // Manejadores de eventos de MongoDB
// mongoose.connection.on('error', (err) => {
//   console.error('❌ Error de conexión a MongoDB:', err);
//   process.exit(1);
// });

// mongoose.connection.on('connected', () => {
//   console.log('✅ Conexión exitosa a MongoDB');
// });

// // Función principal para iniciar el servidor
// async function startServer() {
//     try {
//         // 1. Conectar a MongoDB
//         await mongoose.connect(envs.MONGODB_URI);
        
//         // 2. Conectar a RabbitMQ para logs
//         await AmqpLogger.connect();
//         console.log('✅ Logger AMQP inicializado');

//         // 3. Iniciar el servidor Express
//         app.listen(envs.PORT, () => {
//             console.log(`🚀 Servidor corriendo en http://localhost:${envs.PORT}`);
//         });

//     } catch (error) {
//         console.error('❌ Error al iniciar el servidor:', error);
//         process.exit(1);
//     }
// }

// // Iniciar la aplicación
// startServer();

// // Manejo de cierre graceful (opcional pero recomendado)
// process.on('SIGINT', async () => {
//     console.log('\n🛑 Cerrando servidor...');
//     await AmqpLogger.close();
//     await mongoose.disconnect();
//     process.exit(0);
// });
// //testeo 2 EJS ////////////////////////////////////////////////////////////////////////////
import 'dotenv/config';
import mongoose from 'mongoose';
import { envs } from "./config/envs.js";
import app from "./app.js";  // ← Aquí estaba el error
import { initProducer, closeProducer } from "ds-logging-producer-kit";

mongoose.set('strictQuery', true);

// Manejadores de eventos de MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión a MongoDB:', err);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('✅ Conexión exitosa a MongoDB');
});

// Función principal para iniciar el servidor
const main = async () => {
    try {
        // 1. Conectar a MongoDB
        await mongoose.connect(envs.MONGODB_URI);
        
        // 2. Inicializar Producer de Logs (ds-logging-producer-kit)
        await initProducer();
        console.log('✅ Logger Producer inicializado');

        // 3. Iniciar el servidor Express
        const port = envs.PORT;
        app.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }

    // Función para cierre correcto de servicios
    const safeClose = async () => {
        try {
            console.log('\n🛑 Cerrando servidor...');
            await closeProducer();
            await mongoose.disconnect();
        } catch (err) {
            console.error('Error al cerrar servicios:', err);
        }
        process.exit(0);
    };

    process.once("SIGINT", safeClose);
    process.once("SIGTERM", safeClose);
};

// Iniciar la aplicación
main();