const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -verificationCode -refreshToken');
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Cuenta no activa' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const checkRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'No tienes permiso para esta acción' });
  next();
};

module.exports = { verifyJWT, checkRole };
