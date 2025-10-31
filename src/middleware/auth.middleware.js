import jwt from 'jsonwebtoken';
import { envs } from '../config/envs.js';

export const verifyToken = (req, res, next) => {
    // 1. Obtener el token del header de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }


    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido (se espera Bearer <token>).' });
    }

        // 2. Verificar el token
    try {
        const decoded = jwt.verify(token, envs.JWT_SECRET);

        // 3. Adjuntar el payload del token al objeto 'req'
        req.user = decoded;

        // 4. Continuar con la ejecución de la ruta
        next();

    } catch (error) {
        // Manejar errores de verificación (Token expirado, firma inválida, etc.)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido o corrupto.' });
        }

        console.error("Error al verificar JWT:", error);
        return res.status(500).json({ error: 'Error en la validación del token.' });
    }
};