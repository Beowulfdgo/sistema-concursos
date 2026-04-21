const { Resend } = require('resend');

// Lazy initialization de Resend para permitir desarrollo sin API key
let resend = null;

const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const sendVerificationEmail = async (to, name, code) => {
  const client = getResendClient();
  
  // Si no hay cliente Resend configurado, log en consola (desarrollo)
  if (!client) {
    console.log(`\n📧 VERIFICATION EMAIL would be sent to ${to}`);
    console.log(`📋 Name: ${name}`);
    console.log(`🔐 Code: ${code}\n`);
    return { id: 'dev-mode' };
  }

  // Construir campo FROM - debe ser un email verificado en Resend
  // Formatos válidos: "email@example.com" o "Name <email@example.com>"
  let from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  
  if (!from) {
    console.error('❌ EMAIL_FROM o EMAIL_USER no configurados en variables de entorno');
    throw new Error('Email configuration missing. Set EMAIL_FROM or EMAIL_USER in environment variables');
  }

  // Asegurar que el formato sea válido (si no tiene <>, agregar nombre)
  if (from && !from.includes('@')) {
    console.error(`❌ EMAIL_FROM/EMAIL_USER inválido: ${from}`);
    throw new Error('Invalid email format in EMAIL_FROM or EMAIL_USER');
  }

  // Si tiene formato "email@example.com", agregamos un nombre
  if (from && !from.includes('<') && !from.includes('>')) {
    from = `Sistema de Concursos <${from}>`;
  }

  const { data, error } = await client.emails.send({
    from,
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
    // idempotencyKey ayuda a evitar envíos duplicados por reintentos
    idempotencyKey: `verify-email/${to}/${code}`,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(`Email service error: ${error.message}`);
  }

  return data; // { id: '...' }
};

module.exports = { sendVerificationEmail };