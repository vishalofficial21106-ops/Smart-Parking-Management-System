const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['Four-Wheeler', 'Two-Wheeler', 'EV'],
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    durationHours: {
      type: Number,
      required: true,
      min: [1, 'Minimum booking duration is 1 hour'],
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Refunded'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Credit/Debit Card', 'Net Banking', 'Pay at Gate'],
      default: 'UPI',
    },
    bookingStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
      default: 'Confirmed',
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high-performance overlapping reservation conflict detection
bookingSchema.index({ slot: 1, bookingStatus: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
