const crypto = require('crypto');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { sendVerificationEmail } = require('../services/emailService');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(+limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.createReviewer = async (req, res, next) => {
  try {
    const { name, email, password, institution, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'El correo ya está registrado.' });

    const user = await User.create({ name, email, password, role: 'reviewer', status: 'active', institution, phone });
    res.status(201).json({ message: 'Revisor creado exitosamente.', user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { password, role, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({ message: `Estado actualizado a ${status}.`, user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Check if user has active assignments
    const assignment = await Assignment.findOne({ reviewerId: req.params.id });
    if (assignment && assignment.projectIds && assignment.projectIds.length > 0) {
      return res.status(400).json({
        message: `No se puede eliminar al revisor ${user.name} porque tiene ${assignment.projectIds.length} proyecto(s) asignado(s). Por favor, reasigne o complete primero las evaluaciones.`,
        hasAssignments: true,
      });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Revisor eliminado correctamente.' });
  } catch (err) { next(err); }
};


exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};
