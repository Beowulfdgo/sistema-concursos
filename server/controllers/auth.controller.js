const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/email.service');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'El email ya está registrado' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const user = await User.create({
      name, email, password, role: 'student',
      status: 'pending',
      verificationCode: code,
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationEmail(email, name, code).catch(err => console.error('Email error:', err));
    res.status(201).json({ message: 'Cuenta creada. Revisa tu correo para verificar.', userId: user._id });
  } catch (err) { next(err); }
};

// POST /auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.status === 'active') return res.status(400).json({ message: 'Cuenta ya verificada' });
    if (!user.verificationCode || user.verificationExpires < new Date())
      return res.status(400).json({ message: 'Código expirado. Solicita uno nuevo.' });
    if (user.verificationCode !== code)
      return res.status(400).json({ message: 'Código incorrecto' });

    user.status = 'active';
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();
    res.json({ message: 'Cuenta verificada exitosamente' });
  } catch (err) { next(err); }
};

// POST /auth/resend-code
exports.resendCode = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.status === 'active') return res.status(400).json({ message: 'Cuenta ya verificada' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.verificationCode = code;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(user.email, user.name, code).catch(e => console.error(e));
    res.json({ message: 'Código reenviado' });
  } catch (err) { next(err); }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
    if (user.status === 'pending') return res.status(403).json({ message: 'Verifica tu email primero', userId: user._id });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Cuenta suspendida' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ accessToken, user: user.toJSON() });
  } catch (err) { next(err); }
};

// POST /auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No hay refresh token' });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token)
      return res.status(401).json({ message: 'Refresh token inválido' });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Refresh token expirado o inválido' });
  }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) { user.refreshToken = undefined; await user.save(); }
    res.clearCookie('refreshToken');
    res.json({ message: 'Sesión cerrada' });
  } catch (err) { next(err); }
};
