import Usuario from '../models/User.entity.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from './jwt.service.js'
// import { sendLog } from 'ds-logging-producer-kit';
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
//Función auxiliar para extraer mensajes detallados de Mongoose
  _formatMongooseError(error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return `Error de validación: ${messages.join('; ')}`;
    }
    // Para errores de índice único (duplicados, error.code === 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue).join(', ');
      return `Error de duplicado: El campo '${field}' ya existe.`;
    }
    return error.message;
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
      let failReason = ''; // Inicializamos la razón de fallo para este alumno
      try {
        // // Asegurar que existan datos críticos antes de mapear (primera capa de validación)
        // if (!alumno.email || !alumno.dni || !alumno.id_externo_core) {
        //    throw new Error('Datos de alumno incompletos (requiere email, dni, id_externo_core).');
        // }

        // Usaremos el DNI o el ID Externo de CORE como identificadores únicos
        const existingUser = await this.model.findOne({
          $or: [{ dni: alumno.dni }, { id_externo_core: alumno.id_externo_core }]
        });

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

            // Usamos findByIdAndUpdate para que se ejecuten las validaciones de Mongoose si aplica
            await this.model.findByIdAndUpdate(existingUser._id, updatedFields, { 
                runValidators: true, 
                new: true 
            });
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
            temporaryPassword //Se envía la clave temporal SIN HASHEAR
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
        //Usamos la función auxiliar para formatear el mensaje de Mongoose
        failReason = this._formatMongooseError(iterationError);

        // Si el alumno tiene DNI pero falló por validación de Mongoose, lo registramos
        failedStudents.push({ dni: alumno.dni, reason: failReason });
        AmqpLogger.error(`[${operationName}] Error al procesar alumno DNI ${alumno.dni || 'FALTA_DNI'}.`, {
          error: failReason, // Logueamos el mensaje formateado
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
      // const { nombre, email, password, rol } = data;
      // const newUser = new this.model({
      //   nombre,
      //   email,
      //   password: password,
      //   rol: rol,
      // });
      const newUser = new this.model({
        ...data, // Esto incluye nombre, email, password, rol, dni, id_externo_core, etc.
      });


      const savedUser = await newUser.save(); // <-- Aquí esperamos que se guarde.
      return savedUser; // <-- Devolvemos el usuario guardado.

    } catch (error) {
      console.error("Error al guardar el usuario en la base de datos:", error);
      throw error; // <-- Lanzamos el error para que el controlador lo atrape.
    }
  }
//////////////////////////////////////////////////"testeo Docker" ///////////////////7////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////////////
async login(dni, password) {
  console.log("🔐 [LOGIN] Iniciando proceso de login para DNI:", dni);
  
  // Buscar usuario solo por DNI
  const user = await this.model.findOne({ 
    dni: dni, 
    estado: 'active' 
  }).select('+password');
  
  console.log("👤 [LOGIN] Usuario encontrado:", user ? `Sí (${user.nombre})` : "No");
  
  if (!user) {
    console.log("⚠️ [LOGIN] Usuario no encontrado con DNI:", dni);
    return null;
  }

  console.log("🔑 [LOGIN] Verificando contraseña...");
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("🔑 [LOGIN] Contraseña válida:", isMatch ? "Sí" : "No");

  if (!isMatch) {
    console.log("⚠️ [LOGIN] Contraseña incorrecta para DNI:", dni);
    return null;
  }

  console.log("✅ [LOGIN] Login exitoso para:", user.nombre);

  // Generar token
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;
  const token = generateToken(userWithoutPassword);

  console.log("🎫 [LOGIN] Token generado correctamente");
  return { user: userWithoutPassword, token };
}
//////////////////////////////////////////////////////////////////////////////////////////////////
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