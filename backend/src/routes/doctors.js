const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  updateAvailability,
  getDashboard,
  getAllDoctorsAdmin,
  verifyDoctor,
  getDoctorStats
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const availabilityValidation = [
  body('availability')
    .isArray({ min: 1 })
    .withMessage('At least one availability slot is required'),
  body('availability.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  body('availability.*.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('availability.*.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('availability.*.slotDuration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Slot duration must be between 15 and 120 minutes')
];

const verifyDoctorValidation = [
  body('isVerified')
    .isBoolean()
    .withMessage('isVerified must be a boolean value')
];

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Public
router.get('/', getDoctors);

// @route   GET /api/doctors/:id
// @desc    Get single doctor
// @access  Public
router.get('/:id', getDoctor);

// @route   GET /api/doctors/:id/availability
// @desc    Get doctor availability for a specific date
// @access  Public
router.get('/:id/availability', getDoctorAvailability);

// @route   PUT /api/doctors/availability
// @desc    Update doctor availability
// @access  Private (Doctor only)
router.put('/availability', protect, authorize('doctor'), availabilityValidation, updateAvailability);

// @route   GET /api/doctors/dashboard
// @desc    Get doctor dashboard data
// @access  Private (Doctor only)
router.get('/dashboard', protect, authorize('doctor'), getDashboard);

// Admin routes for doctor verification
// @route   GET /api/doctors/admin/all
// @desc    Get all doctors (including unverified) - Admin only
// @access  Private (Admin only)
router.get('/admin/all', protect, authorize('admin'), getAllDoctorsAdmin);

// @route   PUT /api/doctors/admin/:id/verify
// @desc    Verify/Unverify doctor - Admin only
// @access  Private (Admin only)
router.put('/admin/:id/verify', protect, authorize('admin'), verifyDoctorValidation, verifyDoctor);

// @route   GET /api/doctors/admin/stats
// @desc    Get doctor verification stats - Admin only
// @access  Private (Admin only)
router.get('/admin/stats', protect, authorize('admin'), getDoctorStats);

module.exports = router;
