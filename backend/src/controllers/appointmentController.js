const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { validationResult } = require('express-validator');

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

    // Check if user has access to this appointment
    const hasAccess = req.user.role === 'admin' || 
                     (req.user.role === 'patient' && appointment.patient._id.toString() === req.user.id) ||
                     (req.user.role === 'doctor' && appointment.doctor._id.toString() === req.user.id);

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

    // Get doctor details
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      startTime,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      startTime,
      endTime,
      consultationFee: doctor.consultationFee,
      symptoms,
      notes
    });

    // Populate the created appointment
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

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     (req.user.role === 'doctor' && appointment.doctor.toString() === req.user.id) ||
                     (req.user.role === 'patient' && appointment.patient.toString() === req.user.id);

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

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    // Check permissions
    const canCancel = req.user.role === 'admin' || 
                     (req.user.role === 'doctor' && appointment.doctor.toString() === req.user.id) ||
                     (req.user.role === 'patient' && appointment.patient.toString() === req.user.id);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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
