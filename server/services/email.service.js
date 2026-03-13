const nodemailer = require('nodemailer');

const createTransport = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: {
    // Esto evita fallos de autenticación por certificados en Docker
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
});

const sendVerificationEmail = async (to, name, code) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Concursos de Investigación" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verifica tu cuenta — Código de acceso',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px;">
        <h2 style="color: #8B1A2A; margin-top: 0;">Verificación de cuenta</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu código de verificación es:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B1A2A; text-align: center; padding: 20px; background: #f9ecee; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 13px;">Este código expira en <strong>15 minutos</strong>. No lo compartas con nadie.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, ignora este mensaje.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail };
