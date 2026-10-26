const express = require('express');
const router = express.Router();
const {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  toggleDisableSlot,
  deleteSlot,
} = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to view slots
router.get('/', getAllSlots);
router.get('/:id', getSlotById);

// Admin-only management routes
router.post('/', protect, authorize('admin'), createSlot);
router.put('/:id', protect, authorize('admin'), updateSlot);
router.put('/:id/disable', protect, authorize('admin'), toggleDisableSlot);
router.put('/:id/status', protect, authorize('admin'), toggleDisableSlot);
router.delete('/:id', protect, authorize('admin'), deleteSlot);

module.exports = router;
