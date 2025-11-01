import Usuario from '../models/User.entity.js';
import bcrypt from 'bcrypt';
import { generateToken } from './jwt.service.js'



class UserService {
  constructor() {
    this.model = Usuario;
  }

  async findById(id) {
    // Busca por ID y excluye la contraseña
    return await this.model.findOne({ _id: id, estado: 'active' }).select('-password');
  }

  async register(data) {
    console.log("Iniciando la función de registro...");
    try {
      const { nombre, email, password, rol } = data;
      const newUser = new this.model({
        nombre,
        email,
        password: password,
        rol: rol,
      });

      const savedUser = await newUser.save(); // <-- Aquí esperamos que se guarde.
      return savedUser; // <-- Devolvemos el usuario guardado.

    } catch (error) {
      console.error("Error al guardar el usuario en la base de datos:", error);
      throw error; // <-- Lanzamos el error para que el controlador lo atrape.
    }
  }

  async login(email, password) {
    const user = await this.model.findOne({ email, estado: 'active' }).select('+password');
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
    //Filtrar solo usuarios 'active' y excluir la contraseña
    return this.model.find({ estado: 'active' }).select('-password');
  }
  /**
     * Modifica los datos de un usuario. Solo permite la actualización si el estado es 'active'.
     * @param {string} userId - ID del usuario a actualizar.
     * @param {object} updateData - Datos a modificar.
     * @returns {Promise<object | null>} Usuario actualizado o null.
     */



  //* modificar nombre usuario 
  async update(userId, updateData) {
    try {
      const user = await this.model.findOneAndUpdate(
        { _id: userId, estado: 'active' },
        updateData,
        { new: true }

      ).select('-password');

      if (!user) {
        return null; // No encontrado o ya estaba inactivo
      }
      return user;
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      throw error;
    }
  }

  /**
 * Realiza un Borrado Lógico (Soft Delete) cambiando el estado a 'inactive'.
 * @param {string} userId - ID del usuario a "eliminar".
 * @returns {Promise<object | null>} Usuario con estado 'inactive' o null.
 */
  async delete(userId) {
    try {
      const deletedUser = await this.model.findOneAndUpdate(
        { _id: userId, estado: 'active' }, // Condición: solo borrar si está activo
        { estado: 'inactive' },
        { new: true }
      ).select('-password'); // Excluir la contraseña

      return deletedUser;
    } catch (error) {
      console.error("Error al realizar borrado lógico:", error);
      throw error;
    }
  }


};

export default new UserService();