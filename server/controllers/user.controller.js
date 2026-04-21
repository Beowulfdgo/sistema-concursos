const User = require('../models/User');

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
exports.getMe = (req, res) => res.json(req.user.toJSON ? req.user.toJSON() : req.user);

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
    res.status(201).json(user.toJSON());
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
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario suspendido' });
  } catch (err) { next(err); }
};
