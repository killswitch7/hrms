// backend/src/services/otpService.js
// Small OTP service for login and password change verification.

const Otp = require('../models/Otp');
const { sendMail } = require('./mailService');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createAndSendOtp({ email, userId = null, purpose = 'login', minutes = 10 }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required for OTP');

  const code = generateCode();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Mark old OTPs as used to keep latest one only
  await Otp.updateMany(
    { email: normalizedEmail, purpose, isUsed: false },
    { $set: { isUsed: true } }
  );

  await Otp.create({
    email: normalizedEmail,
    user: userId || undefined,
    code,
    purpose,
    isUsed: false,
    expiresAt,
  });

  await sendMail({
    to: normalizedEmail,
    subject: `[HRMS] OTP for ${purpose}`,
    text: `Your OTP is ${code}. It will expire in ${minutes} minutes.`,
    html: `<p>Your OTP is <b>${code}</b>.</p><p>This OTP expires in ${minutes} minutes.</p>`,
  });

  return { ok: true, expiresAt };
}

async function verifyOtp({ email, purpose = 'login', code }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedCode = String(code || '').trim();
  if (!normalizedEmail || !normalizedCode) return false;

  const otpRow = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    code: normalizedCode,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRow) return false;

  otpRow.isUsed = true;
  await otpRow.save();
  return true;
}

module.exports = {
  createAndSendOtp,
  verifyOtp,
};
