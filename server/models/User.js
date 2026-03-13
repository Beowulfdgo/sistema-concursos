const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'reviewer', 'student'], default: 'student' },
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  verificationCode: { type: String },
  verificationExpires: { type: Date },
  refreshToken: { type: String },
  institution: { type: String },
  phone: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationCode;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
