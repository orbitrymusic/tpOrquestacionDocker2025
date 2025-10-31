import Usuario from '../models/User.entity.js';
import bcrypt from 'bcrypt';
import { generateToken } from './jwt.service.js'



class UserService {
  constructor() {
    this.model = Usuario;
  }

  async findById(id) {
    // Busca por ID y excluye la contraseña
    return await this.model.findById(id).select('-password');
  }

  async register(data) {
    console.log("Iniciando la función de registro...");
    try {
      const { nombre, email, password } = data;
      const newUser = new this.model({
        nombre,
        email,
        password: password,
      });

      const savedUser = await newUser.save(); // <-- Aquí esperamos que se guarde.
      return savedUser; // <-- Devolvemos el usuario guardado.

    } catch (error) {
      console.error("Error al guardar el usuario en la base de datos:", error);
      throw error; // <-- Lanzamos el error para que el controlador lo atrape.
    }
  }

  async login(email, password) {
    const user = await this.model.findOne({ email }).select('+password');
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return null; // Contraseña incorrecta
    }
    
    // Generar el Token JWT
    // Se asegura de que el campo 'password' NO esté incluido en el objeto retornado.
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    const token = generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token }; // <--- Retorna el usuario y el token
  }



  async getAll() {
    return this.model.find().select('-password');
  }




  //* modificar nombre usuario 
  async update(userId, updateData) {
    try {
      const user = await Usuario.findByIdAndUpdate(userId, updateData, { new: true });
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      throw error;
    }
  }
};

export default new UserService();