const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0, // Sunday
    max: 6  // Saturday
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  slotDuration: {
    type: Number,
    required: true,
    default: 30, // minutes
    min: [15, 'Slot duration must be at least 15 minutes'],
    max: [120, 'Slot duration cannot exceed 120 minutes']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
availabilitySchema.index({ doctor: 1, dayOfWeek: 1 });
availabilitySchema.index({ doctor: 1, isActive: 1 });

// Validate that end time is after start time
availabilitySchema.pre('save', function(next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// Populate doctor data when querying
availabilitySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'doctor',
    select: 'user specialization consultationFee',
    populate: {
      path: 'user',
      select: 'firstName lastName'
    }
  });
  next();
});

module.exports = mongoose.model('Availability', availabilitySchema);
