import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  updateAvailability,
  updateDoctorProfile,
  getDashboard,
  getAllDoctorsAdmin,
  verifyDoctor,
  getDoctorStats,
} from '../controllers/doctorController';
import { protect, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

const availabilityValidation = [
  body('availability').isArray({ min: 1 }).withMessage('At least one availability slot is required'),
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
    .withMessage('Slot duration must be between 15 and 120 minutes'),
];

const verifyDoctorValidation = [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean value'),
];

const updateDoctorProfileValidation = [
  body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
];

router.get('/', getDoctors);
router.get('/dashboard', protect, authorize('doctor'), getDashboard);
router.put('/availability', protect, authorize('doctor'), availabilityValidation, updateAvailability);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfileValidation, updateDoctorProfile);

router.get('/admin/all', protect, authorize('admin'), getAllDoctorsAdmin);
router.put('/admin/:id/verify', protect, authorize('admin'), verifyDoctorValidation, verifyDoctor);
router.get('/admin/stats', protect, authorize('admin'), getDoctorStats);

router.get('/:id', optionalAuth, getDoctor);
router.get('/:id/availability', optionalAuth, getDoctorAvailability);

export default router;
