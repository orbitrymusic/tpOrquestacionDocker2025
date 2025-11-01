import AmqpLogger from './AmqpLogger.service.js';
import { envs } from '../config/envs.js';

/**
 * Cliente para comunicarse con el Microservicio de Notificaciones.
 * Simula una llamada HTTP/RPC a otro servicio para enviar correos electrónicos.
 */
class NotificationClientService {

    /**
     * @property {string} NOTIFICATION_SERVICE_URL - URL base del microservicio de notificaciones,
     * obtenida de las variables de entorno.
     */
    constructor() {
        // La URL debe estar definida en el archivo de entorno (.env) como NOTIFICATION_SERVICE_URL
        this.NOTIFICATION_SERVICE_URL = envs.NOTIFICATION_SERVICE_URL;
    }

    /**
     * Envía un correo electrónico de bienvenida a un nuevo usuario con su contraseña temporal.
     * * @param {string} email - Correo electrónico del destinatario.
     * @param {string} userName - Nombre completo del destinatario.
     * @param {string} temporaryPassword - Contraseña temporal NO HASHEADA.
     * @returns {Promise<boolean>} True si la notificación fue exitosa, false en caso contrario.
     */
    async sendWelcomeEmail(email, userName, temporaryPassword) {
        const endpoint = `${this.NOTIFICATION_SERVICE_URL}/send/welcome`;
        const payload = {
            recipientEmail: email,
            recipientName: userName,
            temporaryPassword: temporaryPassword
        };

        try {
            // Aquí lo simulamos con un 'fetch'.
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Registramos un error si la respuesta HTTP no es 2xx
                AmqpLogger.error(
                    `[NOTIFICATION_CLIENT] Fallo al enviar email a ${email}. Código: ${response.status}`,
                    {
                        status: response.status,
                        responseBody: errorText,
                        payload: payload
                    }
                );
                return false;
            }

            AmqpLogger.info(`[NOTIFICATION_CLIENT] Email de bienvenida enviado con éxito a ${email}.`);
            return true;

        } catch (error) {
            // Registramos un error si falla la conexión (ej. el microservicio está caído)
            AmqpLogger.error(
                `[NOTIFICATION_CLIENT] Error de conexión al notificar a ${email}.`,
                {
                    error: error.message,
                    endpoint: endpoint,
                    payload: payload
                }
            );
            return false;
        }
    }

    // [Añadir otros métodos de notificación aquí, ej. sendPasswordReset, sendReport, etc.]
}

// Exportamos la instancia singleton
export default new NotificationClientService();
