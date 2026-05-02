/**
 * Calendar-day and slot rules shared by appointment + availability flows.
 * All calendar math uses UTC date parts of the stored appointment "day" field.
 */

import type { Types } from 'mongoose';
import { Doctor } from '../models/Doctor';
import { Availability } from '../models/Availability';
import type { IAppointment } from '../models/Appointment';

export type AppointmentLike = Pick<IAppointment, 'doctor' | 'patient' | 'startTime' | 'endTime'> & {
  doctor?: Types.ObjectId | { _id: Types.ObjectId };
  patient?: Types.ObjectId | { _id: Types.ObjectId };
};

function parseIntEnv(name: string, defaultValue: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

export function minBookingNoticeHours(): number {
  return Math.max(0, parseIntEnv('MIN_BOOKING_NOTICE_HOURS', 2));
}

export function cancellationNoticeHours(): number {
  return Math.max(0, parseIntEnv('CANCELLATION_NOTICE_HOURS', 24));
}

export function timeToMinutes(t: string): number {
  const [h, m] = String(t).split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function rangesOverlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function rangesOverlapStrings(s1: string, e1: string, s2: string, e2: string): boolean {
  return rangesOverlapMinutes(timeToMinutes(s1), timeToMinutes(e1), timeToMinutes(s2), timeToMinutes(e2));
}

export function normalizeAppointmentDay(input: string | Date): Date | null {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function combineUtcDayAndTime(dayDate: Date, timeStr: string): Date {
  const d = new Date(dayDate);
  const [h, m] = String(timeStr).split(':').map((x) => parseInt(x, 10));
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, 0, 0));
}

export async function doctorOwnsAppointment(
  userId: string,
  appointment: AppointmentLike
): Promise<boolean> {
  const profile = await Doctor.findOne({ user: userId });
  if (!profile) return false;
  const docId =
    appointment.doctor && typeof appointment.doctor === 'object' && '_id' in appointment.doctor
      ? (appointment.doctor as { _id: Types.ObjectId })._id
      : appointment.doctor;
  return String(profile._id) === String(docId);
}

export function patientOwnsAppointment(userId: string, appointment: AppointmentLike): boolean {
  const pid =
    appointment.patient && typeof appointment.patient === 'object' && '_id' in appointment.patient
      ? (appointment.patient as { _id: Types.ObjectId })._id
      : appointment.patient;
  return pid?.toString() === userId.toString();
}

export async function getActiveAvailabilityBlocksForUtcDay(
  doctorId: string,
  utcDayOfWeek: number
) {
  return Availability.find({
    doctor: doctorId,
    dayOfWeek: utcDayOfWeek,
    isActive: true,
  }).lean();
}

export function slotFitsAvailabilityBlocks(
  startTime: string,
  endTime: string,
  blocks: { startTime: string; endTime: string }[]
): boolean {
  const sm = timeToMinutes(startTime);
  const em = timeToMinutes(endTime);
  return blocks.some((b) => {
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    return sm >= bs && em <= be;
  });
}

export function hasOverlapOnDay(
  existingDocs: { startTime: string; endTime: string }[],
  startTime: string,
  endTime: string
): boolean {
  return existingDocs.some((apt) => rangesOverlapStrings(apt.startTime, apt.endTime, startTime, endTime));
}

export const ACTIVE_STATUSES = { $nin: ['cancelled', 'no-show'] } as const;
