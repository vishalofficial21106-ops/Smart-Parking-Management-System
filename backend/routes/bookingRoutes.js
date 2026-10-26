const express = require('express');
const router = express.Router();
const {
  createBooking,
  checkSlotAvailability,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  getAdminStats,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public availability check for date & time window
router.get('/check-availability', checkSlotAvailability);

// User booking actions
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

// Admin-only booking routes & stats
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.get('/', protect, authorize('admin'), getAllBookings);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);

module.exports = router;
