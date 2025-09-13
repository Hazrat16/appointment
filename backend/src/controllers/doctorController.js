const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

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

    // Get doctor's weekly availability
    const weeklyAvailability = await Availability.find({
      doctor: req.params.id,
      isActive: true
    });

    // Get existing appointments for the date
    const appointmentDate = new Date(date);
    const existingAppointments = await Appointment.find({
      doctor: req.params.id,
      appointmentDate: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $nin: ['cancelled', 'no-show'] }
    });

    // Get day of week for the requested date
    const dayOfWeek = appointmentDate.getDay();

    // Find availability for this day
    const dayAvailability = weeklyAvailability.find(avail => avail.dayOfWeek === dayOfWeek);

    if (!dayAvailability) {
      return res.json({
        success: true,
        availability: [],
        message: 'No availability for this day'
      });
    }

    // Generate time slots
    const slots = generateTimeSlots(
      dayAvailability.startTime,
      dayAvailability.endTime,
      dayAvailability.slotDuration,
      existingAppointments
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

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime, slotDuration, existingAppointments) => {
  const slots = [];
  const start = startTime.split(':').map(Number);
  const end = endTime.split(':').map(Number);
  
  let currentMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  while (currentMinutes < endMinutes) {
    const slotStart = Math.floor(currentMinutes / 60) + ':' + 
                     (currentMinutes % 60).toString().padStart(2, '0');
    const slotEnd = Math.floor((currentMinutes + slotDuration) / 60) + ':' + 
                   ((currentMinutes + slotDuration) % 60).toString().padStart(2, '0');
    
    // Check if slot is already booked
    const isBooked = existingAppointments.some(apt => 
      apt.startTime === slotStart
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

module.exports = {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  updateAvailability,
  getDashboard
};
