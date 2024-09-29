import { environment } from '../../environments/environment.js';
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or any other email service
  auth: {
    user: environment.email.user,
    pass: environment.email.pass,
  },
});

const sendResetPasswordEmail = (email, resetLink) => {
  const mailOptions = {
    from: environment.email.user,
    to: email,
    subject: 'Password Reset',
    text: `Click the link to reset your password: ${resetLink}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
};

module.exports = {
  sendResetPasswordEmail,
};
