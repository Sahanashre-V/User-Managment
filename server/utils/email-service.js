// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_KEY
//   }
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.log('Email service error:', error.message);
//   } else {
//     console.log('Email service is ready');
//   }
// });

// async function sendEmail(to, subject, text) {
//   try {
//     const mailOptions = {
//       from: process.env.SMTP_FROM,
//       to,
//       subject,
//       text
//     };

//     const info = await transporter.sendMail(mailOptions);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// async function sendActivationEmail(to, name, activationLink) {
//   const subject = 'Activate Your Account';
//   const text = `Hello ${name}, Click the link below to activate your account: ${activationLink}`;
//   return await sendEmail(to, subject, text);
// }

// async function sendPasswordResetEmail(to, name, resetCode) {
//   const subject = 'Password Reset Code';
//   const text = `Hello ${name}, Your password reset code is: ${resetCode}. This code expires in 1 hour.`;
//   return await sendEmail(to, subject, text);
// }

// module.exports = {
//   sendEmail,
//   sendActivationEmail,
//   sendPasswordResetEmail
// };

const axios = require('axios');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

async function sendEmail(to, subject, text, html) {
  try {
    const response = await axios.post(EMAIL_SERVICE_URL, {
      to,
      subject,
      text,
    });
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendActivationEmail(to, name, activationLink) {
  const subject = 'Activate Your Account';
  const text = `Hello ${name}, Click the link below to activate your account: ${activationLink}`;
  return await sendEmail(to, subject, text);
}

async function sendPasswordResetEmail(to, name, resetCode) {
  const subject = 'Password Reset Code';
  const text = `Hello ${name}, Your password reset code is: ${resetCode}. This code expires in 1 hour.`;
  return await sendEmail(to, subject, text);
}

module.exports = {
  sendEmail,
  sendActivationEmail,
  sendPasswordResetEmail
};