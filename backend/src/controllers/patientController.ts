import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';

export const getAllPatientsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, page = '1', limit = '10' } = req.query;

    const filter: Record<string, unknown> = { role: 'patient' };

    if (typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const patients = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(String(limit), 10));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: patients.length,
      total,
      pagination: {
        page: parseInt(String(page), 10),
        pages: Math.ceil(total / parseInt(String(limit), 10)),
        limit: parseInt(String(limit), 10),
      },
      patients,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient' });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};
