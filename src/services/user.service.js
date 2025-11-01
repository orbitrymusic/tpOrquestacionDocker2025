import Usuario from '../models/User.entity.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from './jwt.service.js'
import AmqpLogger from './AmqpLogger.service.js';
import CoreClientService from './CoreClient.service.js';
import NotificationClientService from './notifyClient.service.js'; 
import { envs } from '../config/envs.js';


class UserService {
  constructor() {
    this.model = Usuario;
  }

  /**
   * Genera una contraseña temporal alfanumérica para el primer acceso.
   * @returns {string} Contraseña temporal sin hashear.
   */
  _generateTemporaryPassword() {
    // Implementación de una generación de contraseña segura (ajustada a tu necesidad)
    return crypto.randomBytes(4).toString('hex'); // 8 caracteres hexadecimales
  }

  /**
   * Sincroniza alumnos desde el microservicio CORE, actualizando o creando usuarios
   * con rol 'alumno' y emite logs de cada operación.
   */
  async syncAlumnosAndNotify() {
    const operationName = 'SINC_ALUMNOS';
    AmqpLogger.info(`[${operationName}] Iniciando proceso de sincronización de alumnos con CORE.`, { module: envs.moduleName });

    let coreAlumnos = [];
    let count = { created: 0, updated: 0, skipped: 0, total: 0 };
     const failedStudents = []; // Para capturar fallos internos

    try {
      // 1. Obtener datos del microservicio CORE
      coreAlumnos = await CoreClientService.getAlumnos();
      count.total = coreAlumnos.length;
      AmqpLogger.info(`[${operationName}] CORE entregó ${count.total} registros. Procesando...`);

    } catch (error) {
      // Si falla el CORE, registramos el error y terminamos la operación.
      AmqpLogger.error(`[${operationName}] Fallo al obtener datos del CORE. Operación abortada.`, { error: error.message });
      return { success: false, message: `Fallo al comunicarse con CORE: ${error.message}` };
    }

    // 2. Procesar los datos (Upsert: Actualizar o Insertar)
    for (const alumno of coreAlumnos) {
      // Usaremos el DNI o el ID Externo de CORE como identificadores únicos
      try {
        const existingUser = await this.model.findOne({
          $or: [{ dni: alumno.dni }, { id_externo_core: alumno.id_externo_core }]
        });

          // Asegurar que existan datos críticos antes de mapear
        if (!alumno.email || !alumno.dni || !alumno.id_externo_core) {
           throw new Error('Datos de alumno incompletos (requiere email, dni, id_externo_core).');
        }

        // Datos mapeados de CORE a nuestro modelo
        const mappedData = {
          nombre: alumno.nombre_completo, // 'nombre_completo' en CORE
          email: alumno.email,
          dni: alumno.dni,
          rol: alumno.rol || 'alumno',
          id_externo_core: alumno.id_externo_core,
        };

        if (existingUser) {
          // Caso A: El usuario ya existe (Actualización o Omisión)
          // Verificamos si los datos han cambiado o si el usuario estaba inactivo
          const isDataChanged =
            existingUser.nombre !== mappedData.nombre ||
            existingUser.email !== mappedData.email ||
            existingUser.rol !== mappedData.rol ||
            existingUser.estado === 'inactive';

          if (isDataChanged) {
            // Actualizamos datos y reactivamos si estaba inactivo
            const updatedFields = { ...mappedData, estado: 'active' };

            await this.model.updateOne({ _id: existingUser._id }, { $set: updatedFields });
            count.updated++;

            AmqpLogger.info(`[${operationName}] Usuario existente actualizado y/o reactivado.`, {
               userId: existingUser._id.toString(), // Convertir a string para el log
              dni: alumno.dni,
              accion: 'UPDATE_REACTIVATE'
            });
          } else {
            count.skipped++;
          }

        } else {
          // Caso B: El usuario NO existe (Creación)

          // Generar la contraseña temporal y segura antes de guardarla
          const temporaryPassword = this._generateTemporaryPassword();
          const newUser = await this.model.create({
            ...mappedData,
            password: temporaryPassword, // Mongoose lo hasheará en el hook 'pre-save'
            estado: 'active'
          });
          count.created++;

          AmqpLogger.info(`[${operationName}] Nuevo alumno creado con éxito.`, {
            userId: newUser._id.toString(), // Convertir a string para el log
            dni: alumno.dni,
            email: alumno.email,
            accion: 'CREATE_ACCOUNT'
          });

          //Llamada al microservicio de Notificaciones
          const notificationSuccess = await NotificationClientService.sendWelcomeEmail(
            newUser.email, 
            newUser.nombre, 
            temporaryPassword // CRÍTICO: Se envía la clave temporal SIN HASHEAR
          );
          
          if (!notificationSuccess) {
            AmqpLogger.error(`[${operationName}] Fallo al notificar al nuevo alumno ${newUser.email}.`, {
              userId: newUser._id.toString(),
              accion: 'NOTIFICATION_FAILURE'
            });
            // NOTA: No hacemos rollback; solo registramos el fallo de notificación.
          }
        }

      } catch (iterationError) {
        failedStudents.push({ dni: alumno.dni, reason: iterationError.message });
        AmqpLogger.error(`[${operationName}] Error al procesar alumno DNI ${alumno.dni}.`, {
          error: iterationError.message,
          alumno: alumno
        });
      }
    }

    // 3. Finalización y Resumen
    const summary = `Sincronización finalizada. Creados: ${count.created}, Actualizados/Reactivados: ${count.updated}, Omitidos: ${count.skipped}.`;
    AmqpLogger.info(`[${operationName}] ${summary}`, { module: envs.moduleName, summary: count });

    return { 
        success: true, 
        message: 'Sincronización completada con resumen.', 
        summary: { ...count, failedStudentsCount: failedStudents.length, failedStudents: failedStudents } 
    };
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