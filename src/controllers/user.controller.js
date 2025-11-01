import UserService from '../services/user.service.js';


//*REGISTRO DE USUARIO NUEVO
export const registerUser = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    // El servicio maneja el hash y guarda el usuario
    const savedUser = await UserService.register({ nombre, email, password });
    
    // Devolvemos una respuesta limpia sin la contraseña hasheada
    res.status(201).json({ 
        message: 'Usuario registrado con éxito', 
        user: {
            id: savedUser._id,
            email: savedUser.email,
            nombre: savedUser.nombre
        }
    });
  } catch (error) {
    if (error.code === 11000) {
      // 409 Conflict por email duplicado
      return res.status(409).json({ message: 'El correo electrónico ya existe.' });
    }
    console.error("Error en el registro:", error);
    res.status(500).json({ message: 'Error en el registro', error: error.message || error });
  }
};

//*LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Datos recibidos para login:', { email, password });
    const user = await UserService.login(email, password);

    if (!user) {
      return res.status(401).json(
        { message: 'Correo o contraseña incorrectos.' }
      );
    }

    res.status(200).json(
      { message: 'Inicio de sesión exitoso.',
        token: result.token, 
        user: result.user
     });
  } catch (error) {
    res.status(500).json({ message: 'Error en el inicio de sesión', error });
  }
};


//* === 2. CONTROLADORES PROTEGIDOS (Usados en /users) ===

//* OBTENER TODOS LOS USUARIOS (Solo Admin)
export const getAllUsersController = async (req, res) => {
  try {
    // El servicio ya filtra por estado 'active' y excluye la contraseña.
    const users = await UserService.getAll();
    res.status(200).json({ message: 'Lista de usuarios activos.', users: users });
  } catch (error) {
    console.error("Error al obtener todos los usuarios:", error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

//* MODIFICACIÓN DE DATOS (Self-Service o Admin)
 
export const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id; // Correcto: se espera 'id' del parámetro de ruta
    const updateData = req.body; 

    const updatedUser = await UserService.update(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo.' }); 
    }
    
    res.status(200).json({ 
        message: 'Usuario actualizado exitosamente.', 
        user: updatedUser 
    });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
  }
};

//* ELIMINACIÓN LÓGICA (Solo Admin)
export const deleteUserController = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const deletedUser = await UserService.delete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado o ya estaba inactivo.' });
        }

        res.status(200).json({ 
            message: 'Usuario eliminado lógicamente (estado: inactive).', 
            user: {
                id: deletedUser._id,
                email: deletedUser.email,
                estado: deletedUser.estado
            }
        });
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        res.status(500).json({ message: 'Error al procesar la eliminación', error: error.message });
    }
};
