const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const {
  normalizeAppointmentDay,
  combineUtcDayAndTime,
  minBookingNoticeHours,
  cancellationNoticeHours,
  getActiveAvailabilityBlocksForUtcDay,
  slotFitsAvailabilityBlocks,
  hasOverlapOnDay,
  ACTIVE_STATUSES,
  doctorOwnsAppointment,
  patientOwnsAppointment,
} = require('../utils/appointmentRules');

// @desc    Get user appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter based on user role
    let filter = {};
    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }
      filter.doctor = doctor._id;
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      count: appointments.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);
    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));

    const hasAccess = req.user.role === 'admin' || isPatientOwner || isDoctorOwner;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
const createAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { doctorId, appointmentDate, startTime, endTime, symptoms, notes } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'This doctor is not verified for public booking yet'
      });
    }

    const normalizedDay = normalizeAppointmentDay(appointmentDate);
    if (!normalizedDay) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date'
      });
    }

    const utcDow = normalizedDay.getUTCDay();
    const blocks = await getActiveAvailabilityBlocksForUtcDay(doctorId, utcDow);
    if (!blocks.length) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has no availability on this day'
      });
    }

    if (!slotFitsAvailabilityBlocks(startTime, endTime, blocks)) {
      return res.status(400).json({
        success: false,
        message: 'Selected time is outside this doctor’s available hours'
      });
    }

    const slotStartInstant = combineUtcDayAndTime(normalizedDay, startTime);
    if (slotStartInstant.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment time must be in the future'
      });
    }

    const minMs = minBookingNoticeHours() * 60 * 60 * 1000;
    if (slotStartInstant.getTime() < Date.now() + minMs) {
      return res.status(400).json({
        success: false,
        message: `Bookings must be at least ${minBookingNoticeHours()} hour(s) before the appointment start`
      });
    }

    const dayEndExclusive = new Date(normalizedDay);
    dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);

    const sameDayApts = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: normalizedDay, $lt: dayEndExclusive },
      status: ACTIVE_STATUSES
    });

    if (hasOverlapOnDay(sameDayApts, startTime, endTime)) {
      return res.status(409).json({
        success: false,
        message: 'This time overlaps an existing booking for that doctor'
      });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: req.user.id,
        doctor: doctorId,
        appointmentDate: normalizedDay,
        startTime,
        endTime,
        consultationFee: doctor.consultationFee,
        symptoms,
        notes
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This time slot was just taken — please choose another'
        });
      }
      return next(err);
    }

    await appointment.populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone'
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));
    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);

    const canUpdate = req.user.role === 'admin' || isDoctorOwner || isPatientOwner;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Define allowed fields for update based on role
    let allowedFields = {};
    
    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      allowedFields = {
        status: req.body.status,
        prescription: req.body.prescription,
        diagnosis: req.body.diagnosis,
        followUpRequired: req.body.followUpRequired,
        followUpDate: req.body.followUpDate,
        notes: req.body.notes
      };
    } else if (req.user.role === 'patient') {
      allowedFields = {
        symptoms: req.body.symptoms,
        notes: req.body.notes
      };
    }

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => 
      allowedFields[key] === undefined && delete allowedFields[key]
    );

    if (
      allowedFields.status !== undefined &&
      allowedFields.status !== appointment.status
    ) {
      if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Status cannot be changed from a terminal appointment state'
        });
      }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      allowedFields,
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone'
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed' || appointment.status === 'no-show') {
      return res.status(400).json({
        success: false,
        message: 'This appointment cannot be cancelled'
      });
    }

    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));
    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);

    const canCancel = req.user.role === 'admin' || isDoctorOwner || isPatientOwner;

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'patient' && isPatientOwner) {
      const startInstant = combineUtcDayAndTime(
        appointment.appointmentDate,
        appointment.startTime
      );
      const limitMs = cancellationNoticeHours() * 60 * 60 * 1000;
      if (startInstant.getTime() - Date.now() < limitMs) {
        return res.status(400).json({
          success: false,
          message: `Patients may cancel only more than ${cancellationNoticeHours()} hour(s) before the appointment start`
        });
      }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        cancellationReason,
        cancelledBy: req.user.role,
        cancelledAt: new Date()
      },
      { new: true }
    ).populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone'
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment
};
