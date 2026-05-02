import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { generateToken } from '../utils/generateToken';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role,
      address,
    } = req.body as Record<string, unknown>;

    const existingUser = await User.findOne({ email: email as string });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
      return;
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: (role as string) || 'patient',
      address,
    });

    let doctorProfile = null;
    if (user.role === 'doctor') {
      const {
        specialization,
        licenseNumber,
        experience,
        education,
        consultationFee,
        bio,
        languages,
      } = req.body as Record<string, unknown>;

      doctorProfile = await Doctor.create({
        user: user._id,
        specialization,
        licenseNumber,
        experience,
        education,
        consultationFee,
        bio,
        languages,
      });
    }

    const token = generateToken(String(user._id));

    const response: Record<string, unknown> = {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };

    if (user.role === 'doctor' && doctorProfile) {
      response.doctorProfile = {
        id: doctorProfile._id,
        specialization: doctorProfile.specialization,
        isVerified: doctorProfile.isVerified,
        verificationStatus: doctorProfile.isVerified ? 'verified' : 'pending',
        message: doctorProfile.isVerified
          ? 'Your doctor profile is verified and visible to patients'
          : 'Your doctor profile is pending verification. It will be visible to patients once verified by an administrator.',
      };
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
      return;
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(String(user._id));

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        doctorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const b = req.body as Record<string, unknown>;
    const fieldsToUpdate: Record<string, unknown> = {
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone,
      dateOfBirth: b.dateOfBirth,
      gender: b.gender,
      address: b.address,
      city: b.city,
      state: b.state,
      zipCode: b.zipCode,
      emergencyContactName: b.emergencyContactName,
      emergencyContactPhone: b.emergencyContactPhone,
      medicalHistory: b.medicalHistory,
      allergies: b.allergies,
      currentMedications: b.currentMedications,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) delete fieldsToUpdate[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
