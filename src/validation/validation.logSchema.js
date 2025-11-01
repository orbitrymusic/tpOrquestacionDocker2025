
import Joi from 'joi';


// Esquema de validación para asegurar la estructura de cada log.
// CRÍTICO para asegurar la trazabilidad y la integridad del sistema de logs central.
export const logSchema = Joi.object({
    level: Joi.string().valid('info', 'error', 'warn').required(),
    timestamp: Joi.date().iso().required(),
    message: Joi.string().required(),
    // Propiedades adicionales para contexto/trazabilidad
    module: Joi.string().optional(),
    context: Joi.object().unknown(true).optional(),
});