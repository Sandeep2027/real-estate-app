const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { jwtSecret, gmailUser, gmailPass, recaptchaSecret } = require('../config');
const fetch = require('node-fetch');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: gmailUser, pass: gmailPass },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

let otpStore = {}; // Temporary in-memory store for OTPs (use Redis in production)

exports.sendSignupOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  otpStore[email] = otp;
  const mailOptions = {
    from: gmailUser,
    to: email,
    subject: 'Signup OTP',
    text: `Your OTP is ${otp}`,
  };
  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).json({ msg: 'Email error' });
    res.json({ msg: 'OTP sent' });
  });
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] === otp) {
    delete otpStore[email];
    res.json({ msg: 'Verified' });
  } else {
    res.status(400).json({ msg: 'Invalid OTP' });
  }
};

exports.setPassword = async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password_hash, verified) VALUES (?, ?, TRUE)', [email, hash], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Password set' });
  });
};

exports.login = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`, { method: 'POST' });
  const data = await response.json();
  if (!data.success) return res.status(400).json({ msg: 'reCAPTCHA failed' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  otpStore[email] = otp;
  const mailOptions = {
    from: gmailUser,
    to: email,
    subject: 'Reset OTP',
    text: `Your OTP is ${otp}`,
  };
  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).json({ msg: 'Email error' });
    res.json({ msg: 'OTP sent' });
  });
};

exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Password reset' });
  });
};