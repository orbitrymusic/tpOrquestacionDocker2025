//! Este servicio es el encargado de la comunicación HTTP con tu microservicio CORE. 
//! Utiliza las variables de entorno para la URL base y la clave de seguridad (CORE_API_KEY)

import { envs } from '../config/envs.js';
import AmqpLogger from './AmqpLogger.service.js'; 



/**
 * Servicio Cliente HTTP dedicado a interactuar con el Microservicio CORE.
 * Se encarga de la seguridad (API Key) y el manejo de errores de red/API.
 */
class CoreClientService {
    constructor() {
        this.baseUrl = envs.apiCoreUrl;
        this.apiKey = envs.coreApiKey;
        
        if (!this.baseUrl || !this.apiKey) {
            console.error('[CORE CLIENT] Variables de entorno API_CORE_URL o CORE_API_KEY no configuradas. El cliente CORE no funcionará.');
        }
    }

    /**
     * Realiza una petición GET a un endpoint específico de CORE.
     * @param {string} endpoint - La ruta específica a consultar (ej: '/alumnos').
     * @returns {Promise<any>} Los datos de la respuesta en formato JSON.
     * @throws {Error} Si la petición falla o la respuesta no es 2xx.
     */
    async _fetchCore(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    //Incluir la clave de seguridad para la autenticación en CORE
                    'x-api-key': this.apiKey, 
                },
            });

            // Si la respuesta no es exitosa (4xx, 5xx)
            if (!response.ok) {
                // Intenta leer el cuerpo del error si está disponible
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));

                 // Logueamos el error específico en nuestro sistema de logging centralizado
                AmqpLogger.error(
                    `[CORE CLIENT] Fallo en la petición GET a ${url}.`, 
                    { 
                        status: response.status, 
                        errorDetails: errorBody,
                        endpoint: url
                    }
                );
                throw new Error(`CORE_CLIENT_ERROR: Fallo en la petición a ${url}. Código: ${response.status}. Detalle: ${errorBody.message || JSON.stringify(errorBody)}`);
            }

            // Si la respuesta es exitosa (2xx), retorna el JSON.
            return response.json();

        } catch (error) {
            // Loguear el error de red (Timeouts, DNS, etc.)
            AmqpLogger.error(`[CORE CLIENT ERROR] Error de red al intentar acceder a CORE: ${error.message}`, { endpoint: url });
            throw error; // Propagar el error para que el UserService lo maneje.
        }
    }

    /**
     * Obtiene la lista completa de alumnos desde el microservicio CORE.
     * Endpoint esperado: /alumnos
     * @returns {Promise<Array<object>>} Array de objetos de alumno.
     */
  async getAlumnos() {
        // En este punto, el UserService ya logueó el inicio de la sincronización.
        const alumnos = await this._fetchCore('/alumnos');
        // El UserService es el encargado de loguear la cantidad de alumnos recibidos.
        return alumnos;
    }

    // Puedes añadir más métodos aquí (ej: getCursos, getCarreras) si fueran necesarios
}

export default new CoreClientService();