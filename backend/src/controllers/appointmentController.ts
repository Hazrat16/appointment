import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import {
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
} from '../utils/appointmentRules';

export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { status, page = '1', limit = '10' } = req.query;

    const filter: Record<string, unknown> = {};
    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) {
        res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        });
        return;
      }
      filter.doctor = doctor._id;
    }

    if (typeof status === 'string') {
      filter.status = status;
    }

    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      })
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(String(limit), 10));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      count: appointments.length,
      total,
      pagination: {
        page: parseInt(String(page), 10),
        pages: Math.ceil(total / parseInt(String(limit), 10)),
        limit: parseInt(String(limit), 10),
      },
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      });

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);
    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));

    const hasAccess = req.user.role === 'admin' || isPatientOwner || isDoctorOwner;

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { doctorId, appointmentDate, startTime, endTime, symptoms, notes } = req.body as {
      doctorId: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
      symptoms?: string;
      notes?: string;
    };

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    if (!doctor.isVerified) {
      res.status(403).json({
        success: false,
        message: 'This doctor is not verified for public booking yet',
      });
      return;
    }

    const normalizedDay = normalizeAppointmentDay(appointmentDate);
    if (!normalizedDay) {
      res.status(400).json({
        success: false,
        message: 'Invalid appointment date',
      });
      return;
    }

    const utcDow = normalizedDay.getUTCDay();
    const blocks = await getActiveAvailabilityBlocksForUtcDay(doctorId, utcDow);
    if (!blocks.length) {
      res.status(400).json({
        success: false,
        message: 'Doctor has no availability on this day',
      });
      return;
    }

    if (!slotFitsAvailabilityBlocks(startTime, endTime, blocks)) {
      res.status(400).json({
        success: false,
        message: 'Selected time is outside this doctor’s available hours',
      });
      return;
    }

    const slotStartInstant = combineUtcDayAndTime(normalizedDay, startTime);
    if (slotStartInstant.getTime() <= Date.now()) {
      res.status(400).json({
        success: false,
        message: 'Appointment time must be in the future',
      });
      return;
    }

    const minMs = minBookingNoticeHours() * 60 * 60 * 1000;
    if (slotStartInstant.getTime() < Date.now() + minMs) {
      res.status(400).json({
        success: false,
        message: `Bookings must be at least ${minBookingNoticeHours()} hour(s) before the appointment start`,
      });
      return;
    }

    const dayEndExclusive = new Date(normalizedDay);
    dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);

    const sameDayApts = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: normalizedDay, $lt: dayEndExclusive },
      status: ACTIVE_STATUSES,
    });

    if (hasOverlapOnDay(sameDayApts, startTime, endTime)) {
      res.status(409).json({
        success: false,
        message: 'This time overlaps an existing booking for that doctor',
      });
      return;
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
        notes,
      });
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null ? (err as { code?: number }).code : undefined;
      if (code === 11000) {
        res.status(409).json({
          success: false,
          message: 'This time slot was just taken — please choose another',
        });
        return;
      }
      next(err);
      return;
    }

    await appointment.populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone',
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      },
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));
    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);

    const canUpdate = req.user.role === 'admin' || isDoctorOwner || isPatientOwner;

    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const b = req.body as Record<string, unknown>;
    let allowedFields: Record<string, unknown> = {};

    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      allowedFields = {
        status: b.status,
        prescription: b.prescription,
        diagnosis: b.diagnosis,
        followUpRequired: b.followUpRequired,
        followUpDate: b.followUpDate,
        notes: b.notes,
      };
    } else if (req.user.role === 'patient') {
      allowedFields = {
        symptoms: b.symptoms,
        notes: b.notes,
      };
    }

    Object.keys(allowedFields).forEach((key) => {
      if (allowedFields[key] === undefined) delete allowedFields[key];
    });

    if (
      allowedFields.status !== undefined &&
      allowedFields.status !== appointment.status
    ) {
      if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
        res.status(400).json({
          success: false,
          message: 'Status cannot be changed from a terminal appointment state',
        });
        return;
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      allowedFields,
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone',
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      },
    ]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { cancellationReason } = req.body as { cancellationReason?: string };

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    if (appointment.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled',
      });
      return;
    }

    if (appointment.status === 'completed' || appointment.status === 'no-show') {
      res.status(400).json({
        success: false,
        message: 'This appointment cannot be cancelled',
      });
      return;
    }

    const isDoctorOwner =
      req.user.role === 'doctor' && (await doctorOwnsAppointment(req.user.id, appointment));
    const isPatientOwner =
      req.user.role === 'patient' && patientOwnsAppointment(req.user.id, appointment);

    const canCancel = req.user.role === 'admin' || isDoctorOwner || isPatientOwner;

    if (!canCancel) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    if (req.user.role === 'patient' && isPatientOwner) {
      const startInstant = combineUtcDayAndTime(
        appointment.appointmentDate,
        appointment.startTime
      );
      const limitMs = cancellationNoticeHours() * 60 * 60 * 1000;
      if (startInstant.getTime() - Date.now() < limitMs) {
        res.status(400).json({
          success: false,
          message: `Patients may cancel only more than ${cancellationNoticeHours()} hour(s) before the appointment start`,
        });
        return;
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        cancellationReason,
        cancelledBy: req.user.role,
        cancelledAt: new Date(),
      },
      { new: true }
    ).populate([
      {
        path: 'patient',
        select: 'firstName lastName email phone',
      },
      {
        path: 'doctor',
        select: 'user specialization consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      },
    ]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};
