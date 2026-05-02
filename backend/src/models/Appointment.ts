import mongoose, { Document, Schema, Types, type Query } from 'mongoose';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'online' | 'insurance';
export type CancelledBy = 'patient' | 'doctor' | 'admin';

export interface IAppointment extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  consultationFee: number;
  notes?: string;
  symptoms?: string;
  prescription?: string;
  diagnosis?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  cancelledAt?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    consultationFee: { type: Number, required: true },
    notes: { type: String, maxlength: [500, 'Notes cannot exceed 500 characters'] },
    symptoms: { type: String, maxlength: [1000, 'Symptoms description cannot exceed 1000 characters'] },
    prescription: { type: String, maxlength: [2000, 'Prescription cannot exceed 2000 characters'] },
    diagnosis: { type: String, maxlength: [1000, 'Diagnosis cannot exceed 1000 characters'] },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'insurance'],
    },
    cancellationReason: { type: String, maxlength: [500, 'Cancellation reason cannot exceed 500 characters'] },
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled', 'no-show'] } },
  }
);

appointmentSchema.pre('save', function (next) {
  if (this.isModified('appointmentDate') && this.appointmentDate) {
    const d = new Date(this.appointmentDate);
    if (!Number.isNaN(d.getTime())) {
      this.appointmentDate = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      );
    }
  }
  next();
});

appointmentSchema.pre('save', function (next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }

  if (this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  next();
});

appointmentSchema.pre(/^find/, function (next) {
  const q = this as Query<unknown, IAppointment>;
  void q.populate({
    path: 'patient',
    select: 'firstName lastName email phone',
  });
  void q.populate({
    path: 'doctor',
    select: 'user specialization consultationFee',
    populate: {
      path: 'user',
      select: 'firstName lastName',
    },
  });
  next();
});

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
