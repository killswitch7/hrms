// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',   // all employees from admin form
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Hash password before save (no next callback, just async/await)
userSchema.pre('save', async function () {
  // `this` = current user document
  if (!this.isModified('password')) {
    // password not changed -> do nothing
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper to compare passwords during login
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
