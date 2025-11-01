//! Este módulo gestiona la conexión a RabbitMQ y expone métodos sencillos (info, error, etc.) 
// !para enviar logs con trazabilidad al Exchange configurado.

import amqp from 'amqplib';
import { envs } from '../config/envs.js';
import { logSchema} from '../validation/validation.logSchema.js';

class AmqpLoggerService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchangeName = envs.amqpExchange;
        this.routingKey = envs.amqpRoutingKey;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 segundos
    }

    /**
     * Construye la URL de conexión AMQP a partir de las variables de entorno.
     * @returns {string} La URI completa de conexión.
     */
    _getAmqpUrl() {
        return `amqp://${envs.amqpUser}:${envs.amqpPass}@${envs.amqpHost}:${envs.amqpPort}${envs.amqpVhost}`;
    }

    /**
     * Intenta conectar al broker de mensajes AMQP. Usa reintentos si falla.
     */
    async connect(attempt = 1) {
        if (this.connection) return;

        const amqpUrl = this._getAmqpUrl();

        try {
            console.log(`[LOGGER] Conectando a AMQP en ${amqpUrl}... (Intento ${attempt}/${this.maxRetries})`);
            this.connection = await amqp.connect(amqpUrl);
            this.channel = await this.connection.createChannel();

            // Asegurar que el Exchange existe
            await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
            
            console.log('[LOGGER] Conexión AMQP exitosa. Logger listo.');
            
            // Manejar cierres inesperados
            this.connection.on('close', () => {
                console.error('[LOGGER] Conexión AMQP cerrada. Reconectando...');
                this.connection = null; // Limpiar para forzar reconexión
                setTimeout(() => this.connect(), this.retryDelay);
            });

            this.connection.on('error', (err) => {
                console.error('[LOGGER] Error de conexión AMQP:', err.message);
            });

        } catch (error) {
            console.error(`[LOGGER] Error al conectar a AMQP: ${error.message}`);
            if (attempt < this.maxRetries) {
                console.log(`[LOGGER] Reintentando en ${this.retryDelay / 1000} segundos...`);
                setTimeout(() => this.connect(attempt + 1), this.retryDelay);
            } else {
                console.error('[LOGGER] Fallo la conexión AMQP después de varios intentos. Los logs serán omitidos.');
            }
        }
    }

    /**
     * Cierra la conexión AMQP, importante al apagar el servidor.
     */
    async close() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
            this.channel = null;
            console.log('[LOGGER] Conexión AMQP cerrada.');
        }
    }

    /**
     * Publica un mensaje de log en el Exchange AMQP.
     * @param {string} level - Nivel del log (info, error, warn).
     * @param {string} message - Mensaje principal del log.
     * @param {object} [context={}] - Datos adicionales para trazabilidad.
     * @param {string} [routingKey=this.routingKey] - Clave de ruteo para el mensaje.
     */
    async publish(level, message, context = {}, routingKey = this.routingKey) {
        if (!this.channel) {
            // Si la conexión falló o no está lista, solo se loguea en consola.
            console.warn(`[LOGGER_SKIP] ${level.toUpperCase()} [${context.module || envs.moduleName}]: ${message}`, context);
            return;
        }
        
        // 1. Crear el objeto de log
        const logEntry = {
            level: level,
            timestamp: new Date().toISOString(),
            message: message,
            module: envs.moduleName, // Módulo de origen (Auth_Service)
            context: context,
        };

        // 2. Validar (si está habilitado en las ENVS)
        if (envs.validateLogs) {
            const { error } = logSchema.validate(logEntry);
            if (error) {
                console.error(`[LOGGER_VALIDATION_ERROR] El log no es válido: ${error.message}. Log:`, logEntry);
                return; // No publicar logs mal formados
            }
        }

        // 3. Publicar en RabbitMQ
        try {
            const buffer = Buffer.from(JSON.stringify(logEntry));
            
            // Utilizamos una clave de ruteo específica basada en el nivel: logs.<nivel>
            const finalRoutingKey = `logs.${level}`; 
            
            this.channel.publish(
                this.exchangeName, 
                finalRoutingKey, // ej: logs.info, logs.error
                buffer, 
                { persistent: true } // Hace el mensaje duradero
            );
            
            // Opcional: Loguear en consola para desarrollo
            if (envs.nodeEnv === 'development') {
                console.log(`[LOGGER_SENT] ${level.toUpperCase()} -> ${finalRoutingKey}: ${message}`);
            }

        } catch (publishError) {
            console.error('[LOGGER_PUBLISH_ERROR] Fallo al publicar el mensaje en AMQP:', publishError.message);
            // El canal podría estar roto, se intentará reconectar en el evento 'close'.
        }
    }

    // === MÉTODOS PÚBLICOS DE FÁCIL ACCESO ===

    info(message, context = {}) {
        this.publish('info', message, context);
    }

    error(message, context = {}) {
        this.publish('error', message, context);
    }

    warn(message, context = {}) {
        this.publish('warn', message, context);
    }
}

export default new AmqpLoggerService();