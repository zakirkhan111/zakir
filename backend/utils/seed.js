// Optional helper script: creates the initial admin account from .env values.
// Run with: npm run seed
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');

async function seed() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: 'Platform Admin',
    email,
    password,
    phone: '0000000000',
    city: 'Rawalpindi',
    role: 'admin',
    isEmailVerified: true,
  });

  console.log(`✅ Admin account created: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
