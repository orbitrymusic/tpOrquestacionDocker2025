
////////////////////////////////////////////////////////////////////////////////
import mongoose from 'mongoose';
// import { initProducer, closeProducer } from 'ds-logging-producer-kit';
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

// Función para inicializar AMQP solo si están las variables
async function initLoggingIfConfigured() {
  const hasAmqp = envs.amqpUser && envs.amqpPass && envs.amqpHost;
  if (!hasAmqp) {
    console.log('AMQP variables not set — skipping RabbitMQ connection (logging disabled)');
    return;
  }

  try {
    // si vas a usar initProducer, descomenta y pasa las variables correctas
    // await initProducer({
    //   AMQP_USER: envs.amqpUser,
    //   AMQP_PASS: envs.amqpPass,
    //   AMQP_HOST: envs.amqpHost,
    //   AMQP_PORT: envs.amqpPort,
    //   AMQP_VHOST: envs.amqpVhost,
    //   AMQP_EXCHANGE: envs.amqpExchange,
    //   AMQP_ROUTING_KEY: envs.amqpRoutingKey,
    //   MODULE_NAME: envs.moduleName,
    //   VALIDATE: envs.validateLogs
    // });

    // Si usás conexión manual con amqplib, arma la URI escapando la contraseña:
    // const user = envs.amqpUser;
    // const pass = encodeURIComponent(envs.amqpPass);
    // const host = envs.amqpHost;
    // const port = envs.amqpPort || 5672;
    // const vhost = envs.amqpVhost ? `/${envs.amqpVhost.replace(/^\//, '')}` : '';
    // const amqpUri = `amqp://${user}:${pass}@${host}:${port}${vhost}`;
    // console.log('Connecting to RabbitMQ:', amqpUri);
    // ... conectar y crear channel ...

    console.log('✅ Logger enabled (init skipped in this template)');
  } catch (err) {
    console.error('❌ AMQP connection failed (logging disabled):', err.message || err);
    // NO lanzo error: no debe impedir que el servidor arranque
  }
}

// Función principal para iniciar el servidor
const main = async () => {
  try {
    // 1. Conectar a MongoDB
    await mongoose.connect(envs.MONGODB_URI);

    // 2. Inicializar logging solo si corresponde
    await initLoggingIfConfigured();

    // 3. Iniciar el servidor Express
    const port = envs.PORT || 4000;
    // Escuchar en 0.0.0.0 para que Docker pueda mapear el puerto correctamente
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${port} (host: http://localhost:${port})`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message || error);
    process.exit(1);
  }
};

// Iniciar la aplicación
main();

// Función para cierre correcto de servicios
const safeClose = async () => {
  try {
    console.log('\n🛑 Cerrando servidor...');
    // if (closeProducer) await closeProducer();
    await mongoose.disconnect();
    console.log('✅ Conexiones cerradas correctamente');
  } catch (err) {
    console.error('Error al cerrar servicios:', err);
  }
  process.exit(0);
};

process.once('SIGINT', safeClose);
process.once('SIGTERM', safeClose);
