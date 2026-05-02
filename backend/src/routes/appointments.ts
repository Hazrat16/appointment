import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointmentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

const createAppointmentValidation = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('symptoms')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Symptoms description cannot exceed 1000 characters'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const updateAppointmentValidation = [
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('prescription')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Prescription cannot exceed 2000 characters'),
  body('diagnosis')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Diagnosis cannot exceed 1000 characters'),
  body('followUpRequired')
    .optional()
    .isBoolean()
    .withMessage('Follow up required must be a boolean'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow up date is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('symptoms')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Symptoms description cannot exceed 1000 characters'),
];

const cancelAppointmentValidation = [
  body('cancellationReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),
];

router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.post('/', protect, authorize('patient'), createAppointmentValidation, createAppointment);
router.put('/:id', protect, updateAppointmentValidation, updateAppointment);
router.delete('/:id', protect, cancelAppointmentValidation, cancelAppointment);

export default router;
