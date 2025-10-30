import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
  }
  
}, 
{
  timestamps: true,
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