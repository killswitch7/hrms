// Test Case 2: Password Hash Verification
// We are checking if comparePassword correctly matches hashed passwords.

const bcrypt = require('bcryptjs');
const User = require('./User');

describe('Password Hash Verification (User.comparePassword)', () => {
  test('should return true for correct password', async () => {
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      name: 'Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
    });

    const isMatch = await user.comparePassword('admin123');
    expect(isMatch).toBe(true);
  });

  test('should return false for wrong password', async () => {
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      name: 'Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
    });

    const isMatch = await user.comparePassword('wrong-password');
    expect(isMatch).toBe(false);
  });
});

