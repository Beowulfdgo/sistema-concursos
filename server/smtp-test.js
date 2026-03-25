require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false, // 587 => STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to: process.env.EMAIL_TO_TEST
      },
    });

    // 1) Verifica conexión y credenciales
    await transporter.verify();
    console.log('SMTP OK: conexión y credenciales válidas.');

    // 2) Envío de prueba (a tu mismo correo)
    const info = await transporter.sendMail({
        from: `"SMTP Test CNPPE" <${process.env.EMAIL_USER}>`,
        to: 'test@example.com', // cualquier correo de prueba
        subject: 'Prueba SMTP',
        text: 'Si recibes este correo, SMTP está funcionando.',
      });

    console.log('Correo enviado. messageId:', info.messageId);
  } catch (err) {
    console.error('SMTP ERROR:', err.message);
  }
}

testSMTP();