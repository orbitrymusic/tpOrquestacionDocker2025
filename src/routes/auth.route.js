import { Router } from 'express';
// 1. Importamos AMBOS controladores de auth
import { loginController, registerController } from '../controllers/auth.controller.js';

const router = Router();

// 💡 RUTA PÚBLICA: Registro (POST /api/auth/register)
// Crea un nuevo usuario.
router.post('/register', registerController);

// 💡 RUTA PÚBLICA: Iniciar sesión (POST /api/auth/login)
// Devuelve el token JWT si es exitoso.
router.post('/login', loginController);

// 3. Exportamos el objeto router completo
export default router;