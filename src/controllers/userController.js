import UserService from '../services/userService.js';


//*REGISTRO DE USUARIO NUEVO
export const registerUser = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const savedUser = await UserService.register({ nombre, email, password });
    res.status(201).json({ message: 'Usuario registrado con éxito', user: savedUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya existe.' });
    }
    res.status(500).json({ message: 'Error en el registro', error });
  }
};

//*LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('✅ Datos recibidos para login:', { email, password });
    const user = await UserService.login(email, password);

    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
    }

    res.status(200).json({ message: 'Inicio de sesión exitoso.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el inicio de sesión', error });
  }
};


//* OBTENER TODOS LOS USUARIOS
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//*MODIFICACIÒN DE NOMBRE O MAIL
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;// <-- Aquí tomamos los datos del params :userID
    const updateData = req.body; // <-- Aquí tomamos los datos del cuerpo
    const user = await UserService.update(userId, updateData);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario actualizado exitosamente', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario', error });
  }
};
