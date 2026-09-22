import { Router } from 'express';
import { getAllPatientsAdmin, getPatientAdmin } from '../controllers/patientController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/admin/all', protect, authorize('admin'), getAllPatientsAdmin);
router.get('/admin/:id', protect, authorize('admin'), getPatientAdmin);

export default router;
