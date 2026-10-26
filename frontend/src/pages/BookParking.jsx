import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { slotAPI, bookingAPI } from '../services/api';
import TicketModal from '../components/TicketModal';
import { 
  Calendar, 
  Clock, 
  Car, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const BookParking = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Read slotId from query param if passed e.g. /book?slotId=123
  const queryParams = new URLSearchParams(location.search);
  const initialSlotId = queryParams.get('slotId') || '';

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form Inputs
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || 'Four-Wheeler');
  
  // Format current date and time for inputs
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const endHours = String(Math.min(23, now.getHours() + 2)).padStart(2, '0');

  const [bookingDate, setBookingDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(`${currentHours}:${currentMinutes}`);
  const [endTime, setEndTime] = useState(`${endHours}:${currentMinutes}`);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [slotAvailabilityCheck, setSlotAvailabilityCheck] = useState({ checking: false, available: true, message: '' });

  // Fetch available slots from backend REST API
  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
      const endDateTime = new Date(`${bookingDate}T${endTime}:00`);

      const params = { status: 'available' };
      if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime()) && startDateTime < endDateTime) {
        params.startTime = startDateTime.toISOString();
        params.endTime = endDateTime.toISOString();
      }

      const res = await slotAPI.getAllSlots(params);
      if (res.success && res.data) {
        setAvailableSlots(res.data);
        if (initialSlotId) {
          const found = res.data.find((s) => s._id === initialSlotId);
          if (found) {
            setSelectedSlotId(found._id);
            setSelectedSlot(found);
            setVehicleType(found.vehicleType);
          }
        } else if (res.data.length > 0) {
          setSelectedSlotId(res.data[0]._id);
          setSelectedSlot(res.data[0]);
          setVehicleType(res.data[0].vehicleType);
        }
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.warn('Error fetching slots for booking:', err.message);
      setError(err.message || 'Unable to connect to Parking Slot REST API (http://localhost:5000/api/slots). Please start the backend.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [initialSlotId]);

  // When selectedSlotId changes, update selectedSlot
  const handleSlotChange = (e) => {
    const id = e.target.value;
    setSelectedSlotId(id);
    const found = availableSlots.find((s) => s._id === id);
    if (found) {
      setSelectedSlot(found);
      setVehicleType(found.vehicleType);
    }
  };

  // Calculate duration between startTime and endTime on bookingDate
  const calculateDuration = () => {
    if (!bookingDate || !startTime || !endTime) return 1;
    const start = new Date(`${bookingDate}T${startTime}:00`);
    const end = new Date(`${bookingDate}T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(1, Math.round(hours * 10) / 10);
  };

  const durationHours = calculateDuration();
  const hourlyRate = selectedSlot ? selectedSlot.hourlyRate : 50;
  const totalAmount = hourlyRate * durationHours;

  // Real-time server availability check for selected slot and time range
  useEffect(() => {
    if (!selectedSlotId || !bookingDate || !startTime || !endTime) return;

    const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
    const endDateTime = new Date(`${bookingDate}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime()) || startDateTime >= endDateTime) {
      return;
    }

    let isMounted = true;
    const verifyWindowAvailability = async () => {
      try {
        setSlotAvailabilityCheck({ checking: true, available: true, message: '' });
        const res = await bookingAPI.checkAvailability(
          selectedSlotId,
          startDateTime.toISOString(),
          endDateTime.toISOString()
        );
        if (isMounted) {
          setSlotAvailabilityCheck({
            checking: false,
            available: res.available,
            message: res.message || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setSlotAvailabilityCheck({ checking: false, available: true, message: '' });
        }
      }
    };

    const timeout = setTimeout(verifyWindowAvailability, 400);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [selectedSlotId, bookingDate, startTime, endTime]);

  const handleQuickAddHours = (extraHours) => {
    const start = new Date(`${bookingDate}T${startTime}:00`);
    const newEnd = new Date(start.getTime() + extraHours * 60 * 60 * 1000);
    const newH = String(newEnd.getHours()).padStart(2, '0');
    const newM = String(newEnd.getMinutes()).padStart(2, '0');
    setEndTime(`${newH}:${newM}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select an available parking slot.');
      return;
    }

    if (!vehicleNumber.trim()) {
      setError('Please enter your vehicle registration plate number.');
      return;
    }

    if (!bookingDate) {
      setError('Please select a booking date.');
      return;
    }

    if (durationHours <= 0) {
      setError('Start time must be before end time.');
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
    const endDateTime = new Date(`${bookingDate}T${endTime}:00`);

    if (startDateTime.getTime() < Date.now() - 15 * 60 * 1000) {
      // Small 15 min leeway for clock differences
      setError('Start date and time cannot be in the past.');
      return;
    }

    if (!slotAvailabilityCheck.available) {
      setError(slotAvailabilityCheck.message || 'The selected slot has an overlapping reservation during this time.');
      return;
    }

    try {
      setSubmitting(true);
      const bookingData = {
        slotId: selectedSlotId,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationHours: Number(durationHours),
        paymentMethod,
      };

      const res = await bookingAPI.createBooking(bookingData);
      if (res.success && res.data) {
        setConfirmedBooking(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error occurred while creating reservation. Please verify backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="book-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={28} className="text-primary-light" />
            Book Parking Slot
          </h1>
          <p className="page-subtitle">Instant reservation with dynamic pricing and automated contactless QR gate pass.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          {availableSlots.length === 0 && (
            <button onClick={fetchAvailableSlots} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
              Retry Loading Slots
            </button>
          )}
        </div>
      )}

      <div className="booking-layout">
        {/* Form Column */}
        <div className="booking-form-card card">
          <form onSubmit={handleSubmit}>
            {/* 1. Slot Selector */}
            <div className="form-section-title">
              <span className="step-badge">1</span>
              <h3>Select Parking Slot</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Available Slots</label>
              {loading ? (
                <div style={{ padding: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  <span>Fetching free bays from server...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="alert alert-error">
                  No parking slots are currently free. Please choose another deck or wait for a bay to be released.
                </div>
              ) : (
                <select
                  className="form-control"
                  value={selectedSlotId}
                  onChange={handleSlotChange}
                  required
                >
                  {availableSlots.map((s) => (
                    <option key={s._id} value={s._id}>
                      Bay {s.slotNumber} - {s.floor} ({s.vehicleType}) - ₹{s.hourlyRate}/hr {s.hasCharging ? '⚡ EV' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Vehicle Registration & Details */}
            <div className="form-section-title">
              <span className="step-badge">2</span>
              <h3>Vehicle Registration</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number</label>
                <div className="input-with-icon">
                  <Car size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    className="form-control with-icon"
                    placeholder="e.g. MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-control"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
                  <option value="Two-Wheeler">Two-Wheeler (Motorbike)</option>
                  <option value="EV">Electric Vehicle (EV Bay)</option>
                </select>
              </div>
            </div>

            {/* 3. Date, Start Time & End Time */}
            <div className="form-section-title">
              <span className="step-badge">3</span>
              <h3>Schedule: Date, Start & End Time</h3>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Booking Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Duration Helpers */}
            <div className="quick-duration-row">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              <button type="button" onClick={() => handleQuickAddHours(1)} className="preset-btn">+1 Hour</button>
              <button type="button" onClick={() => handleQuickAddHours(2)} className="preset-btn">+2 Hours</button>
              <button type="button" onClick={() => handleQuickAddHours(4)} className="preset-btn">+4 Hours</button>
              <button type="button" onClick={() => handleQuickAddHours(8)} className="preset-btn">+8 Hours</button>
              <span className="duration-calc-badge">
                Computed Duration: <strong>{durationHours} hrs</strong>
              </span>
            </div>

            {/* Live Bay Schedule Availability Check Banner */}
            {selectedSlot && (
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                {slotAvailabilityCheck.checking ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                    <span>Checking Bay {selectedSlot.slotNumber} schedule availability for this time window...</span>
                  </div>
                ) : !slotAvailabilityCheck.available ? (
                  <div className="alert alert-error" style={{ padding: '0.65rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{slotAvailabilityCheck.message}</span>
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle size={15} />
                    <span>Bay {selectedSlot.slotNumber} ({selectedSlot.floor}) is completely available for this date & time range.</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Payment Method */}
            <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
              <span className="step-badge">4</span>
              <h3>Payment Method</h3>
            </div>

            <div className="payment-options">
              {['UPI', 'Credit/Debit Card', 'Net Banking', 'Pay at Gate'].map((pm) => (
                <label key={pm} className={`pm-label ${paymentMethod === pm ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm}
                    checked={paymentMethod === pm}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>{pm}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || availableSlots.length === 0 || durationHours <= 0 || !slotAvailabilityCheck.available}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.75rem' }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  <span>Generating Digital Pass...</span>
                </>
              ) : (
                <>
                  <span>Confirm Booking & Pay ₹{totalAmount}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Bill Summary Column */}
        <div className="booking-summary-col">
          <div className="summary-card card">
            <div className="summary-header">
              <h3>Reservation Pass Summary</h3>
              <span className="badge badge-primary">
                <Sparkles size={12} /> Instant Pass
              </span>
            </div>

            <div className="selected-slot-preview">
              <div className="slot-pill-large">
                <span className="slot-code-txt">{selectedSlot?.slotNumber || 'BAY'}</span>
                <span className="slot-floor-txt">{selectedSlot?.floor || 'Floor Level'}</span>
              </div>
              <div className="slot-attr-list">
                <span className="attr-item">Vehicle: <strong>{vehicleType}</strong></span>
                <span className="attr-item">Plate: <strong>{vehicleNumber || 'Pending'}</strong></span>
                <span className="attr-item">Hourly Rate: <strong>₹{hourlyRate}/hr</strong></span>
                {selectedSlot?.hasCharging && (
                  <span className="attr-item text-cyan">⚡ Fast EV Charging Port Included</span>
                )}
              </div>
            </div>

            <div className="time-summary-box">
              <div className="time-row">
                <span className="time-label">Date:</span>
                <span className="time-val">{bookingDate}</span>
              </div>
              <div className="time-row">
                <span className="time-label">Start Time:</span>
                <span className="time-val">{startTime}</span>
              </div>
              <div className="time-row">
                <span className="time-label">End Time:</span>
                <span className="time-val">{endTime}</span>
              </div>
              <div className="time-row">
                <span className="time-label">Duration:</span>
                <span className="time-val highlight">{durationHours} Hours</span>
              </div>
            </div>

            <div className="billing-rows">
              <div className="bill-row">
                <span>Parking Fee (₹{hourlyRate} × {durationHours} hrs)</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="bill-row">
                <span>Cloud Platform Fee</span>
                <span style={{ color: '#10b981' }}>FREE (₹0)</span>
              </div>
              <div className="bill-row total">
                <span>Total Amount Due</span>
                <span className="bill-total-price">₹{totalAmount}</span>
              </div>
            </div>

            <div className="summary-security-note">
              <ShieldCheck size={16} className="text-emerald" />
              <span>Full refund guarantee if cancelled prior to check-in. Automated contactless QR pass issued on confirmation.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Pass Modal upon success */}
      {confirmedBooking && (
        <TicketModal 
          booking={confirmedBooking} 
          onClose={() => {
            setConfirmedBooking(null);
            navigate('/my-bookings');
          }} 
        />
      )}

      <style>{`
        .book-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .booking-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        .form-section-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
          margin-top: 1.25rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .form-section-title:first-of-type {
          margin-top: 0;
        }
        .form-section-title h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }
        .step-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 1rem;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        .form-control.with-icon {
          padding-left: 2.75rem;
        }
        .quick-duration-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: -0.5rem;
          margin-bottom: 1rem;
        }
        .preset-btn {
          font-size: 0.75rem;
          padding: 0.25rem 0.55rem;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #fff;
          border-color: rgba(99, 102, 241, 0.35);
        }
        .duration-calc-badge {
          font-size: 0.78rem;
          color: #38bdf8;
          margin-left: auto;
          background: rgba(56, 189, 248, 0.1);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.25);
        }
        .payment-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
        }
        .pm-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: var(--bg-card-subtle);
          border: 1px solid var(--border-color);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .pm-label.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: var(--primary-light);
          color: #fff;
        }
        .summary-card {
          background: linear-gradient(145deg, #131b2e, #0f1626);
          border: 1px solid rgba(99, 102, 241, 0.25);
          position: sticky;
          top: 85px;
        }
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .summary-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .selected-slot-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.25);
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }
        .slot-pill-large {
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          text-align: center;
          line-height: 1.1;
        }
        .slot-code-txt {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
          display: block;
        }
        .slot-floor-txt {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
        }
        .slot-attr-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .attr-item strong {
          color: #fff;
        }
        .time-summary-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .time-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .time-label {
          color: var(--text-muted);
        }
        .time-val {
          color: #fff;
          font-weight: 600;
        }
        .time-val.highlight {
          color: #38bdf8;
        }
        .billing-rows {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.85rem 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.25rem;
        }
        .bill-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .bill-row.total {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          padding-top: 0.5rem;
        }
        .bill-total-price {
          color: #10b981;
        }
        .summary-security-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        @media (max-width: 960px) {
          .booking-layout {
            grid-template-columns: 1fr;
          }
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BookParking;
