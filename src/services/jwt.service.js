import jwt from 'jsonwebtoken';
import { envs } from '../config/envs.js'; // Asumo que tus variables están aquí

/**
 * Genera un token JWT para un usuario dado.
 * @param {object} user - Objeto de usuario de la base de datos.
 * @returns {string} El token JWT generado.
 */
export const generateToken = (user) => {
    // 1. Definir el PAYLOAD (los datos que van dentro del token)
    // Usamos los campos críticos para la Autorización (ID, Rol, Email).
    const payload = {
        id: user._id, // Usamos el ID de MongoDB
        email: user.email,
        // CRÍTICO: Debes asegurar que el campo 'rol' exista en tu modelo.
        // Asumo que el modelo Usuario tiene un campo 'rol' o lo obtendrás.
        rol: user.rol || 'alumno', 
        // Si tienes permisos específicos, agrégalos aquí:
        // permisos: user.permisos || [] 
    };

    // 2. Firmar el token
    const token = jwt.sign(
        payload,
        envs.JWT_SECRET, // Clave secreta del .env
        { expiresIn: envs.JWT_EXPIRATION } // Tiempo de expiración del .env (ej. '1h')
    );

    return token;
};

// NOTA: La función de verificación (middleware) la haremos en el Paso 3.