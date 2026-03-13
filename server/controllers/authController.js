const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/emailService');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'El correo ya está registrado.' });

    const code = generateOTP();
    const user = await User.create({
      name, email, password, role: 'student', status: 'pending',
      verificationCode: crypto.createHash('sha256').update(code).digest('hex'),
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationEmail(email, name, code);
    res.status(201).json({ message: 'Cuenta creada. Revisa tu correo para verificar tu cuenta.', userId: user._id });
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const user = await User.findOne({ email, verificationCode: hashedCode, verificationExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Código inválido o expirado.' });

    user.status = 'active';
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();
    res.json({ message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' });
  } catch (err) { next(err); }
};

exports.resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, status: 'pending' });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado o ya verificado.' });

    const code = generateOTP();
    user.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(email, user.name, code);
    res.json({ message: 'Código reenviado.' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    if (user.status === 'pending')
      return res.status(403).json({ message: 'Debes verificar tu correo antes de iniciar sesión.', needsVerification: true, email });
    if (user.status === 'suspended')
      return res.status(403).json({ message: 'Tu cuenta ha sido suspendida.' });

    const payload = { id: user._id, role: user.role, name: user.name, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken, user: user.toJSON() });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Refresh token requerido.' });

    const decoded = verifyRefreshToken(token);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ _id: decoded.id, refreshToken: hashedToken });
    if (!user) return res.status(403).json({ message: 'Refresh token inválido.' });

    const payload = { id: user._id, role: user.role, name: user.name, email: user.email };
    const accessToken = generateAccessToken(payload);
    res.json({ accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return res.status(403).json({ message: 'Refresh token inválido o expirado.' });
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) { user.refreshToken = undefined; await user.save(); }
    res.clearCookie('refreshToken');
    res.json({ message: 'Sesión cerrada.' });
  } catch (err) { next(err); }
};
