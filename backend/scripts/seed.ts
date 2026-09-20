/**
 * Demo seed for local development and Docker.
 * Run from backend/: `npm run seed` or `npm run seed:reset`
 */

import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, type UserGender } from '../src/models/User';
import { Doctor, type IEducation } from '../src/models/Doctor';
import { Availability } from '../src/models/Availability';
import { Appointment } from '../src/models/Appointment';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEMO_PASSWORD = 'DemoPass123';
const reset = process.argv.includes('--reset');

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

async function clearCollections(): Promise<void> {
  await Appointment.deleteMany({});
  await Availability.deleteMany({});
  await Doctor.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared appointments, availability, doctors, users.');
}

interface AvailabilitySeed {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
}

interface DoctorSeed {
  firstName: string;
  lastName: string;
  email: string;
  gender: UserGender;
  phone: string;
  dateOfBirth: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  education: IEducation[];
  consultationFee: number;
  bio: string;
  languages: string[];
  isVerified: boolean;
  rating: { average: number; count: number };
  availability: AvailabilitySeed[];
}

const MON_WED_FRI_MORNING: AvailabilitySeed[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
  { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
  { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
];

const TUE_THU_AFTERNOON: AvailabilitySeed[] = [
  { dayOfWeek: 2, startTime: '13:00', endTime: '17:00', slotDuration: 30 },
  { dayOfWeek: 4, startTime: '13:00', endTime: '17:00', slotDuration: 30 },
];

const MON_THU_FULLDAY: AvailabilitySeed[] = [
  { dayOfWeek: 1, startTime: '08:00', endTime: '11:00', slotDuration: 20 },
  { dayOfWeek: 4, startTime: '08:00', endTime: '11:00', slotDuration: 20 },
];

const WED_FRI_LONG: AvailabilitySeed[] = [
  { dayOfWeek: 3, startTime: '10:00', endTime: '16:00', slotDuration: 45 },
  { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', slotDuration: 45 },
];

const TUE_SAT_MIX: AvailabilitySeed[] = [
  { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
  { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
];

const DOCTORS: DoctorSeed[] = [
  {
    firstName: 'Sam',
    lastName: 'Smith',
    email: 'drsmith@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0300',
    dateOfBirth: '1980-01-10',
    specialization: 'General Practice',
    licenseNumber: 'SEED-MD-001',
    experience: 12,
    education: [{ degree: 'MD', institution: 'State University School of Medicine', year: 2012 }],
    consultationFee: 120,
    bio: 'Demo verified doctor for local testing.',
    languages: ['English', 'Spanish'],
    isVerified: true,
    rating: { average: 4.7, count: 24 },
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
      { dayOfWeek: 1, startTime: '13:00', endTime: '17:00', slotDuration: 30 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
      { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', slotDuration: 30 },
    ],
  },
  {
    firstName: 'Riley',
    lastName: 'Jones',
    email: 'drjones@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0301',
    dateOfBirth: '1988-07-22',
    specialization: 'Cardiology',
    licenseNumber: 'SEED-MD-002',
    experience: 8,
    education: [{ degree: 'MD', institution: 'National Cardiology Institute', year: 2015 }],
    consultationFee: 200,
    bio: 'Demo doctor pending verification.',
    languages: ['English'],
    isVerified: false,
    rating: { average: 0, count: 0 },
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
      { dayOfWeek: 1, startTime: '13:00', endTime: '17:00', slotDuration: 30 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
      { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', slotDuration: 30 },
    ],
  },
  {
    firstName: 'Daniel',
    lastName: 'Cohen',
    email: 'drcohen@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0302',
    dateOfBirth: '1975-04-18',
    specialization: 'Cardiology',
    licenseNumber: 'SEED-MD-003',
    experience: 18,
    education: [{ degree: 'MD, FACC', institution: 'Johns Hopkins School of Medicine', year: 2009 }],
    consultationFee: 220,
    bio: 'Interventional cardiologist focused on preventive heart care and long-term risk management.',
    languages: ['English', 'Hebrew'],
    isVerified: true,
    rating: { average: 4.9, count: 61 },
    availability: MON_WED_FRI_MORNING,
  },
  {
    firstName: 'Maya',
    lastName: 'Chen',
    email: 'drchen@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0303',
    dateOfBirth: '1985-09-02',
    specialization: 'Dermatology',
    licenseNumber: 'SEED-MD-004',
    experience: 10,
    education: [{ degree: 'MD', institution: 'University of California School of Medicine', year: 2016 }],
    consultationFee: 150,
    bio: 'Treats acne, eczema, and skin cancer screening with a focus on long-term skin health.',
    languages: ['English', 'Mandarin'],
    isVerified: true,
    rating: { average: 4.8, count: 47 },
    availability: TUE_THU_AFTERNOON,
  },
  {
    firstName: 'Omar',
    lastName: 'Hassan',
    email: 'drhassan@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0304',
    dateOfBirth: '1979-12-05',
    specialization: 'Endocrinology',
    licenseNumber: 'SEED-MD-005',
    experience: 14,
    education: [{ degree: 'MD', institution: 'Cairo University Faculty of Medicine', year: 2011 }],
    consultationFee: 180,
    bio: 'Specializes in diabetes, thyroid disorders, and hormonal health.',
    languages: ['English', 'Arabic'],
    isVerified: true,
    rating: { average: 4.6, count: 33 },
    availability: MON_THU_FULLDAY,
  },
  {
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'drnair@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0305',
    dateOfBirth: '1983-02-14',
    specialization: 'Gastroenterology',
    licenseNumber: 'SEED-MD-006',
    experience: 11,
    education: [{ degree: 'MD', institution: 'All India Institute of Medical Sciences', year: 2015 }],
    consultationFee: 175,
    bio: 'Focuses on digestive health, IBS management, and endoscopic procedures.',
    languages: ['English', 'Hindi'],
    isVerified: true,
    rating: { average: 4.7, count: 29 },
    availability: WED_FRI_LONG,
  },
  {
    firstName: 'Lucas',
    lastName: 'Ferreira',
    email: 'drferreira@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0306',
    dateOfBirth: '1981-06-30',
    specialization: 'Hematology',
    licenseNumber: 'SEED-MD-007',
    experience: 13,
    education: [{ degree: 'MD', institution: 'University of São Paulo Medical School', year: 2013 }],
    consultationFee: 190,
    bio: 'Manages blood disorders including anemia, clotting conditions, and routine screening.',
    languages: ['English', 'Portuguese'],
    isVerified: true,
    rating: { average: 4.5, count: 18 },
    availability: TUE_SAT_MIX,
  },
  {
    firstName: 'Elena',
    lastName: 'Petrova',
    email: 'drpetrova@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0307',
    dateOfBirth: '1977-10-11',
    specialization: 'Neurology',
    licenseNumber: 'SEED-MD-008',
    experience: 16,
    education: [{ degree: 'MD, PhD', institution: 'First Moscow State Medical University', year: 2010 }],
    consultationFee: 210,
    bio: 'Treats migraines, epilepsy, and neurodegenerative conditions.',
    languages: ['English', 'Russian'],
    isVerified: true,
    rating: { average: 4.8, count: 52 },
    availability: MON_WED_FRI_MORNING,
  },
  {
    firstName: 'Kwame',
    lastName: 'Asante',
    email: 'drasante@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0308',
    dateOfBirth: '1974-03-27',
    specialization: 'Oncology',
    licenseNumber: 'SEED-MD-009',
    experience: 20,
    education: [{ degree: 'MD', institution: 'University of Ghana Medical School', year: 2007 }],
    consultationFee: 250,
    bio: 'Medical oncologist with a focus on early detection and personalized treatment plans.',
    languages: ['English'],
    isVerified: true,
    rating: { average: 4.9, count: 40 },
    availability: TUE_THU_AFTERNOON,
  },
  {
    firstName: 'Grace',
    lastName: 'Kim',
    email: 'drkim@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0309',
    dateOfBirth: '1986-08-19',
    specialization: 'Orthopedics',
    licenseNumber: 'SEED-MD-010',
    experience: 9,
    education: [{ degree: 'MD', institution: 'Seoul National University College of Medicine', year: 2017 }],
    consultationFee: 165,
    bio: 'Sports medicine and joint care specialist, from sprains to post-surgical rehab.',
    languages: ['English', 'Korean'],
    isVerified: true,
    rating: { average: 4.6, count: 22 },
    availability: MON_THU_FULLDAY,
  },
  {
    firstName: 'Noah',
    lastName: 'Bennett',
    email: 'drbennett@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0310',
    dateOfBirth: '1987-05-08',
    specialization: 'Pediatrics',
    licenseNumber: 'SEED-MD-011',
    experience: 7,
    education: [{ degree: 'MD', institution: 'University of Toronto Faculty of Medicine', year: 2019 }],
    consultationFee: 100,
    bio: 'Caring for infants through teens, from checkups to vaccinations.',
    languages: ['English', 'French'],
    isVerified: true,
    rating: { average: 4.9, count: 65 },
    availability: WED_FRI_LONG,
  },
  {
    firstName: 'Sofia',
    lastName: 'Rossi',
    email: 'drrossi@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0311',
    dateOfBirth: '1982-01-25',
    specialization: 'Psychiatry',
    licenseNumber: 'SEED-MD-012',
    experience: 12,
    education: [{ degree: 'MD', institution: 'University of Bologna Medical School', year: 2014 }],
    consultationFee: 160,
    bio: 'Supports anxiety, depression, and mood disorders through therapy and medication management.',
    languages: ['English', 'Italian'],
    isVerified: true,
    rating: { average: 4.7, count: 38 },
    availability: TUE_SAT_MIX,
  },
  {
    firstName: 'Ivan',
    lastName: 'Petrov',
    email: 'drpetrov@seedmed.dev',
    gender: 'male',
    phone: '+1 555-0312',
    dateOfBirth: '1976-11-02',
    specialization: 'Radiology',
    licenseNumber: 'SEED-MD-013',
    experience: 17,
    education: [{ degree: 'MD', institution: 'Sofia Medical University', year: 2009 }],
    consultationFee: 140,
    bio: 'Diagnostic imaging specialist covering X-ray, CT, and MRI interpretation.',
    languages: ['English', 'Bulgarian'],
    isVerified: true,
    rating: { average: 4.5, count: 15 },
    availability: MON_WED_FRI_MORNING,
  },
  {
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'drokafor@seedmed.dev',
    gender: 'female',
    phone: '+1 555-0313',
    dateOfBirth: '1984-07-16',
    specialization: 'Urology',
    licenseNumber: 'SEED-MD-014',
    experience: 11,
    education: [{ degree: 'MD', institution: 'University of Lagos College of Medicine', year: 2015 }],
    consultationFee: 170,
    bio: 'Treats urinary tract and kidney conditions with a patient-first, low-wait approach.',
    languages: ['English'],
    isVerified: true,
    rating: { average: 4.6, count: 21 },
    availability: TUE_THU_AFTERNOON,
  },
];

async function seed(): Promise<void> {
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
      console.log(
        'Seed already applied (admin@seedmed.dev exists). Use npm run seed:reset to wipe and reseed.'
      );
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

  const doctors: { seed: DoctorSeed; doctorId: mongoose.Types.ObjectId }[] = [];

  for (const d of DOCTORS) {
    const docUser = await User.create({
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      password: DEMO_PASSWORD,
      phone: d.phone,
      dateOfBirth: new Date(d.dateOfBirth),
      gender: d.gender,
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      user: docUser._id,
      specialization: d.specialization,
      licenseNumber: d.licenseNumber,
      experience: d.experience,
      education: d.education,
      consultationFee: d.consultationFee,
      bio: d.bio,
      languages: d.languages,
      isVerified: d.isVerified,
      rating: d.rating,
    });

    for (const slot of d.availability) {
      await Availability.create({ doctor: doctor._id, isActive: true, ...slot });
    }

    doctors.push({ seed: d, doctorId: doctor._id as mongoose.Types.ObjectId });
  }

  const doctorByEmail = (email: string) => doctors.find((d) => d.seed.email === email)!;
  const smith = doctorByEmail('drsmith@seedmed.dev');
  const cohen = doctorByEmail('drcohen@seedmed.dev');
  const bennett = doctorByEmail('drbennett@seedmed.dev');

  await Appointment.create({
    patient: patient2._id,
    doctor: smith.doctorId,
    appointmentDate: daysFromNow(10),
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    consultationFee: smith.seed.consultationFee,
    symptoms: 'Routine follow-up',
    notes: 'Seeded appointment',
    paymentStatus: 'pending',
  });

  await Appointment.create({
    patient: patient1._id,
    doctor: cohen.doctorId,
    appointmentDate: daysFromNow(14),
    startTime: '10:00',
    endTime: '10:30',
    status: 'scheduled',
    consultationFee: cohen.seed.consultationFee,
    symptoms: 'Chest tightness when exercising',
    paymentStatus: 'pending',
  });

  await Appointment.create({
    patient: patient1._id,
    doctor: bennett.doctorId,
    appointmentDate: daysFromNow(-20),
    startTime: '09:00',
    endTime: '09:20',
    status: 'completed',
    consultationFee: bennett.seed.consultationFee,
    symptoms: 'Annual checkup',
    diagnosis: 'Healthy, no concerns',
    paymentStatus: 'paid',
    paymentMethod: 'card',
  });

  console.log('\nSeed complete.\n');
  console.log('Demo password for all accounts:', DEMO_PASSWORD);
  console.log('\nAccounts:');
  console.log('  Admin:   ', admin.email);
  console.log('  Patient: ', patient1.email, ',', patient2.email);
  console.log(
    '  Doctors: ',
    DOCTORS.length,
    'seeded (',
    DOCTORS.filter((d) => d.isVerified).length,
    'verified,',
    DOCTORS.filter((d) => !d.isVerified).length,
    'pending) —',
    DOCTORS.map((d) => d.email).join(', ')
  );
}

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
