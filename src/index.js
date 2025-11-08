
////////////////////////////////////////////////////////////////////////////////
import mongoose from 'mongoose';
import { initProducer, closeProducer } from 'ds-logging-producer-kit';
import { envs } from './config/envs.js';
import app from './app.js';

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
        
        // 2. Inicializar Producer de Logs con CREDENCIALES DEL AUTH_SERVICE
        await initProducer({
            AMQP_USER: envs.amqpUser,
            AMQP_PASS: envs.amqpPass,
            AMQP_HOST: envs.amqpHost,
            AMQP_PORT: envs.amqpPort,
            AMQP_VHOST: envs.amqpVhost,
            AMQP_EXCHANGE: envs.amqpExchange,
            AMQP_ROUTING_KEY: envs.amqpRoutingKey,
            MODULE_NAME: envs.moduleName,
            VALIDATE: envs.validateLogs
        });
        
        console.log('✅ Logger Producer inicializado y conectado a RabbitMQ');

        // 3. Iniciar el servidor Express
        const port = envs.PORT;
        app.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

// Iniciar la aplicación
main();

// Función para cierre correcto de servicios
const safeClose = async () => {
    try {
        console.log('\n🛑 Cerrando servidor...');
        await closeProducer();
        await mongoose.disconnect();
        console.log('✅ Conexiones cerradas correctamente');
    } catch (err) {
        console.error('Error al cerrar servicios:', err);
    }
    process.exit(0);
};

process.once("SIGINT", safeClose);
process.once("SIGTERM", safeClose);