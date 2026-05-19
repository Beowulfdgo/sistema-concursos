const User = require('../models/User');
const Assignment = require('../models/Assignment');

// GET /users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    const users = await User.find(filter).select('-password -verificationCode -refreshToken')
      .sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /users/me
exports.getMe = (req, res) => res.json(req.user.toSafeObject ? req.user.toSafeObject() : req.user);

// GET /users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationCode -refreshToken');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
};

// POST /users/reviewer
exports.createReviewer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'El email ya está registrado' });
    const user = await User.create({ name, email, password, role: 'reviewer', status: 'active' });
    res.status(201).json(user.toSafeObject());
  } catch (err) { next(err); }
};

// PUT /users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'email'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password -verificationCode -refreshToken');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
};

// PATCH /users/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'pending'].includes(status))
      return res.status(400).json({ message: 'Estado inválido' });
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .select('-password -verificationCode -refreshToken');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
};

// DELETE /users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Check if reviewer has active assignments with projects
    if (user.role === 'reviewer') {
      const assignment = await Assignment.findOne({ reviewerId: req.params.id });
      if (assignment && assignment.projectIds && assignment.projectIds.length > 0) {
        return res.status(400).json({
          message: `No se puede eliminar al revisor ${user.name} porque tiene ${assignment.projectIds.length} proyecto(s) asignado(s). Por favor, reasigne o complete primero las evaluaciones.`,
          hasAssignments: true,
        });
      }
    }

    // Check if student has assigned projects
    if (user.role === 'student') {
      const Project = require('../models/Project');
      const projects = await Project.find({ representative: req.params.id });
      if (projects && projects.length > 0) {
        return res.status(400).json({
          message: `No se puede eliminar al alumno ${user.name} porque tiene ${projects.length} proyecto(s) asignado(s). Por favor, reasigne o elimine los proyectos primero.`,
          hasAssignments: true,
          projectCount: projects.length,
        });
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `${user.role === 'reviewer' ? 'Revisor' : 'Alumno'} eliminado correctamente` });
  } catch (err) { next(err); }
};
