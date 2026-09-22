import type { NextFunction, Request, Response } from 'express';
import type { Types } from 'mongoose';
import { validationResult } from 'express-validator';
import { Doctor } from '../models/Doctor';
import { Availability } from '../models/Availability';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { escapeRegex } from '../utils/regex';
import {
  normalizeAppointmentDay,
  ACTIVE_STATUSES,
  timeToMinutes,
  rangesOverlapStrings,
} from '../utils/appointmentRules';
import type { IAppointment } from '../models/Appointment';

type PopulatedUserRef = { toObject: () => object; _id: Types.ObjectId };

function asPopulatedUser(user: unknown): PopulatedUserRef {
  return user as PopulatedUserRef;
}

/**
 * `search` is meant to match a doctor's name too (the UI says so), but name
 * lives on the User document, not the Doctor one — a plain Doctor.find()
 * regex can't reach it. Resolve matching user ids first, then OR them in.
 */
async function buildDoctorSearchFilter(search: string): Promise<Record<string, unknown>> {
  const regex = new RegExp(escapeRegex(search), 'i');
  const matchingUsers = await User.find({
    role: 'doctor',
    $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
  }).select('_id');

  return {
    $or: [
      { specialization: regex },
      { bio: regex },
      { user: { $in: matchingUsers.map((u) => u._id) } },
    ],
  };
}

export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { specialization, search, page = '1', limit = '10' } = req.query;

    const filter: Record<string, unknown> = { isVerified: true };

    if (typeof specialization === 'string') {
      filter.specialization = new RegExp(escapeRegex(specialization), 'i');
    }

    const searchQuery =
      typeof search === 'string' && search.trim()
        ? await buildDoctorSearchFilter(search.trim())
        : {};

    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const doctors = await Doctor.find({ ...filter, ...searchQuery })
      .populate('user', 'firstName lastName email phone')
      .sort({ 'rating.average': -1, totalAppointments: -1 })
      .skip(skip)
      .limit(parseInt(String(limit), 10));

    const total = await Doctor.countDocuments({ ...filter, ...searchQuery });

    const transformedDoctors = doctors.map((doctor) => {
      const u = asPopulatedUser(doctor.user);
      return {
        ...doctor.toObject(),
        id: String(doctor._id),
        user: {
          ...u.toObject(),
          id: String(u._id),
        },
      };
    });

    res.json({
      success: true,
      count: doctors.length,
      total,
      pagination: {
        page: parseInt(String(page), 10),
        pages: Math.ceil(total / parseInt(String(limit), 10)),
        limit: parseInt(String(limit), 10),
      },
      doctors: transformedDoctors,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      'user',
      'firstName lastName email phone'
    );

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const u = asPopulatedUser(doctor.user);
    const isOwnerOrAdmin =
      req.user?.role === 'admin' || (req.user && String(req.user.id) === String(u._id));

    if (!doctor.isVerified && !isOwnerOrAdmin) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const transformedDoctor = {
      ...doctor.toObject(),
      id: String(doctor._id),
      user: {
        ...u.toObject(),
        id: String(u._id),
      },
    };

    res.json({
      success: true,
      doctor: transformedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Date is required',
      });
      return;
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const isOwnerOrAdmin =
      req.user?.role === 'admin' || (req.user && String(req.user.id) === String(doctor.user));

    if (!doctor.isVerified && !isOwnerOrAdmin) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const requested = new Date(date);
    if (Number.isNaN(requested.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date',
      });
      return;
    }

    const normalizedDay = normalizeAppointmentDay(requested);
    if (!normalizedDay) {
      res.status(400).json({ success: false, message: 'Invalid date' });
      return;
    }

    const utcDayOfWeek = normalizedDay.getUTCDay();

    const dayEndExclusive = new Date(normalizedDay);
    dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);

    const weeklyAvailability = await Availability.find({
      doctor: req.params.id,
      isActive: true,
    });

    const existingAppointments = await Appointment.find({
      doctor: req.params.id,
      appointmentDate: { $gte: normalizedDay, $lt: dayEndExclusive },
      status: ACTIVE_STATUSES,
    });

    const dayBlocks = weeklyAvailability.filter((a) => a.dayOfWeek === utcDayOfWeek);

    if (dayBlocks.length === 0) {
      res.json({
        success: true,
        availability: [],
        message: 'No availability for this day',
      });
      return;
    }

    const mergedSlots = new Map<
      string,
      { startTime: string; endTime: string; available: boolean }
    >();
    for (const block of dayBlocks) {
      const slots = generateTimeSlots(
        block.startTime,
        block.endTime,
        block.slotDuration,
        existingAppointments
      );
      for (const s of slots) {
        const prev = mergedSlots.get(s.startTime);
        const available = s.available && (prev === undefined || prev.available);
        mergedSlots.set(s.startTime, {
          startTime: s.startTime,
          endTime: s.endTime,
          available,
        });
      }
    }

    const slots = Array.from(mergedSlots.values()).sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    res.json({
      success: true,
      availability: slots,
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { availability } = req.body as { availability: Record<string, unknown>[] };

    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
      return;
    }

    await Availability.deleteMany({ doctor: doctor._id });

    const newAvailability = availability.map((avail) => ({
      ...avail,
      doctor: doctor._id,
    }));

    await Availability.insertMany(newAvailability);

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: newAvailability,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const b = req.body as Record<string, unknown>;
    const fieldsToUpdate: Record<string, unknown> = {
      specialization: b.specialization,
      bio: b.bio,
      consultationFee: b.consultationFee,
      languages: b.languages,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) delete fieldsToUpdate[key];
    });

    const doctor = await Doctor.findOneAndUpdate({ user: req.user.id }, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).populate('user', 'firstName lastName email phone');

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
      return;
    }

    const u = asPopulatedUser(doctor.user);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      doctor: {
        ...doctor.toObject(),
        id: String(doctor._id),
        user: {
          ...u.toObject(),
          id: String(u._id),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow },
    }).populate('patient', 'firstName lastName phone');

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: tomorrow, $lt: nextWeek },
      status: { $in: ['scheduled', 'confirmed'] },
    }).populate('patient', 'firstName lastName phone');

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      dashboard: {
        todayAppointments,
        upcomingAppointments,
        monthlyStats,
        totalAppointments: doctor.totalAppointments,
        rating: doctor.rating,
      },
    });
  } catch (error) {
    next(error);
  }
};

const formatMinutesAsHHMM = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const generateTimeSlots = (
  startTime: string,
  endTime: string,
  slotDuration: number,
  existingAppointments: Pick<IAppointment, 'startTime' | 'endTime'>[]
): { startTime: string; endTime: string; available: boolean }[] => {
  const slots: { startTime: string; endTime: string; available: boolean }[] = [];
  const start = startTime.split(':').map(Number);
  const end = endTime.split(':').map(Number);

  let currentMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStart = formatMinutesAsHHMM(currentMinutes);
    const slotEnd = formatMinutesAsHHMM(currentMinutes + slotDuration);

    const isBooked = existingAppointments.some((apt) =>
      rangesOverlapStrings(apt.startTime, apt.endTime, slotStart, slotEnd)
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked,
    });

    currentMinutes += slotDuration;
  }

  return slots;
};

export const getAllDoctorsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { verificationStatus, specialization, search, page = '1', limit = '10' } = req.query;

    const filter: Record<string, unknown> = {};

    if (verificationStatus !== undefined) {
      filter.isVerified = verificationStatus === 'true';
    }

    if (typeof specialization === 'string') {
      filter.specialization = new RegExp(escapeRegex(specialization), 'i');
    }

    const searchQuery =
      typeof search === 'string' && search.trim()
        ? await buildDoctorSearchFilter(search.trim())
        : {};

    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const doctors = await Doctor.find({ ...filter, ...searchQuery })
      .populate('user', 'firstName lastName email phone')
      .sort({ isVerified: 1, 'rating.average': -1, totalAppointments: -1 })
      .skip(skip)
      .limit(parseInt(String(limit), 10));

    const total = await Doctor.countDocuments({ ...filter, ...searchQuery });

    const transformedDoctors = doctors.map((doctor) => {
      const u = asPopulatedUser(doctor.user);
      return {
        ...doctor.toObject(),
        id: String(doctor._id),
        user: {
          ...u.toObject(),
          id: String(u._id),
        },
      };
    });

    res.json({
      success: true,
      count: doctors.length,
      total,
      pagination: {
        page: parseInt(String(page), 10),
        pages: Math.ceil(total / parseInt(String(limit), 10)),
        limit: parseInt(String(limit), 10),
      },
      doctors: transformedDoctors,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { isVerified } = req.body as { isVerified: boolean };

    const doctor = await Doctor.findById(req.params.id).populate('user', 'firstName lastName email');

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    doctor.isVerified = isVerified;
    await doctor.save();

    const u = asPopulatedUser(doctor.user);
    res.json({
      success: true,
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      doctor: {
        ...doctor.toObject(),
        id: String(doctor._id),
        user: {
          ...u.toObject(),
          id: String(u._id),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalDoctors, verifiedDoctors, unverifiedDoctors] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ isVerified: true }),
      Doctor.countDocuments({ isVerified: false }),
    ]);

    const recentUnverified = await Doctor.find({ isVerified: false })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        total: totalDoctors,
        verified: verifiedDoctors,
        unverified: unverifiedDoctors,
        verificationRate:
          totalDoctors > 0 ? Math.round((verifiedDoctors / totalDoctors) * 100) : 0,
      },
      recentUnverified: recentUnverified.map((doctor) => {
        const u = asPopulatedUser(doctor.user);
        return {
          ...doctor.toObject(),
          id: String(doctor._id),
          user: {
            ...u.toObject(),
            id: String(u._id),
          },
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};
