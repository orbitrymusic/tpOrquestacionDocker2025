import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js'; 
import { authorizeUser} from '../middleware/authorize.user.js';
import UserService from '../services/user.service.js'; 

const router = Router();

// 💡 RUTA PROTEGIDA: Solo usuarios con un token válido pueden acceder
router.get('/profile', verifyToken, async (req, res) => {
    
    const user = await UserService.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
    
    // La respuesta ya está sanitizada (sin contraseña) por el servicio.
    return res.status(200).json({ 
        message: 'Acceso concedido al perfil.',
        user: user,
        rol: user.rol // Usamos el rol que viene del objeto de la base de datos
    });
});

// Endpoint para actualizar el perfil: Requiere Autenticación Y Autorización
// Ejemplo: PUT /api/users/65f4d1e0d37e29c0d3a7b5e4
router.put('/:id', 
    verifyToken,   // 1. Revisa el JWT
    authorizeUser, // 2. Revisa si req.user.id coincide con req.params.id o si es admin
    async (req, res) => {
        try {
            const updatedUser = await UserService.update(req.params.id, req.body);
            if (!updatedUser) {
                return res.status(404).json({ message: "Usuario no encontrado para actualizar." });
            }
            res.status(200).json({ message: "Usuario actualizado exitosamente.", user: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Error al actualizar.", error: error.message });
        }
    }
);

export default router;