/* eslint-disable no-console */
// Usage: npm run seed. Safe to rerun: seeded campaigns are replaced, other data is preserved.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');

const campaigns = [
  ['Clean Rawalpindi Campaign', 'Environment', 'Rawalpindi', 73.0679, 33.6007, 40, ['Teamwork', 'Communication', 'Social Work']],
  ['Islamabad Literacy Drive', 'Education', 'Islamabad', 73.0479, 33.6844, 30, ['Communication', 'Teaching', 'Teamwork']],
  ['Lahore Tree Plantation', 'Environment', 'Lahore', 74.3587, 31.5204, 55, ['Event Management', 'Teamwork', 'Social Work']],
  ['Karachi Food Safe Haven', 'Poverty Relief', 'Karachi', 67.0011, 24.8607, 45, ['Communication', 'Teamwork', 'Event Management']],
  ['Peshawar Health Screening Camp', 'Health', 'Peshawar', 71.5249, 34.0151, 25, ['Communication', 'Social Work', 'Teamwork']],
  ['Quetta Women Digital Skills Lab', 'Technology', 'Quetta', 66.9750, 30.1798, 20, ['Web Development', 'Design', 'Communication']],
  ['Faisalabad School Supplies Drive', 'Education', 'Faisalabad', 73.0791, 31.4504, 35, ['Marketing', 'Teamwork', 'Social Work']],
  ['Multan Clean Water Awareness', 'Health', 'Multan', 71.5249, 30.1575, 28, ['Communication', 'Marketing', 'Teamwork']],
  ['Hyderabad Community Garden', 'Community Development', 'Hyderabad', 68.3737, 25.3960, 32, ['Teamwork', 'Event Management', 'Social Work']],
  ['Gilgit Winter Relief Network', 'Disaster Relief', 'Gilgit', 74.3084, 35.9208, 38, ['Event Management', 'Communication', 'Social Work']],
  ['Sialkot Youth Coding Club', 'Technology', 'Sialkot', 74.5319, 32.4945, 22, ['Web Development', 'Design', 'Teamwork']],
  ['Sukkur Riverbank Restoration', 'Environment', 'Sukkur', 68.8589, 27.7052, 42, ['Teamwork', 'Social Work', 'Communication']],
  ['Bahawalpur Mobile Library', 'Education', 'Bahawalpur', 71.6911, 29.3956, 24, ['Communication', 'Marketing', 'Social Work']],
  ['Mardan Accessible Sports Day', 'Community Development', 'Mardan', 72.0476, 34.1989, 26, ['Event Management', 'Teamwork', 'Communication']],
  ['Muzaffarabad Resilience Workshop', 'Disaster Relief', 'Muzaffarabad', 73.4711, 34.3700, 30, ['Communication', 'Teamwork', 'Social Work']],
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required in backend/.env.');
  await connectDB();
  let admin = await User.findOne({ email: 'admin@impacthub.com' }).select('+password');
  if (!admin) {
    admin = await User.create({ name: 'ImpactHub Admin', email: 'admin@impacthub.com', password: 'Admin@12345', phone: '+92 300 0000000', city: 'Rawalpindi', role: 'admin', isEmailVerified: true });
    console.log('Created default administrator: admin@impacthub.com');
  }
  const titles = campaigns.map(([title]) => title);
  await Project.deleteMany({ title: { $in: titles }, projectManager: admin._id });
  const start = new Date(); start.setDate(start.getDate() + 7);
  const projects = campaigns.map(([title, category, city, lng, lat, requiredVolunteers, skillsRequired], index) => {
    const startDate = new Date(start); startDate.setDate(start.getDate() + index * 4);
    const endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 21);
    return { title, category, requiredVolunteers, skillsRequired, projectManager: admin._id, status: 'active', startDate, endDate,
      description: `${title} brings neighbours, students, and local partners together for a practical, measurable community action in ${city}. Volunteers receive clear roles, on-site support, and a meaningful opportunity to contribute.`,
      location: { city, address: `${city}, Pakistan`, coordinates: { lat, lng } },
      projectImage: { url: `https://images.unsplash.com/photo-${['1542601906990-b4d3fb778b09','1485217988980-11786ced9454','1473448912268-2022ce9509d8','1509099836639-18ba1795216d','1505751172876-fa1923c5c528'][index % 5]}?auto=format&fit=crop&w=1600&q=85` },
      impactScore: 45 + index * 3,
    };
  });
  await Project.insertMany(projects);
  console.log(`Seeded ${projects.length} active Pakistan community campaigns.`);
  process.exit(0);
}
seed().catch((error) => { console.error('Seed failed:', error.message); process.exit(1); });
