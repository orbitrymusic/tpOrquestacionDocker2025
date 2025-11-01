import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeUser } from '../middleware/authorize.user.js';
import { authorizeRole } from '../middleware/authorize.role.js';
import UserService from '../services/user.service.js';
import {
    getAllUsersController,
    updateUserController,
    deleteUserController,
    syncAlumnosController
} from '../controllers/user.controller.js';

const router = Router();


// NUEVA RUTA: SINCRONIZACIÓN CORE
/**
 * @route POST /api/users/sync
 * @description Inicia el proceso de sincronización anual/masiva de alumnos desde CORE.
 * CRÍTICO: Debe ser protegido solo para 'admin' o 'secretaria'.
 */
router.post('/sync',
    verifyToken,
    // 💡 AHORA PERMITE AMBOS ROLES: admin Y secretaria
    authorizeRole(['admin', 'secretaria']), 
    syncAlumnosController
);

// === RUTAS DE GESTIÓN DE USUARIOS ===

// 1. OBTENER TODOS LOS USUARIOS ACTIVOS (Listado)
// Requiere: Token válido Y rol 'admin' o 'secretaria'
router.get('/',
    verifyToken,
    // 💡 Aplica la autorización de rol múltiple
    authorizeRole(['admin', 'secretaria']),
    getAllUsersController
);

router.get('/profile', verifyToken, async (req, res) => {

    const user = await UserService.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    return res.status(200).json({
        message: 'Acceso concedido al perfil.',
        user: user,
        rol: user.rol
    });
});

// 3. ACTUALIZAR PERFIL
// Permisos: Propietario del token, 'admin' o 'secretaria'.
router.put('/:id',
    verifyToken,
    authorizeUser,
    updateUserController
);

// 4. ELIMINACIÓN LÓGICA
// Requiere: Token válido Y rol 'admin' o 'secretaria'
router.delete('/:id',
    verifyToken,
    authorizeRole(['admin', 'secretaria']),
    deleteUserController
);

export default router;