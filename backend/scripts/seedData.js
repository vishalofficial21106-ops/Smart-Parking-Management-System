const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

dotenv.config();

const sampleSlots = [
  // Ground Floor - Four Wheeler & EV
  { slotNumber: 'G-01', floor: 'Ground Floor', vehicleType: 'Four-Wheeler', hourlyRate: 60, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'G-02', floor: 'Ground Floor', vehicleType: 'Four-Wheeler', hourlyRate: 60, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'G-03', floor: 'Ground Floor', vehicleType: 'EV', hourlyRate: 80, isCovered: true, hasCharging: true, status: 'available' },
  { slotNumber: 'G-04', floor: 'Ground Floor', vehicleType: 'EV', hourlyRate: 80, isCovered: true, hasCharging: true, status: 'available' },
  { slotNumber: 'G-05', floor: 'Ground Floor', vehicleType: 'Two-Wheeler', hourlyRate: 30, isCovered: false, hasCharging: false, status: 'available' },
  { slotNumber: 'G-06', floor: 'Ground Floor', vehicleType: 'Two-Wheeler', hourlyRate: 30, isCovered: false, hasCharging: false, status: 'available' },

  // Floor 1 - Premium Covered
  { slotNumber: 'F1-01', floor: 'Floor 1', vehicleType: 'Four-Wheeler', hourlyRate: 50, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'F1-02', floor: 'Floor 1', vehicleType: 'Four-Wheeler', hourlyRate: 50, isCovered: true, hasCharging: false, status: 'occupied' },
  { slotNumber: 'F1-03', floor: 'Floor 1', vehicleType: 'Four-Wheeler', hourlyRate: 50, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'F1-04', floor: 'Floor 1', vehicleType: 'EV', hourlyRate: 75, isCovered: true, hasCharging: true, status: 'available' },
  { slotNumber: 'F1-05', floor: 'Floor 1', vehicleType: 'Two-Wheeler', hourlyRate: 25, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'F1-06', floor: 'Floor 1', vehicleType: 'Two-Wheeler', hourlyRate: 25, isCovered: true, hasCharging: false, status: 'maintenance' },

  // Floor 2 - Standard
  { slotNumber: 'F2-01', floor: 'Floor 2', vehicleType: 'Four-Wheeler', hourlyRate: 40, isCovered: false, hasCharging: false, status: 'available' },
  { slotNumber: 'F2-02', floor: 'Floor 2', vehicleType: 'Four-Wheeler', hourlyRate: 40, isCovered: false, hasCharging: false, status: 'available' },
  { slotNumber: 'F2-03', floor: 'Floor 2', vehicleType: 'Two-Wheeler', hourlyRate: 20, isCovered: false, hasCharging: false, status: 'available' },
  { slotNumber: 'F2-04', floor: 'Floor 2', vehicleType: 'Two-Wheeler', hourlyRate: 20, isCovered: false, hasCharging: false, status: 'available' },

  // Basement 1 - Secure Covered
  { slotNumber: 'B1-01', floor: 'Basement 1', vehicleType: 'Four-Wheeler', hourlyRate: 55, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'B1-02', floor: 'Basement 1', vehicleType: 'Four-Wheeler', hourlyRate: 55, isCovered: true, hasCharging: false, status: 'available' },
  { slotNumber: 'B1-03', floor: 'Basement 1', vehicleType: 'EV', hourlyRate: 85, isCovered: true, hasCharging: true, status: 'available' },
  { slotNumber: 'B1-04', floor: 'Basement 1', vehicleType: 'Two-Wheeler', hourlyRate: 25, isCovered: true, hasCharging: false, status: 'available' },
];

/**
 * Seed initial sample users, parking slots, and historical bookings
 */
const seedInitialData = async (force = false) => {
  try {
    const existingSlotsCount = await ParkingSlot.countDocuments();
    if (!force && existingSlotsCount > 0) {
      console.log(`[Seed] Database already contains ${existingSlotsCount} slots. Skipping seed.`);
      return;
    }

    if (force) {
      await User.deleteMany();
      await ParkingSlot.deleteMany();
      await Booking.deleteMany();
      console.log('[Seed] Cleared existing data.');
    }

    // 1. Create or ensure Admin & Customer Users
    let adminUser = await User.findOne({ email: 'admin@parking.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Campus Parking Admin',
        email: 'admin@parking.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91 98765 43210',
        vehicleNumber: 'KA-01-AB-9999',
        vehicleType: 'Four-Wheeler',
      });
    }

    let studentUser = await User.findOne({ email: 'user@parking.com' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Rahul Sharma',
        email: 'user@parking.com',
        password: 'user123',
        role: 'user',
        phone: '+91 91234 56789',
        vehicleNumber: 'MH-12-DE-1423',
        vehicleType: 'Four-Wheeler',
      });
    }

    console.log('[Seed] Core Demo Users confirmed (admin@parking.com / user@parking.com).');

    // 2. Create Slots
    const createdSlots = await ParkingSlot.insertMany(sampleSlots);
    console.log(`[Seed] ${createdSlots.length} Parking slots created across decks.`);

    // 3. Create Sample Bookings for realistic dashboard statistics
    const occupiedSlot = createdSlots.find((s) => s.slotNumber === 'F1-02');
    const availableSlot = createdSlots.find((s) => s.slotNumber === 'G-01');
    const evSlot = createdSlots.find((s) => s.slotNumber === 'G-03');

    if (occupiedSlot) {
      const activeBooking = await Booking.create({
        user: studentUser._id,
        slot: occupiedSlot._id,
        vehicleNumber: studentUser.vehicleNumber,
        vehicleType: studentUser.vehicleType,
        startTime: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        endTime: new Date(Date.now() + 7200 * 1000),   // 2 hours from now
        durationHours: 3,
        hourlyRate: occupiedSlot.hourlyRate,
        totalAmount: 3 * occupiedSlot.hourlyRate,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        bookingStatus: 'Active',
        ticketId: 'PK-849201',
        checkInTime: new Date(Date.now() - 3500 * 1000),
      });

      occupiedSlot.status = 'occupied';
      occupiedSlot.currentBooking = activeBooking._id;
      occupiedSlot.activeReservations.push({
        booking: activeBooking._id,
        startTime: activeBooking.startTime,
        endTime: activeBooking.endTime,
      });
      await occupiedSlot.save();
    }

    if (availableSlot) {
      // Completed booking from yesterday
      await Booking.create({
        user: studentUser._id,
        slot: availableSlot._id,
        vehicleNumber: studentUser.vehicleNumber,
        vehicleType: studentUser.vehicleType,
        startTime: new Date(Date.now() - 28 * 3600 * 1000),
        endTime: new Date(Date.now() - 25 * 3600 * 1000),
        durationHours: 3,
        hourlyRate: availableSlot.hourlyRate,
        totalAmount: 3 * availableSlot.hourlyRate,
        paymentStatus: 'Paid',
        paymentMethod: 'Credit/Debit Card',
        bookingStatus: 'Completed',
        ticketId: 'PK-423190',
        checkInTime: new Date(Date.now() - 28 * 3600 * 1000),
        checkOutTime: new Date(Date.now() - 25 * 3600 * 1000),
      });
    }

    if (evSlot) {
      // Confirmed upcoming booking
      const confirmedBooking = await Booking.create({
        user: studentUser._id,
        slot: evSlot._id,
        vehicleNumber: 'MH-14-EV-5544',
        vehicleType: 'EV',
        startTime: new Date(Date.now() + 1800 * 1000), // 30 mins from now
        endTime: new Date(Date.now() + 9000 * 1000),   // 2.5 hours
        durationHours: 2,
        hourlyRate: evSlot.hourlyRate,
        totalAmount: 2 * evSlot.hourlyRate,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        bookingStatus: 'Confirmed',
        ticketId: 'PK-991204',
      });

      evSlot.activeReservations.push({
        booking: confirmedBooking._id,
        startTime: confirmedBooking.startTime,
        endTime: confirmedBooking.endTime,
      });
      await evSlot.save();
    }

    console.log('[Seed] Realistic presentation demo bookings initialized successfully.');
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// If run directly from terminal
if (require.main === module) {
  (async () => {
    try {
      const isForce = process.argv.includes('--force') || process.env.SEED_FORCE === 'true';
      const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';
      console.log(`[Seed CLI] Connecting to MongoDB (${uri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'})...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

      const count = await ParkingSlot.countDocuments();
      if (count > 0 && !isForce) {
        console.log(`[Seed CLI] ⚠️  Safe Mode: Database already contains ${count} parking slots.`);
        console.log(`[Seed CLI] To wipe and re-seed from scratch, run: npm run seed -- --force`);
        console.log('====================================================');
        console.log(' DEMO CREDENTIALS:');
        console.log('  Admin Login: email: admin@parking.com | pass: admin123');
        console.log('  User Login:  email: user@parking.com  | pass: user123');
        console.log('====================================================');
        process.exit(0);
      }

      await seedInitialData(isForce || count === 0);
      console.log('====================================================');
      console.log(' DEMO CREDENTIALS FOR PROJECT PRESENTATION:');
      console.log('  Admin Login: email: admin@parking.com | pass: admin123');
      console.log('  User Login:  email: user@parking.com  | pass: user123');
      console.log('====================================================');
      process.exit(0);
    } catch (err) {
      console.error('\n[Seed CLI Error]:', err.message);
      if (err.message.includes('ECONNREFUSED') || err.message.includes('timed out')) {
        console.log('\n---------------------------------------------------------------');
        console.log('💡 MongoDB Connection Tip:');
        console.log('  1. For Cloud Database (Recommended):');
        console.log('     Configure your MongoDB Atlas cluster URI in backend/.env:');
        console.log('     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/smart_parking_db');
        console.log('  2. For Local Database:');
        console.log('     Ensure the local MongoDB daemon is running: mongod');
        console.log('  3. Zero-Config Demo Mode:');
        console.log('     When running "node server.js", an in-memory database automatically');
        console.log('     starts and pre-seeds sample slots if no external DB is found!');
        console.log('---------------------------------------------------------------\n');
      }
      process.exit(1);
    }
  })();
}

module.exports = { seedInitialData, sampleSlots };
