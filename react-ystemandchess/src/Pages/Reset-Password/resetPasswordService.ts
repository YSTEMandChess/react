/**
 * Reset Password Service
 * 
 * Handles sending password reset emails to users.
 * Uses Nodemailer with Gmail to deliver reset links.
 */

import { environment } from '../../environments/environment';
const nodemailer = require('nodemailer');

// Configure email transporter with Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: environment.email!.user,
    pass: environment.email!.pass,
  },
});

/**
 * Sends a password reset email to the user
 * 
 * Creates and sends an email with a secure reset link that allows
 * the user to create a new password.
 * 
 * @param email - User's email address
 * @param resetLink - Secure URL for password reset page with token
 * @returns Promise that resolves with email send status
 */
const sendResetPasswordEmail = (email: any, resetLink: any) => {
  // Prepare email content
  const mailOptions = {
    from: environment.email!.user,
    to: email,
    subject: 'Password Reset',
    text: `Click the link to reset your password: ${resetLink}`,
  };

  // Send email and return promise
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
