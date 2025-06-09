const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru', 
  port: 465, 
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false, 
  },
});

const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Подтверждение записи на студию CrystalMusic',
      html: `
        <h2 style="color: #2c3e50;">Ваша запись на студию</h2>
        <p><strong>Услуга:</strong> ${bookingDetails.serviceName}</p>
        <p><strong>Дата и время:</strong> ${bookingDetails.startTime.toLocaleString()}</p>
        <p><strong>Продолжительность:</strong> ${bookingDetails.hours} часов</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Письмо отправлено на', userEmail);
  } catch (error) {
    console.error('❌ Ошибка отправки письма:', error);
    throw error;
  }
};

module.exports = { sendBookingConfirmation };