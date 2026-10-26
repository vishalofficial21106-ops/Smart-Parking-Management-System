const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: [true, 'Please provide a unique slot number (e.g. G-01, F1-04)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    floor: {
      type: String,
      required: [true, 'Please specify the floor or deck location'],
      default: 'Ground Floor',
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Please specify supported vehicle category'],
      enum: ['Four-Wheeler', 'Two-Wheeler', 'EV'],
      default: 'Four-Wheeler',
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please specify hourly parking rate in INR'],
      min: [0, 'Hourly rate cannot be negative'],
      default: 50,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance', 'disabled'],
      default: 'available',
      lowercase: true,
      trim: true,
    },
    isCovered: {
      type: Boolean,
      default: true,
    },
    hasCharging: {
      type: Boolean,
      default: false,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // Array of active reservation time windows for atomic conflict prevention
    activeReservations: [
      {
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
        },
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

parkingSlotSchema.index({ 'activeReservations.startTime': 1, 'activeReservations.endTime': 1 });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
