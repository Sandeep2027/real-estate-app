require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  gmailUser: process.env.GMAIL_USER,
  gmailPass: process.env.GMAIL_PASS,
  recaptchaSecret: process.env.RECAPTCHA_SECRET,
};