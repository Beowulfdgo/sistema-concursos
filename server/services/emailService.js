const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (to, name, code) => {
  // For development, log to console if no email configured
  if (!process.env.EMAIL_USER) {
    console.log(`\n📧 VERIFICATION CODE for ${to}: ${code}\n`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Sistema de Concursos" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Código de verificación - Sistema de Concursos',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#f9f9f9;border-radius:10px;">
        <h2 style="color:#8B1A2A;">Verificación de cuenta</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu código de verificación es:</p>
        <div style="background:#8B1A2A;color:#fff;font-size:36px;letter-spacing:12px;text-align:center;padding:20px;border-radius:8px;margin:20px 0;">${code}</div>
        <p>Este código expira en <strong>15 minutos</strong>.</p>
        <p style="color:#999;font-size:12px;">Si no solicitaste esta verificación, ignora este mensaje.</p>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (to, name, code) => {
  if (!process.env.EMAIL_USER) {
    console.log(`\n📧 PASSWORD RESET CODE for ${to}: ${code}\n`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Sistema de Concursos" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Restablecimiento de contraseña',
    html: `<p>Hola ${name}, tu código de restablecimiento es: <strong>${code}</strong>. Expira en 15 minutos.</p>`,
  });
};
