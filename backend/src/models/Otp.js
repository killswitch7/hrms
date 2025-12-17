const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    // who the OTP is for – you can use email OR user reference, or both
    email: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    code: {
      type: String,
      required: true,
    },

    // e.g. 'login', 'password_reset', 'email_verify'
    purpose: {
      type: String,
      default: 'login',
    },

    // will be marked true after successful verification
    isUsed: {
      type: Boolean,
      default: false,
    },

    // expiry time; TTL index deletes it automatically after this time
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB deletes document when expiresAt < now
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', otpSchema);
