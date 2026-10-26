const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

/**
 * Helper to generate random unique booking reference
 * Format: PK-YYYYMMDD-XXXX (or PK-XXXXXX)
 */
const generateTicketId = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PK-${randomNum}`;
};

/**
 * @desc    Check if a slot is available for a specified date and time window
 * @route   GET /api/bookings/check-availability
 * @access  Public
 */
exports.checkSlotAvailability = async (req, res) => {
  try {
    const { slotId, startTime, endTime } = req.query;

    if (!slotId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide slotId, startTime, and endTime to check availability.',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end time format.',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
      });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.',
      });
    }

    if (slot.status === 'maintenance' || slot.status === 'disabled') {
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'maintenance',
        message: `Slot ${slot.slotNumber} is currently closed for maintenance.`,
      });
    }

    // Check for overlapping confirmed or pending bookings
    const conflictingBooking = await Booking.findOne({
      slot: slot._id,
      bookingStatus: { $in: ['Pending', 'Confirmed', 'Active'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflictingBooking) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'booked',
        message: `Slot ${slot.slotNumber} is already booked from ${new Date(conflictingBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conflictingBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        conflict: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
        },
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      message: `Slot ${slot.slotNumber} is available for this time window.`,
      hourlyRate: slot.hourlyRate,
    });
  } catch (error) {
    console.error('[Check Availability Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify slot availability.',
    });
  }
};

/**
 * @desc    Create a new parking slot booking with strict overlap & concurrency safety
 * @route   POST /api/bookings
 * @access  Private (Derived from verified JWT)
 */
exports.createBooking = async (req, res) => {
  let tempBookingId = null;
  let slotIdRef = null;

  try {
    const {
      slotId,
      vehicleNumber,
      vehicleType,
      startTime,
      endTime,
      durationHours,
      paymentMethod,
    } = req.body;

    // 1. Validate required inputs
    if (!slotId || !vehicleNumber || !vehicleType || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: parking bay, vehicle plate, vehicle category, and schedule time.',
      });
    }

    // 2. Parse and validate time range
    const start = new Date(startTime);
    let end;

    if (endTime) {
      end = new Date(endTime);
    } else if (durationHours) {
      const durationMs = Number(durationHours) * 60 * 60 * 1000;
      end = new Date(start.getTime() + durationMs);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please specify an end time or booking duration.',
      });
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date or time format provided.',
      });
    }

    // Rule: start time must be before end time
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Booking start time must be strictly before end time.',
      });
    }

    // Rule: booking cannot be in the past (allow 15 minute clock skew leeway)
    const now = new Date();
    if (start.getTime() < now.getTime() - 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Booking start time cannot be in the past.',
      });
    }

    // 3. Find the parking slot
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Selected parking slot was not found in system inventory.',
      });
    }

    if (slot.status === 'maintenance' || slot.status === 'disabled') {
      return res.status(400).json({
        success: false,
        message: `Slot ${slot.slotNumber} is currently out of service for maintenance.`,
      });
    }

    // 4. Server-Side Price Calculation (Never trust client-supplied total amount)
    const diffMs = end.getTime() - start.getTime();
    const calculatedDuration = Math.max(1, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    const calculatedTotalAmount = Math.round(calculatedDuration * slot.hourlyRate);

    // 5. Check for overlapping confirmed or active bookings
    const overlappingBooking = await Booking.findOne({
      slot: slot._id,
      bookingStatus: { $in: ['Pending', 'Confirmed', 'Active'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingBooking) {
      const conflictStart = new Date(overlappingBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const conflictEnd = new Date(overlappingBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return res.status(409).json({
        success: false,
        message: `Conflict: Parking bay ${slot.slotNumber} is already booked from ${conflictStart} to ${conflictEnd}. Please select a different time or another bay.`,
      });
    }

    // 6. Safe Concurrency Protection: Atomic update on ParkingSlot document
    // Prevents simultaneous requests from double-booking the exact same slot and time range
    tempBookingId = new mongoose.Types.ObjectId();
    slotIdRef = slot._id;

    const lockedSlot = await ParkingSlot.findOneAndUpdate(
      {
        _id: slot._id,
        status: { $nin: ['maintenance', 'disabled'] },
        activeReservations: {
          $not: {
            $elemMatch: {
              startTime: { $lt: end },
              endTime: { $gt: start },
            },
          },
        },
      },
      {
        $push: {
          activeReservations: {
            booking: tempBookingId,
            startTime: start,
            endTime: end,
          },
        },
      },
      { new: true }
    );

    if (!lockedSlot) {
      return res.status(409).json({
        success: false,
        message: `Slot ${slot.slotNumber} was just reserved by another customer for this time window. Please select another bay.`,
      });
    }

    // 7. Store Booking details in MongoDB
    const ticketId = generateTicketId();

    const booking = await Booking.create({
      _id: tempBookingId,
      user: req.user._id, // Derived strictly from verified JWT
      slot: slot._id,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleType,
      startTime: start,
      endTime: end,
      durationHours: calculatedDuration,
      hourlyRate: slot.hourlyRate,
      totalAmount: calculatedTotalAmount,
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod || 'UPI',
      bookingStatus: 'Confirmed',
      ticketId,
    });

    // 8. Distinguish scheduled reservations from current occupancy:
    // If the booking is for right now (active session), mark slot occupied.
    // If starting in <= 30 mins, mark slot reserved.
    // Otherwise, slot remains available for now, with scheduled reservation safely recorded.
    const isCurrentlyActive = (now >= start && now <= end);
    const isStartingSoon = (start.getTime() - now.getTime() <= 30 * 60 * 1000 && now <= end);

    if (isCurrentlyActive) {
      lockedSlot.status = 'occupied';
      lockedSlot.currentBooking = booking._id;
      await lockedSlot.save();
    } else if (isStartingSoon && lockedSlot.status === 'available') {
      lockedSlot.status = 'reserved';
      lockedSlot.currentBooking = booking._id;
      await lockedSlot.save();
    }

    // 9. Update user's default vehicle info if not already saved
    if (!req.user.vehicleNumber) {
      await User.findByIdAndUpdate(req.user._id, {
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType,
      });
    }

    const populatedBooking = await Booking.findById(booking._id).populate('slot');

    res.status(201).json({
      success: true,
      message: 'Parking slot booked successfully!',
      data: populatedBooking,
      estimatedPrice: calculatedTotalAmount,
    });
  } catch (error) {
    console.error('[Create Booking Error]:', error);

    // Roll back atomic reservation window if booking document creation failed
    if (tempBookingId && slotIdRef) {
      try {
        await ParkingSlot.findByIdAndUpdate(slotIdRef, {
          $pull: { activeReservations: { booking: tempBookingId } },
        });
      } catch (rollbackErr) {
        console.error('[Rollback Error]:', rollbackErr.message);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating reservation.',
    });
  }
};

/**
 * @desc    Get logged in user's bookings history (strictly isolated)
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('slot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('[Get My Bookings Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your bookings.',
    });
  }
};

/**
 * @desc    Get all bookings across campus (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, date, slotNumber } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.bookingStatus = status;
    }

    // Filter by specific booking date
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by slot number
    if (slotNumber) {
      const matchingSlots = await ParkingSlot.find({
        slotNumber: { $regex: slotNumber.trim(), $options: 'i' },
      }).select('_id');
      const slotIds = matchingSlots.map((s) => s._id);
      query.slot = { $in: slotIds };
    }

    // Search across plate, ticket, customer name, email, phone
    if (search && search.trim()) {
      const term = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const matchingSlots = await ParkingSlot.find({
        slotNumber: { $regex: term, $options: 'i' },
      }).select('_id');
      const slotIds = matchingSlots.map((s) => s._id);

      const searchConditions = [
        { vehicleNumber: { $regex: term, $options: 'i' } },
        { ticketId: { $regex: term, $options: 'i' } },
      ];

      if (userIds.length > 0) {
        searchConditions.push({ user: { $in: userIds } });
      }
      if (slotIds.length > 0) {
        searchConditions.push({ slot: { $in: slotIds } });
      }

      query.$or = searchConditions;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone vehicleNumber')
      .populate('slot', 'slotNumber floor hourlyRate vehicleType isCovered hasCharging')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('[Get All Bookings Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings list.',
    });
  }
};

/**
 * @desc    Get single booking details with ownership protection
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('slot');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Derive user ownership safely and enforce role authorization
    const bookingUserId = booking.user && booking.user._id
      ? booking.user._id.toString()
      : booking.user.toString();

    if (
      bookingUserId !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another customer\'s booking details.',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('[Get Booking Details Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details.',
    });
  }
};

/**
 * @desc    Cancel an eligible booking (Pending or Confirmed)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Enforce ownership: customers can only cancel their own bookings
    const bookingUserId = booking.user ? booking.user.toString() : '';
    if (
      bookingUserId !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to modify another customer\'s booking.',
      });
    }

    // Eligibility validation
    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    if (booking.bookingStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed parking sessions cannot be cancelled.',
      });
    }

    if (booking.bookingStatus === 'Active' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Active in-progress parking sessions cannot be cancelled directly by customers. Please contact the parking operator.',
      });
    }

    // Update booking status
    booking.bookingStatus = 'Cancelled';
    booking.paymentStatus = 'Refunded';
    await booking.save();

    // Release reservation lock from ParkingSlot
    await ParkingSlot.findByIdAndUpdate(booking.slot, {
      $pull: { activeReservations: { booking: booking._id } },
    });

    // Check if slot currentBooking held this booking; if so, release it
    const slot = await ParkingSlot.findById(booking.slot);
    if (slot && slot.currentBooking && slot.currentBooking.toString() === booking._id.toString()) {
      slot.status = 'available';
      slot.currentBooking = null;
      await slot.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Parking bay released and refund initiated.',
      data: booking,
    });
  } catch (error) {
    console.error('[Cancel Booking Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling booking.',
    });
  }
};

/**
 * @desc    Admin updates booking status (Pending -> Confirmed -> Active -> Completed -> Cancelled)
 * @route   PUT /api/bookings/:id/status
 * @access  Private/Admin
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Permitted values: ${allowedStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    booking.bookingStatus = status;

    if (status === 'Active') {
      if (!booking.checkInTime) {
        booking.checkInTime = new Date();
      }
      // Update slot to occupied
      const slot = await ParkingSlot.findById(booking.slot);
      if (slot) {
        slot.status = 'occupied';
        slot.currentBooking = booking._id;
        await slot.save();
      }
    } else if (status === 'Completed') {
      booking.checkOutTime = new Date();
      // Remove reservation and release slot
      await ParkingSlot.findByIdAndUpdate(booking.slot, {
        $pull: { activeReservations: { booking: booking._id } },
      });
      const slot = await ParkingSlot.findById(booking.slot);
      if (slot && slot.currentBooking && slot.currentBooking.toString() === booking._id.toString()) {
        slot.status = 'available';
        slot.currentBooking = null;
        await slot.save();
      }
    } else if (status === 'Cancelled') {
      booking.paymentStatus = 'Refunded';
      // Remove reservation and release slot
      await ParkingSlot.findByIdAndUpdate(booking.slot, {
        $pull: { activeReservations: { booking: booking._id } },
      });
      const slot = await ParkingSlot.findById(booking.slot);
      if (slot && slot.currentBooking && slot.currentBooking.toString() === booking._id.toString()) {
        slot.status = 'available';
        slot.currentBooking = null;
        await slot.save();
      }
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}.`,
      data: booking,
    });
  } catch (error) {
    console.error('[Update Booking Status Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking status.',
    });
  }
};

/**
 * @desc    Admin summary analytics based on actual stored bookings & slot records
 * @route   GET /api/bookings/admin/stats
 * @access  Private/Admin
 */
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();

    const totalSlots = await ParkingSlot.countDocuments();
    const maintenanceSlots = await ParkingSlot.countDocuments({
      status: { $in: ['maintenance', 'disabled'] },
    });

    // Determine current occupancy strictly based on actual active bookings & sessions
    const activeCurrentBookings = await Booking.find({
      bookingStatus: { $in: ['Active', 'Confirmed'] },
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    const activeSlotIds = activeCurrentBookings.map((b) => b.slot.toString());
    const uniqueOccupiedSlotsCount = new Set(activeSlotIds).size;

    // Determine upcoming reserved bookings starting within next 60 minutes
    const soonThreshold = new Date(now.getTime() + 60 * 60 * 1000);
    const imminentReservations = await Booking.find({
      bookingStatus: { $in: ['Confirmed', 'Pending'] },
      startTime: { $gt: now, $lte: soonThreshold },
    });
    const reservedSlotsCount = imminentReservations.length;

    // Available slots right now (not occupied, not reserved soon, not maintenance)
    const availableSlots = Math.max(0, totalSlots - uniqueOccupiedSlotsCount - reservedSlotsCount - maintenanceSlots);

    // Lifetime booking records
    const totalBookings = await Booking.countDocuments();
    const activeBookingsCount = await Booking.countDocuments({
      bookingStatus: { $in: ['Confirmed', 'Active'] },
    });
    const scheduledFutureBookingsCount = await Booking.countDocuments({
      bookingStatus: { $in: ['Pending', 'Confirmed'] },
      startTime: { $gt: now },
    });

    // Revenue calculation
    const revenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Slot distribution by vehicle category
    const slotsByType = await ParkingSlot.aggregate([
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
    ]);

    // Bookings count by vehicle category
    const bookingsByType = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: '$vehicleType', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]);

    // 1. Daily Statistics for the past 7 days (including today)
    const dailyStatsMap = new Map();
    const daysToShow = 7;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyStatsMap.set(key, { date: key, label, bookings: 0, revenue: 0 });
    }

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysToShow);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ['$bookingStatus', 'Cancelled'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    dailyAgg.forEach((item) => {
      if (dailyStatsMap.has(item._id)) {
        const entry = dailyStatsMap.get(item._id);
        entry.bookings = item.bookings;
        entry.revenue = item.revenue;
      }
    });

    const dailyStats = Array.from(dailyStatsMap.values());

    // 2. Monthly Statistics for the past 6 months
    const monthlyStatsMap = new Map();
    const monthsToShow = 6;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyStatsMap.set(key, { month: key, label, bookings: 0, revenue: 0 });
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - monthsToShow + 1, 1);

    const monthlyAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ['$bookingStatus', 'Cancelled'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    monthlyAgg.forEach((item) => {
      if (monthlyStatsMap.has(item._id)) {
        const entry = monthlyStatsMap.get(item._id);
        entry.bookings = item.bookings;
        entry.revenue = item.revenue;
      }
    });

    const monthlyStats = Array.from(monthlyStatsMap.values());

    // Recent 10 bookings with full customer & bay details
    const recentBookings = await Booking.find()
      .populate('user', 'name email phone vehicleNumber')
      .populate('slot', 'slotNumber floor hourlyRate vehicleType')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalSlots,
        availableSlots,
        occupiedSlots: uniqueOccupiedSlotsCount,
        reservedSlots: reservedSlotsCount,
        maintenanceSlots,
        occupancyRate: totalSlots > 0 ? Math.round((uniqueOccupiedSlotsCount / totalSlots) * 100) : 0,
        totalBookings,
        activeBookings: activeBookingsCount,
        activeReservations: activeBookingsCount,
        scheduledFutureBookings: scheduledFutureBookingsCount,
        totalRevenue,
        slotsByType,
        bookingsByType,
        dailyStats,
        monthlyStats,
        recentBookings,
        detectionMethod: 'Software Reservation Engine (No IoT sensors required)',
      },
    });
  } catch (error) {
    console.error('[Get Admin Stats Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate admin statistics.',
    });
  }
};
