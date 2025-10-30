import UserService from '../services/UserService.js';

// Asumo que tienes una función para manejar errores estandarizados
// import { handleError } from '../utils/handleError.js';

export const loginController = async (req, res) => {
    const { email, password } = req.body;

    // Validación de entrada (Joi o Express-Validator) va aquí...

    try {
        const result = await UserService.login(email, password);

        if (!result) {
            // Falla de autenticación (usuario no encontrado o contraseña incorrecta)
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Éxito: enviar el token al cliente.
        // No es necesario enviar el objeto user en el body, solo el token.
        return res.status(200).json({ 
            message: 'Login exitoso.',
            token: result.token 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor durante el login.' });
    }
};

