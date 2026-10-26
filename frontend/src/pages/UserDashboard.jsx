import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, slotAPI, authAPI } from '../services/api';
import TicketModal from '../components/TicketModal';
import { 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  QrCode, 
  AlertCircle, 
  Shield, 
  Bike, 
  Zap,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';

const UserDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [totalSlotsCount, setTotalSlotsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Profile Edit State
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || 'Four-Wheeler');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bookingsRes, slotsRes] = await Promise.allSettled([
        bookingAPI.getMyBookings(),
        slotAPI.getAllSlots(),
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
        setBookings(bookingsRes.value.data || []);
      }
      if (slotsRes.status === 'fulfilled' && slotsRes.value.success && slotsRes.value.data) {
        const freeSlots = slotsRes.value.data.filter((s) => s.status === 'available').length;
        setAvailableSlotsCount(freeSlots);
        setTotalSlotsCount(slotsRes.value.data.length);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
      setError('Unable to reach server. Please check that backend is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile({ vehicleNumber, vehicleType });
      if (res.success) {
        updateUserProfile({ vehicleNumber, vehicleType });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Error updating vehicle');
    }
  };

  // Find active or confirmed booking
  const activeBooking = bookings.find(
    (b) => b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed'
  );

  return (
    <div className="dashboard-container">
      {/* Top Banner Greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Car size={28} className="text-primary-light" />
            Driver Dashboard
          </h1>
          <p className="page-subtitle">Welcome back, {user?.name}! Manage your parking reservations, passes, and view campus availability.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/book" className="btn btn-primary btn-sm">
            <Calendar size={14} /> Book Parking
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats row with Available Slots and Total Bookings */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <span className="stat-label">Available Slots</span>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {availableSlotsCount} <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {totalSlotsCount || 0}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <span className="status-indicator-dot available"></span> Live Free Bays
            </span>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
            <MapPin size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Total Bookings</span>
            <div className="stat-value">{bookings.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Lifetime Reservations
            </span>
          </div>
          <div className="stat-icon" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)' }}>
            <Calendar size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Active Bookings</span>
            <div className="stat-value" style={{ color: '#06b6d4' }}>
              {bookings.filter((b) => b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed').length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Currently Valid Passes
            </span>
          </div>
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
            <BookmarkCheck size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Registered Vehicle</span>
            <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {user?.vehicleNumber || 'Not Set'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.2rem', display: 'block' }}>
              {user?.vehicleType || 'Four-Wheeler'}
            </span>
          </div>
          <div className="stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.12)' }}>
            <Car size={26} />
          </div>
        </div>
      </div>

      {/* Prominent Active Pass Card (if any active booking exists) */}
      {activeBooking && (
        <div className="active-pass-hero card">
          <div className="active-pass-header">
            <div className="active-indicator-box">
              <span className="active-pulse-circle"></span>
              <div>
                <span className="active-tag">ACTIVE RESERVATION IN PROGRESS</span>
                <h3 className="active-ticket-num">{activeBooking.ticketId}</h3>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTicket(activeBooking)}
              className="btn btn-primary"
            >
              <QrCode size={16} /> Open Digital QR Pass
            </button>
          </div>

          <div className="active-pass-details">
            <div className="active-detail-col">
              <span className="label">ASSIGNED BAY</span>
              <span className="val highlight">{activeBooking.slot?.slotNumber || 'Bay Assigned'}</span>
            </div>
            <div className="active-detail-col">
              <span className="label">FLOOR LEVEL</span>
              <span className="val">{activeBooking.slot?.floor || 'Main Garage'}</span>
            </div>
            <div className="active-detail-col">
              <span className="label">VEHICLE</span>
              <span className="val mono">{activeBooking.vehicleNumber}</span>
            </div>
            <div className="active-detail-col">
              <span className="label">VALID UNTIL</span>
              <span className="val">
                {activeBooking.endTime ? new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Bookings & Vehicle Settings */}
      <div className="dashboard-grid-layout">
        {/* Left: Recent Bookings */}
        <div className="dashboard-left card">
          <div className="card-top-title">
            <h3>Recent Bookings</h3>
            <Link to="/my-bookings" className="sub-link">
              View All ({bookings.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading your reservations...</p>
          ) : bookings.length === 0 ? (
            <div className="empty-state-box">
              <Calendar size={36} className="text-dim" />
              <p>No parking slots reserved yet.</p>
              <Link to="/book" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Reserve First Slot
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Bay</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{b.ticketId}</td>
                      <td>
                        <span className="badge badge-primary">{b.slot?.slotNumber || 'Slot'}</span>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {b.startTime ? new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{b.totalAmount}</td>
                      <td>
                        <span className={`badge badge-${b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed' ? 'available' : b.bookingStatus === 'Cancelled' ? 'occupied' : 'maintenance'}`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedTicket(b)}
                          className="btn btn-secondary btn-sm"
                          title="View Digital Pass"
                        >
                          <QrCode size={13} /> Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Vehicle & Profile Quick Settings */}
        <div className="dashboard-right card">
          <div className="card-top-title">
            <h3>Vehicle Profile</h3>
            <span className="badge badge-primary">{user?.vehicleType || 'Vehicle'}</span>
          </div>

          {saveSuccess && (
            <div className="alert alert-success" style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>
              <CheckCircle size={15} /> Vehicle profile saved!
            </div>
          )}

          <form onSubmit={handleUpdateVehicle}>
            <div className="form-group">
              <label className="form-label">Saved License Plate</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MH-12-DE-1423"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Category</label>
              <select
                className="form-control"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="Four-Wheeler">Four-Wheeler (Standard Bay)</option>
                <option value="Two-Wheeler">Two-Wheeler (Bike Bay)</option>
                <option value="EV">Electric Vehicle (Charging Bay)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Save Vehicle Details
            </button>
          </form>

          <div className="quick-help-box">
            <h4>💡 Campus Parking Rule</h4>
            <p>Always align your vehicle inside the yellow bay lines. Scan your QR pass at the entrance boom barrier.</p>
          </div>
        </div>
      </div>

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <TicketModal booking={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      <style>{`
        .active-pass-hero {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(6, 182, 212, 0.1));
          border: 1px solid rgba(99, 102, 241, 0.4);
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .active-pass-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .active-indicator-box {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .active-pulse-circle {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseGlow 1.5s infinite;
        }
        .active-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #34d399;
          letter-spacing: 0.06em;
          display: block;
        }
        .active-ticket-num {
          font-family: var(--font-mono);
          font-size: 1.4rem;
          color: #fff;
          font-weight: 800;
        }
        .active-pass-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1.25rem;
        }
        .active-detail-col .label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
        }
        .active-detail-col .val {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }
        .active-detail-col .val.highlight {
          color: #38bdf8;
          font-family: var(--font-mono);
        }
        .active-detail-col .val.mono {
          font-family: var(--font-mono);
        }
        .dashboard-grid-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.75rem;
        }
        .card-top-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .card-top-title h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .sub-link {
          font-size: 0.825rem;
          color: #818cf8;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .empty-state-box {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
        }
        .quick-help-box {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .quick-help-box h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 0.35rem;
        }
        .quick-help-box p {
          font-size: 0.775rem;
          color: var(--text-dim);
          line-height: 1.45;
        }
        @media (max-width: 960px) {
          .dashboard-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
