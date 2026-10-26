const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

/**
 * @desc    Get all parking slots (supports optional query filters & time-range availability)
 * @route   GET /api/slots
 * @access  Public
 */
exports.getAllSlots = async (req, res) => {
  try {
    const { floor, vehicleType, status, startTime, endTime } = req.query;

    const filter = {};
    if (floor && floor !== 'All') {
      filter.floor = floor;
    }
    if (vehicleType && vehicleType !== 'All') {
      filter.vehicleType = vehicleType;
    }

    // Fetch all matching slots
    let slots = await ParkingSlot.find(filter)
      .populate('currentBooking', 'ticketId vehicleNumber startTime endTime bookingStatus')
      .sort({ floor: 1, slotNumber: 1 });

    const now = new Date();

    // If query specifies startTime and endTime, evaluate availability for that requested window
    if (startTime && endTime) {
      const windowStart = new Date(startTime);
      const windowEnd = new Date(endTime);

      if (!isNaN(windowStart.getTime()) && !isNaN(windowEnd.getTime())) {
        // Find bookings overlapping with this window
        const conflictingBookings = await Booking.find({
          bookingStatus: { $in: ['Pending', 'Confirmed', 'Active'] },
          startTime: { $lt: windowEnd },
          endTime: { $gt: windowStart },
        });

        const conflictingSlotIds = new Set(conflictingBookings.map((b) => b.slot.toString()));

        slots = slots.map((slot) => {
          const slotObj = slot.toObject();
          const isBookedInWindow = conflictingSlotIds.has(slot._id.toString());
          const isUnderMaintenance = slot.status === 'maintenance' || slot.status === 'disabled';

          slotObj.isAvailableForWindow = !isBookedInWindow && !isUnderMaintenance;
          if (isUnderMaintenance) {
            slotObj.status = 'maintenance';
          } else if (isBookedInWindow) {
            slotObj.status = 'reserved';
          } else {
            slotObj.status = 'available';
          }
          return slotObj;
        });

        if (status === 'available') {
          slots = slots.filter((s) => s.isAvailableForWindow);
        }
      }
    } else {
      // Live current view: dynamically compute current occupancy & scheduled reservations from stored bookings
      const activeCurrentBookings = await Booking.find({
        bookingStatus: { $in: ['Active', 'Confirmed'] },
        startTime: { $lte: now },
        endTime: { $gte: now },
      });

      const activeBookingsMap = new Map();
      activeCurrentBookings.forEach((b) => {
        activeBookingsMap.set(b.slot.toString(), b);
      });

      // Find reservations scheduled soon (starting in <= 30 mins)
      const soonThreshold = new Date(now.getTime() + 30 * 60 * 1000);
      const imminentBookings = await Booking.find({
        bookingStatus: { $in: ['Pending', 'Confirmed'] },
        startTime: { $gt: now, $lte: soonThreshold },
      });
      const imminentSlotIds = new Set(imminentBookings.map((b) => b.slot.toString()));

      // Find future scheduled bookings to distinguish scheduled reservations
      const futureBookings = await Booking.find({
        bookingStatus: { $in: ['Pending', 'Confirmed'] },
        startTime: { $gt: now },
      }).sort({ startTime: 1 });

      const futureBookingMap = new Map();
      futureBookings.forEach((b) => {
        const slotKey = b.slot.toString();
        if (!futureBookingMap.has(slotKey)) {
          futureBookingMap.set(slotKey, b);
        }
      });

      slots = slots.map((slot) => {
        const slotObj = slot.toObject();
        const slotKey = slot._id.toString();

        if (slot.status === 'maintenance' || slot.status === 'disabled') {
          slotObj.status = 'maintenance';
        } else if (activeBookingsMap.has(slotKey)) {
          slotObj.status = 'occupied';
          slotObj.currentBooking = activeBookingsMap.get(slotKey);
        } else if (imminentSlotIds.has(slotKey)) {
          slotObj.status = 'reserved';
        } else {
          slotObj.status = 'available';
        }

        // Attach upcoming reservation metadata
        if (futureBookingMap.has(slotKey)) {
          const nextBooking = futureBookingMap.get(slotKey);
          slotObj.hasUpcomingReservation = true;
          slotObj.nextReservationStart = nextBooking.startTime;
          slotObj.nextReservationEnd = nextBooking.endTime;
        } else {
          slotObj.hasUpcomingReservation = false;
        }

        return slotObj;
      });

      // Filter by dynamic status if requested
      if (status && status !== 'All') {
        slots = slots.filter((s) => s.status === status);
      }
    }

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
      occupancyBasis: 'Software reservation engine (no IoT sensors)',
    });
  } catch (error) {
    console.error('[Get Slots Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking slots.',
    });
  }
};

/**
 * @desc    Get single parking slot details
 * @route   GET /api/slots/:id
 * @access  Public
 */
exports.getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id).populate(
      'currentBooking'
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve slot details.',
    });
  }
};

/**
 * @desc    Create a new parking slot
 * @route   POST /api/slots
 * @access  Private/Admin
 */
exports.createSlot = async (req, res) => {
  try {
    const { slotNumber, floor, vehicleType, hourlyRate, isCovered, hasCharging, status } = req.body;

    const existingSlot = await ParkingSlot.findOne({
      slotNumber: slotNumber.toUpperCase().trim(),
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: `Slot with number ${slotNumber} already exists.`,
      });
    }

    const newSlot = await ParkingSlot.create({
      slotNumber: slotNumber.toUpperCase().trim(),
      floor,
      vehicleType,
      hourlyRate: Number(hourlyRate) || 50,
      isCovered: isCovered !== undefined ? isCovered : true,
      hasCharging: hasCharging !== undefined ? hasCharging : false,
      status: status || 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Parking slot created successfully!',
      data: newSlot,
    });
  } catch (error) {
    console.error('[Create Slot Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating parking slot.',
    });
  }
};

/**
 * @desc    Update a parking slot
 * @route   PUT /api/slots/:id
 * @access  Private/Admin
 */
exports.updateSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.',
      });
    }

    const { slotNumber, floor, vehicleType, hourlyRate, status, isCovered, hasCharging } = req.body;

    // Check if updating slotNumber to one that belongs to another slot
    if (slotNumber && slotNumber.toUpperCase().trim() !== slot.slotNumber) {
      const duplicate = await ParkingSlot.findOne({
        slotNumber: slotNumber.toUpperCase().trim(),
        _id: { $ne: slot._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Parking slot with number ${slotNumber} already exists.`,
        });
      }
      slot.slotNumber = slotNumber.toUpperCase().trim();
    }

    if (floor) slot.floor = floor;
    if (vehicleType) slot.vehicleType = vehicleType;
    if (hourlyRate !== undefined) {
      const rate = Number(hourlyRate);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Hourly rate must be a non-negative number.',
        });
      }
      slot.hourlyRate = rate;
    }

    if (status) {
      if (slot.status === 'occupied' && (status === 'maintenance' || status === 'disabled')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable or set an occupied slot to maintenance while a vehicle is parked.',
        });
      }
      slot.status = status;
    }

    if (isCovered !== undefined) slot.isCovered = isCovered;
    if (hasCharging !== undefined) slot.hasCharging = hasCharging;

    const updatedSlot = await slot.save();

    res.status(200).json({
      success: true,
      message: 'Parking slot updated successfully!',
      data: updatedSlot,
    });
  } catch (error) {
    console.error('[Update Slot Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating parking slot.',
    });
  }
};

/**
 * @desc    Toggle slot disable/maintenance status
 * @route   PUT /api/slots/:id/disable
 * @access  Private/Admin
 */
exports.toggleDisableSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.',
      });
    }

    if (slot.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot disable slot: A vehicle is currently parked in this bay.',
      });
    }

    // Toggle between maintenance/disabled and available
    const isCurrentlyDisabled = slot.status === 'maintenance' || slot.status === 'disabled';
    const newStatus = isCurrentlyDisabled ? 'available' : (req.body.status || 'maintenance');

    slot.status = newStatus;
    const updatedSlot = await slot.save();

    res.status(200).json({
      success: true,
      message: `Parking bay ${slot.slotNumber} has been ${isCurrentlyDisabled ? 'enabled (Available)' : 'disabled (Maintenance)'}.`,
      data: updatedSlot,
    });
  } catch (error) {
    console.error('[Toggle Disable Slot Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing slot status.',
    });
  }
};

/**
 * @desc    Delete a parking slot
 * @route   DELETE /api/slots/:id
 * @access  Private/Admin
 */
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.',
      });
    }

    if (slot.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied parking slot. Please checkout the vehicle first.',
      });
    }

    await slot.deleteOne();

    res.status(200).json({
      success: true,
      message: `Parking slot ${slot.slotNumber} deleted successfully!`,
    });
  } catch (error) {
    console.error('[Delete Slot Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting parking slot.',
    });
  }
};
