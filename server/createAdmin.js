#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'lego_ecommerce';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'quinhni@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ny@12345';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment. Please set it in .env');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL }).lean();
    if (existing) {
      console.log(`User with email ${ADMIN_EMAIL} already exists (id=${existing._id}). No changes made.`);
      return process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = new User({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hash,
      role: 'admin',
      isVerified: true,
    });

    await user.save();
    console.log(`Admin user created: ${user.email} (id=${user._id})`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
}

main();
