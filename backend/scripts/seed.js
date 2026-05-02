/**
 * Demo seed for local development and Docker.
 * Run from backend/: `npm run seed` or `npm run seed:reset`
 *
 * Default: skips if admin@seedmed.dev already exists.
 * --reset: drops users, doctors, availability, appointments then reseeds.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Availability = require('../src/models/Availability');
const Appointment = require('../src/models/Appointment');

const DEMO_PASSWORD = 'DemoPass123';

const reset = process.argv.includes('--reset');

function daysFromNow(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

async function clearCollections() {
  await Appointment.deleteMany({});
  await Availability.deleteMany({});
  await Doctor.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared appointments, availability, doctors, users.');
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI. Copy env.example to .env or export MONGODB_URI.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    console.error(
      'Refusing to seed with NODE_ENV=production (protects real deployments). Use a dev/staging Atlas DB, or set SEED_ALLOW_PRODUCTION=true for an intentional demo database only.'
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected:', mongoose.connection.host);

  if (reset) {
    await clearCollections();
  } else {
    const existing = await User.findOne({ email: 'admin@seedmed.dev' });
    if (existing) {
      console.log('Seed already applied (admin@seedmed.dev exists). Use npm run seed:reset to wipe and reseed.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  const admin = await User.create({
    firstName: 'Alex',
    lastName: 'Admin',
    email: 'admin@seedmed.dev',
    password: DEMO_PASSWORD,
    phone: '+1 555-0100',
    dateOfBirth: new Date('1985-06-01'),
    gender: 'other',
    role: 'admin',
  });

  const patient1 = await User.create({
    firstName: 'Pat',
    lastName: 'Patient',
    email: 'patient@seedmed.dev',
    password: DEMO_PASSWORD,
    phone: '+1 555-0200',
    dateOfBirth: new Date('1992-03-15'),
    gender: 'male',
    role: 'patient',
    city: 'Springfield',
    state: 'IL',
  });

  const patient2 = await User.create({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@seedmed.dev',
    password: DEMO_PASSWORD,
    phone: '+1 555-0201',
    dateOfBirth: new Date('1995-11-20'),
    gender: 'female',
    role: 'patient',
    city: 'Springfield',
    state: 'IL',
  });

  const docUser1 = await User.create({
    firstName: 'Sam',
    lastName: 'Smith',
    email: 'drsmith@seedmed.dev',
    password: DEMO_PASSWORD,
    phone: '+1 555-0300',
    dateOfBirth: new Date('1980-01-10'),
    gender: 'male',
    role: 'doctor',
  });

  const docUser2 = await User.create({
    firstName: 'Riley',
    lastName: 'Jones',
    email: 'drjones@seedmed.dev',
    password: DEMO_PASSWORD,
    phone: '+1 555-0301',
    dateOfBirth: new Date('1988-07-22'),
    gender: 'female',
    role: 'doctor',
  });

  const doctor1 = await Doctor.create({
    user: docUser1._id,
    specialization: 'General Practice',
    licenseNumber: 'SEED-MD-001',
    experience: 12,
    education: [{ degree: 'MD', institution: 'State University School of Medicine', year: 2012 }],
    consultationFee: 120,
    bio: 'Demo verified doctor for local testing.',
    languages: ['English', 'Spanish'],
    isVerified: true,
    rating: { average: 4.7, count: 24 },
  });

  const doctor2 = await Doctor.create({
    user: docUser2._id,
    specialization: 'Cardiology',
    licenseNumber: 'SEED-MD-002',
    experience: 8,
    education: [{ degree: 'MD', institution: 'National Cardiology Institute', year: 2015 }],
    consultationFee: 200,
    bio: 'Demo doctor pending verification.',
    languages: ['English'],
    isVerified: false,
    rating: { average: 0, count: 0 },
  });

  const weeklySlots = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
    { dayOfWeek: 1, startTime: '13:00', endTime: '17:00', slotDuration: 30 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
    { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', slotDuration: 30 },
  ];

  for (const row of weeklySlots) {
    await Availability.create({ doctor: doctor1._id, ...row, isActive: true });
    await Availability.create({ doctor: doctor2._id, ...row, isActive: true });
  }

  await Appointment.create({
    patient: patient2._id,
    doctor: doctor1._id,
    appointmentDate: daysFromNow(10),
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    consultationFee: doctor1.consultationFee,
    symptoms: 'Routine follow-up',
    notes: 'Seeded appointment',
    paymentStatus: 'pending',
  });

  await Appointment.create({
    patient: patient1._id,
    doctor: doctor2._id,
    appointmentDate: daysFromNow(14),
    startTime: '14:00',
    endTime: '14:30',
    status: 'scheduled',
    consultationFee: doctor2.consultationFee,
    symptoms: 'Chest tightness when exercising',
    paymentStatus: 'pending',
  });

  console.log('\nSeed complete.\n');
  console.log('Demo password for all accounts:', DEMO_PASSWORD);
  console.log('\nAccounts:');
  console.log('  Admin:   ', admin.email);
  console.log('  Patient: ', patient1.email, ',', patient2.email);
  console.log('  Doctors: ', docUser1.email, '(verified),', docUser2.email, '(pending verification)');
  console.log('\nDoctor profile IDs (for API):', doctor1._id.toString(), doctor2._id.toString());
}

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
