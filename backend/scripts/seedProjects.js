/* eslint-disable no-console */
// Usage: npm run seed
//
// This script no longer inserts dummy/mock campaigns. Per hackathon evaluation
// requirements the database must be left CLEAN after seeding, so that the
// Project Manager can publish real, authentic campaigns through the app UI.
//
// What it does:
//   1. Ensures the default administrator account exists (admin@impacthub.com).
//   2. WIPES every automated/mock project that was ever seeded by this script
//      (matched by title against the legacy demo campaign list, or by any
//      project still owned by the seed admin account) along with their
//      dependent Tasks, Applications and Comments so no orphaned data remains.
//
// Safe to rerun: it never touches projects created by real project managers
// through the app.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Application = require('../models/Application');
const Comment = require('../models/Comment');

// Historical mock campaign titles — deleted if found, never re-created.
const LEGACY_MOCK_TITLES = [
  'Clean Rawalpindi Campaign', 'Islamabad Literacy Drive', 'Lahore Tree Plantation',
  'Karachi Food Safe Haven', 'Peshawar Health Screening Camp', 'Quetta Women Digital Skills Lab',
  'Faisalabad School Supplies Drive', 'Multan Clean Water Awareness', 'Hyderabad Community Garden',
  'Gilgit Winter Relief Network', 'Sialkot Youth Coding Club', 'Sukkur Riverbank Restoration',
  'Bahawalpur Mobile Library', 'Mardan Accessible Sports Day', 'Muzaffarabad Resilience Workshop',
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required in backend/.env.');
  await connectDB();

  let admin = await User.findOne({ email: 'admin@impacthub.com' });
  if (!admin) {
    admin = await User.create({
      name: 'ImpactHub Admin',
      email: 'admin@impacthub.com',
      password: 'Admin@12345',
      phone: '+92 300 0000000',
      city: 'Rawalpindi',
      role: 'admin',
      isEmailVerified: true,
    });
    console.log('✅ Created default administrator: admin@impacthub.com / Admin@12345');
  } else {
    console.log('ℹ️  Default administrator already exists: admin@impacthub.com');
  }

  const mockProjects = await Project.find({
    $or: [{ title: { $in: LEGACY_MOCK_TITLES } }, { projectManager: admin._id }],
  }).select('_id title');

  const mockIds = mockProjects.map((p) => p._id);

  if (mockIds.length) {
    await Promise.all([
      Task.deleteMany({ project: { $in: mockIds } }),
      Application.deleteMany({ project: { $in: mockIds } }),
      Comment.deleteMany({ project: { $in: mockIds } }),
      Project.deleteMany({ _id: { $in: mockIds } }),
    ]);
    console.log(`🧹 Wiped ${mockIds.length} automated/mock project(s) and all related tasks, applications, and comments.`);
  } else {
    console.log('🧹 No automated/mock projects found — database is already clean.');
  }

  console.log('🎉 Seed complete. The database is clean and ready for Project Managers to publish real campaigns.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
