/**
 * Calendar-day and slot rules shared by appointment + availability flows.
 * All calendar math uses UTC date parts of the stored appointment "day" field.
 */

const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');

function parseIntEnv(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

function minBookingNoticeHours() {
  return Math.max(0, parseIntEnv('MIN_BOOKING_NOTICE_HOURS', 2));
}

function cancellationNoticeHours() {
  return Math.max(0, parseIntEnv('CANCELLATION_NOTICE_HOURS', 24));
}

function timeToMinutes(t) {
  const [h, m] = String(t).split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function rangesOverlapMinutes(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function rangesOverlapStrings(s1, e1, s2, e2) {
  return rangesOverlapMinutes(timeToMinutes(s1), timeToMinutes(e1), timeToMinutes(s2), timeToMinutes(e2));
}

/** Normalize any Date / ISO input to UTC midnight for that calendar day (UTC). */
function normalizeAppointmentDay(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Instant of slot start in UTC (day at UTC midnight + clock time as UTC wall time). */
function combineUtcDayAndTime(dayDate, timeStr) {
  const d = new Date(dayDate);
  const [h, m] = String(timeStr).split(':').map((x) => parseInt(x, 10));
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, 0, 0)
  );
}

async function doctorOwnsAppointment(userId, appointment) {
  const profile = await Doctor.findOne({ user: userId });
  if (!profile) return false;
  const docId = appointment.doctor?._id || appointment.doctor;
  return profile._id.toString() === docId.toString();
}

function patientOwnsAppointment(userId, appointment) {
  const pid = appointment.patient?._id || appointment.patient;
  return pid.toString() === userId.toString();
}

/** All active availability rows for this doctor on a UTC weekday (0–6). */
async function getActiveAvailabilityBlocksForUtcDay(doctorId, utcDayOfWeek) {
  return Availability.find({
    doctor: doctorId,
    dayOfWeek: utcDayOfWeek,
    isActive: true,
  }).lean();
}

/** True if [startTime, endTime] lies fully inside at least one availability block. */
function slotFitsAvailabilityBlocks(startTime, endTime, blocks) {
  const sm = timeToMinutes(startTime);
  const em = timeToMinutes(endTime);
  return blocks.some((b) => {
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    return sm >= bs && em <= be;
  });
}

/** True if slot overlaps any active (non-cancelled) appointment on the same calendar day. */
function hasOverlapOnDay(existingDocs, startTime, endTime) {
  return existingDocs.some((apt) =>
    rangesOverlapStrings(apt.startTime, apt.endTime, startTime, endTime)
  );
}

const ACTIVE_STATUSES = { $nin: ['cancelled', 'no-show'] };

module.exports = {
  minBookingNoticeHours,
  cancellationNoticeHours,
  timeToMinutes,
  rangesOverlapMinutes,
  rangesOverlapStrings,
  normalizeAppointmentDay,
  combineUtcDayAndTime,
  doctorOwnsAppointment,
  patientOwnsAppointment,
  getActiveAvailabilityBlocksForUtcDay,
  slotFitsAvailabilityBlocks,
  hasOverlapOnDay,
  ACTIVE_STATUSES,
};
