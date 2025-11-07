import UserService from '../services/user.service.js';

// Asumo que tienes una función para manejar errores estandarizados
// import { handleError } from '../utils/handleError.js';

export const loginController = async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress //test  nuevo
    // TODO: Validación de entrada (Joi o Express-Validator)

    try {
        const result = await UserService.login(email, password, clientIp);

        if (!result) {
            // Falla de autenticación (usuario no encontrado o contraseña incorrecta)
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Éxito: enviar el token al cliente.
        // No es necesario enviar el objeto user en el body, solo el token.
        return res.status(200).json({
            message: 'Login exitoso.',
            token: result.token,
            user: result.user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor durante el login.' });
    }
};

//Controlador para el registro de nuevos usuarios
export const registerController = async (req, res) => {

    const { nombre, email, password, rol, dni } = req.body;


    console.log("DEBUG: Datos recibidos en el controlador para registro:", { nombre, email, password, rol, dni });
    // TODO: Validación de entrada (mismos campos requeridos, formato de email, seguridad de password)

    try {
        // 1. Llamar al servicio que maneja la lógica de negocio (cifrado, guardado)

        const newUser = await UserService.register({ nombre, email, password, rol, dni });

        return res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: {
                id: newUser._id,
                nombre: newUser.nombre,
                email: newUser.email,
                rol: newUser.rol,
                dni: newUser.dni
            }
        });

    } catch (error) {
        // Manejo de errores comunes (ej. email o DNI duplicado)
        if (error.code === 11000) { // Código de error de duplicidad de Mongo
            return res.status(409).json({ error: 'El email o DNI proporcionado ya está registrado.' });
        }
        console.error("Error en registerController:", error);
        return res.status(500).json({ error: 'Error interno del servidor durante el registro.' });
    }
};
