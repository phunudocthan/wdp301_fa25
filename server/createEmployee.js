const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');

const User = require('./models/User');

async function createEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'lego_ecommerce',
    });

    const email = 'employee@lego.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User with email ${email} already exists (id: ${existing._id}).`);
      return;
    }

    // Change this to a stronger password in production or generate one and send to admin securely
    const password = 'Emp#12345';
    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: 'Employee Account',
      email,
      password: hashed,
      role: 'employee',
      isVerified: true,
      status: 'active',
      phone: '0123456789'
    });

    console.log('Created employee user:');
    console.log({ id: user._id.toString(), email: user.email, password });
  } catch (err) {
    console.error('Error creating employee user:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  createEmployee();
}

module.exports = createEmployee;
