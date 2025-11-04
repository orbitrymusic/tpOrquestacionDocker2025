import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../config/const.js';


// esquema de mongoose
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false, //No se envía la contraseña en las consultas por defecto
  },
  //Rol para la autorización (RBAC)
  rol: { 
    type: String, 
    enum: USER_ROLES, 
    default: 'alumno',
    required: true // El campo rol debe ser requerido para la autorización
  }, 
    estado: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }, 
   // === CAMPOS AÑADIDOS PARA SINCRONIZACIÓN CON CORE ===
  dni: { 
    type: String, 
    required: false, 
    unique: true, // CRÍTICO: Debe ser único para identificación
  },
  id_externo_core: {
    type: String,
    required: false, // Ahora es opcional en la creación
    unique: true,
    sparse: true // Permite múltiples valores nulos
  },
  
}, 
{
  timestamps: true,
  versionKey: false  //oculta el campo __V
});

//pre-save hook de mongoose mas seguridad al hashear las pass..
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Usuario = mongoose.model('User', usuarioSchema);

export default Usuario;