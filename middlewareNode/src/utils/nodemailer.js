const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const config = require("config");

// Load OAuth2 and email configuration from config
const clientId = config.get("clientId");
const clientSecret = config.get("clientSecret");
const redirectUri = config.get("redirectUri");
const refreshToken = config.get("refreshToken");
const user = config.get("user");
const senderEmail = config.get("senderEmail");

/**
 * Sends an email using Gmail OAuth2 authentication
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.text - Plain text email body
 * @param {string} params.html - HTML email body
 */
const sendMail = async ({ email, subject, text, html }) => {
  // Configure OAuth2 client with credentials
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  try {
    // Get fresh access token
    const accessToken = await oAuth2Client.getAccessToken();
    
    // Create email transport with OAuth2
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: user,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
        accessToken: accessToken,
      },
    });
    
    // Send the email
    await transport.sendMail({
      from: `"YstemAndChess" <${senderEmail}>`,
      to: email,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  sendMail,
};
