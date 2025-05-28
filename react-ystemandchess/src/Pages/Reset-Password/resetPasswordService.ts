import { environment } from '../../environments/environment';
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or any other email service
  auth: {
    user: environment.email!.user,
    pass: environment.email!.pass,
  },
});

const sendResetPasswordEmail = (email: any, resetLink: any) => {
  const mailOptions = {
    from: environment.email!.user,
    to: email,
    subject: 'Password Reset',
    text: `Click the link to reset your password: ${resetLink}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error: any, info: { response: unknown; }) => {
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
