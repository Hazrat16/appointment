import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please enter a valid phone number'),
  body('dateOfBirth').isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
  body('specialization')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Specialization is required for doctors'),
  body('licenseNumber')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('License number is required for doctors'),
  body('experience')
    .if(body('role').equals('doctor'))
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative number'),
  body('consultationFee')
    .if(body('role').equals('doctor'))
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('education')
    .if(body('role').equals('doctor'))
    .isArray({ min: 1 })
    .withMessage('At least one education record is required for doctors'),
  body('education.*.degree')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Degree is required'),
  body('education.*.institution')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Institution is required'),
  body('education.*.year')
    .if(body('role').equals('doctor'))
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Valid graduation year is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please enter a valid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);

export default router;
