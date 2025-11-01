import { envs } from '../config/envs.js';

// --- CONFIGURACIÓN DE SEGURIDAD ---

// Headers base para comunicación de servicio a servicio (S2S)
const S2S_HEADERS = {
    'Content-Type': 'application/json',
    // CRÍTICO: Clave de autenticación para el CORE
    'X-API-Key': envs.CORE_API_KEY 
};

// --- CLIENTES ESPECÍFICOS ---

/**
 * Cliente para el Servicio Externo CORE (Preinscripciones).
 */
export const CoreClient = {

    /**
     * Realiza una solicitud GET al endpoint de alumnos aprobados.
     * @param {string} endpoint - La parte del path después de la URL base (ej: '/alumnos/aprobados/definitivo')
     * @returns {Promise<Array<object>>} La lista de alumnos.
     */
    async getApprovedAlumnos (endpoint = '/alumnos/aprobados/definitivo') {
        const url = `${envs.API_CORE_URL}${endpoint}`;
        
        console.log(`[HTTP Client] Llamando al CORE: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: S2S_HEADERS,
            });

            if (!response.ok) {
                // Maneja respuestas no exitosas del CORE (ej: 401, 404, 500)
                const errorBody = await response.json();
                console.error(`Error del CORE en ${url}: ${response.status} - ${errorBody.message || 'Error desconocido'}`);
                // Lanzamos un error específico para que el servicio lo capture
                throw new Error(`CORE_API_ERROR: ${response.status} - ${errorBody.message || 'Fallo al obtener alumnos'}`);
            }

            // Asumiendo que la respuesta es un array JSON de alumnos
            return response.json();

        } catch (error) {
            console.error('[HTTP Client] Error de conexión al CORE:', error.message);
            throw new Error(`CORE_CONNECTION_FAILED: ${error.message}`);
        }
    }
};

/**
 * Cliente para el Servicio Externo de LOGS (Broker de Mensajes).
 * ⚠️ ATENCIÓN: Basado en la especificación, este servicio NO usa HTTP,
 * sino un BROKER de Mensajes (AMQP). Esta función es un MOCK
 * y debe ser reemplazada por una implementación real de AMQP (ej: amqplib).
 * El proceso de registro de usuarios NO debe fallar si la notificación al log falla.
 */
export const LogsMessageBrokerClient = {
    
    /**
     * Envía una notificación de registro de nuevo usuario al BROKER de Mensajes.
     * @param {object} logData - Datos a registrar (ej: id_usuario, email, accion, modulo)
     * @returns {Promise<void>}
     */
    async notifyNewUser(logData) {
        // [TODO CRÍTICO]: Implementar la conexión AMQP real aquí (se requiere librería 'amqplib').
        // Se usarán las variables AMQP_HOST, AMQP_USER, AMQP_EXCHANGE, etc.
        
        console.log(`[BROKER] Intentando notificar nuevo usuario al Exchange: ${envs.AMQP_EXCHANGE || 'logs.exchange (MOCK)'}`);
        console.log(`[BROKER] Datos a enviar:`, logData);

        try {
            // --- MOCK DE TIEMPO DE ESPERA PARA SIMULAR LA PUBLICACIÓN ---
            // Simulación de la conexión, canal y publicación
            await new Promise(resolve => setTimeout(resolve, 50)); 
            // -----------------------------------------------------------

            console.log('[LOGS OK] Notificación simulada enviada al Message Broker con éxito.');

        } catch (error) {
            // Logueamos el error de conexión/publicación, pero NO hacemos throw.
            console.error('[LOGS ERROR] Falló la conexión/publicación al servicio de Logs (AMQP):', error.message);
        }
    }
};
