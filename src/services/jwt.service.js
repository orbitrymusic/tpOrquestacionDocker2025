import jwt from 'jsonwebtoken';
import { envs } from '../config/envs.js'; // Necesita el path relativo correcto a 'config'

/**
 * Genera un token JWT para un usuario dado.
 * El payload solo debe contener información no sensible (ID, email).
 * @param {object} user - Objeto de usuario de la base de datos (sin la contraseña).
 * @returns {string} Token JWT generado.
 */
export const generateToken = (user) => {
    // 1. Definir el PAYLOAD (los datos que van dentro del token)
    // El ID de MongoDB (_id) debe ser serializado a string para el JWT.
    const payload = {
        id: user._id.toString(), // CRÍTICO: Usar .toString() para asegurar la serialización
        email: user.email,
        nombre: user.nombre,
        rol: user.rol || 'default' // Aseguramos que siempre haya un rol para autorización
    };

    // 2. Firmar el token con la clave secreta y la expiración definidas en ENVS
    const token = jwt.sign(
        payload,
        envs.JWT_SECRET,
        { expiresIn: envs.JWT_EXPIRATION } 
    );

    return token;
};