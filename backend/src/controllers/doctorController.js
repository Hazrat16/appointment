const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const {
  normalizeAppointmentDay,
  ACTIVE_STATUSES,
  timeToMinutes,
  rangesOverlapStrings,
} = require('../utils/appointmentRules');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = { isVerified: true };
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { specialization: new RegExp(search, 'i') },
          { bio: new RegExp(search, 'i') }
        ]
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors with pagination
    const doctors = await Doctor.find({ ...filter, ...searchQuery })
      .populate('user', 'firstName lastName email phone')
      .sort({ 'rating.average': -1, totalAppointments: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Doctor.countDocuments({ ...filter, ...searchQuery });

    // Transform _id to id for frontend compatibility
    const transformedDoctors = doctors.map(doctor => ({
      ...doctor.toObject(),
      id: doctor._id.toString(),
      user: {
        ...doctor.user.toObject(),
        id: doctor.user._id.toString()
      }
    }));

    res.json({
      success: true,
      count: doctors.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      doctors: transformedDoctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Transform _id to id for frontend compatibility
    const transformedDoctor = {
      ...doctor.toObject(),
      id: doctor._id.toString(),
      user: {
        ...doctor.user.toObject(),
        id: doctor.user._id.toString()
      }
    };

    res.json({
      success: true,
      doctor: transformedDoctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor availability
// @route   GET /api/doctors/:id/availability
// @access  Public
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const requested = new Date(date);
    if (Number.isNaN(requested.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date'
      });
    }

    const normalizedDay = normalizeAppointmentDay(requested);
    const utcDayOfWeek = normalizedDay.getUTCDay();

    const dayEndExclusive = new Date(normalizedDay);
    dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);

    const weeklyAvailability = await Availability.find({
      doctor: req.params.id,
      isActive: true
    });

    const existingAppointments = await Appointment.find({
      doctor: req.params.id,
      appointmentDate: { $gte: normalizedDay, $lt: dayEndExclusive },
      status: ACTIVE_STATUSES
    });

    const dayBlocks = weeklyAvailability.filter((a) => a.dayOfWeek === utcDayOfWeek);

    if (dayBlocks.length === 0) {
      return res.json({
        success: true,
        availability: [],
        message: 'No availability for this day'
      });
    }

    const mergedSlots = new Map();
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
          available
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
        consultationFee: doctor.consultationFee
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/availability
// @access  Private (Doctor only)
const updateAvailability = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { availability } = req.body;

    // Get doctor profile
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Delete existing availability
    await Availability.deleteMany({ doctor: doctor._id });

    // Create new availability
    const newAvailability = availability.map(avail => ({
      ...avail,
      doctor: doctor._id
    }));

    await Availability.insertMany(newAvailability);

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: newAvailability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor dashboard data
// @route   GET /api/doctors/dashboard
// @access  Private (Doctor only)
const getDashboard = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).populate('patient', 'firstName lastName phone');

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: tomorrow, $lt: nextWeek },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patient', 'firstName lastName phone');

    // Get monthly statistics
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      dashboard: {
        todayAppointments,
        upcomingAppointments,
        monthlyStats,
        totalAppointments: doctor.totalAppointments,
        rating: doctor.rating
      }
    });
  } catch (error) {
    next(error);
  }
};

const formatMinutesAsHHMM = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Helper: slots within one availability block; overlap-aware vs existing appointments
const generateTimeSlots = (startTime, endTime, slotDuration, existingAppointments) => {
  const slots = [];
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
      available: !isBooked
    });

    currentMinutes += slotDuration;
  }

  return slots;
};

// @desc    Get all doctors (including unverified) - Admin only
// @route   GET /api/doctors/admin/all
// @access  Private (Admin only)
const getAllDoctorsAdmin = async (req, res, next) => {
  try {
    const { verificationStatus, specialization, search, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    
    // Filter by verification status
    if (verificationStatus !== undefined) {
      filter.isVerified = verificationStatus === 'true';
    }
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { specialization: new RegExp(search, 'i') },
          { bio: new RegExp(search, 'i') }
        ]
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors with pagination
    const doctors = await Doctor.find({ ...filter, ...searchQuery })
      .populate('user', 'firstName lastName email phone')
      .sort({ isVerified: 1, 'rating.average': -1, totalAppointments: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Doctor.countDocuments({ ...filter, ...searchQuery });

    // Transform _id to id for frontend compatibility
    const transformedDoctors = doctors.map(doctor => ({
      ...doctor.toObject(),
      id: doctor._id.toString(),
      user: {
        ...doctor.user.toObject(),
        id: doctor.user._id.toString()
      }
    }));

    res.json({
      success: true,
      count: doctors.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      doctors: transformedDoctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify/Unverify doctor - Admin only
// @route   PUT /api/doctors/admin/:id/verify
// @access  Private (Admin only)
const verifyDoctor = async (req, res, next) => {
  try {
    const { isVerified } = req.body;

    const doctor = await Doctor.findById(req.params.id).populate('user', 'firstName lastName email');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.isVerified = isVerified;
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      doctor: {
        ...doctor.toObject(),
        id: doctor._id.toString(),
        user: {
          ...doctor.user.toObject(),
          id: doctor.user._id.toString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor verification stats - Admin only
// @route   GET /api/doctors/admin/stats
// @access  Private (Admin only)
const getDoctorStats = async (req, res, next) => {
  try {
    const [totalDoctors, verifiedDoctors, unverifiedDoctors] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ isVerified: true }),
      Doctor.countDocuments({ isVerified: false })
    ]);

    // Get recent unverified doctors
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
        verificationRate: totalDoctors > 0 ? Math.round((verifiedDoctors / totalDoctors) * 100) : 0
      },
      recentUnverified: recentUnverified.map(doctor => ({
        ...doctor.toObject(),
        id: doctor._id.toString(),
        user: {
          ...doctor.user.toObject(),
          id: doctor.user._id.toString()
        }
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  updateAvailability,
  getDashboard,
  getAllDoctorsAdmin,
  verifyDoctor,
  getDoctorStats
};
