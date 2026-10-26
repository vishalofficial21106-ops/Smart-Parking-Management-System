import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import TicketModal from '../components/TicketModal';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Car,
  DollarSign
} from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingAPI.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('Error fetching bookings:', err.message);
      setError(err.message || 'Unable to connect to Bookings REST API (http://localhost:5000/api/bookings/my-bookings). Please ensure backend is running.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this parking reservation? The bay will be released and fee refunded.')) {
      return;
    }

    try {
      setCancellingId(id);
      const res = await bookingAPI.cancelBooking(id);
      if (res.success) {
        setSuccessMsg('Reservation cancelled successfully. Refund initiated.');
        setTimeout(() => setSuccessMsg(''), 4000);
        // Refresh bookings
        fetchBookings();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter bookings according to activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending';
    if (activeTab === 'Completed') return b.bookingStatus === 'Completed';
    if (activeTab === 'Cancelled') return b.bookingStatus === 'Cancelled';
    return true;
  });

  return (
    <div className="my-bookings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BookOpen size={28} className="text-primary-light" />
            My Parking Reservations
          </h1>
          <p className="page-subtitle">Access your contactless digital gate passes, verify active parking, or manage refunds.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchBookings} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/book" className="btn btn-primary btn-sm">
            <Calendar size={14} /> New Booking
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bookings-tabs-card card">
        <div className="tabs-row">
          {['All', 'Active', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab} ({
                tab === 'All' 
                  ? bookings.length 
                  : tab === 'Active' 
                    ? bookings.filter(b => b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed').length
                    : bookings.filter(b => b.bookingStatus === tab).length
              })
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your parking passes...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <BookOpen size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.75rem' }} />
          <h3>No {activeTab !== 'All' ? activeTab : ''} Reservations Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Looking for a parking bay? Browse our live availability map and book in seconds.
          </p>
          <Link to="/book" className="btn btn-primary btn-sm" style={{ marginTop: '1.25rem' }}>
            Book Parking Bay
          </Link>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((b) => (
            <div key={b._id} className="booking-card card">
              {/* Top row */}
              <div className="booking-card-top">
                <div>
                  <span className="b-ticket-label">TICKET NUMBER</span>
                  <span className="b-ticket-id">{b.ticketId}</span>
                </div>
                <span className={`badge badge-${b.bookingStatus === 'Active' || b.bookingStatus === 'Confirmed' ? 'available' : b.bookingStatus === 'Cancelled' ? 'occupied' : 'maintenance'}`}>
                  {b.bookingStatus}
                </span>
              </div>

              {/* Bay & Vehicle Info */}
              <div className="booking-bay-row">
                <div className="bay-badge-box">
                  <span className="bay-code">{b.slot?.slotNumber || 'Bay'}</span>
                  <span className="bay-floor">{b.slot?.floor || 'Floor Level'}</span>
                </div>
                <div className="veh-info">
                  <span className="veh-plate">{b.vehicleNumber}</span>
                  <span className="veh-type">{b.vehicleType}</span>
                </div>
              </div>

              {/* Timing details */}
              <div className="booking-meta-box">
                <div className="meta-row">
                  <span className="meta-lbl"><Calendar size={13} /> Check-in:</span>
                  <span className="meta-val">
                    {b.startTime ? new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl"><Clock size={13} /> Valid Till:</span>
                  <span className="meta-val">
                    {b.endTime ? new Date(b.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl">Duration & Fee:</span>
                  <span className="meta-val" style={{ color: '#10b981', fontWeight: 700 }}>
                    {b.durationHours} hrs (₹{b.totalAmount})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="booking-card-actions">
                <button
                  onClick={() => setSelectedTicket(b)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <QrCode size={14} /> View QR Pass
                </button>

                {(b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending') && (
                  <button
                    onClick={() => handleCancelBooking(b._id)}
                    disabled={cancellingId === b._id}
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <TicketModal booking={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      <style>{`
        .my-bookings-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .bookings-tabs-card {
          padding: 0.75rem 1rem;
        }
        .tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .booking-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.25rem;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .booking-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .b-ticket-label {
          font-size: 0.65rem;
          color: var(--text-dim);
          font-weight: 700;
          display: block;
        }
        .b-ticket-id {
          font-family: var(--font-mono);
          font-size: 1.15rem;
          font-weight: 700;
          color: #38bdf8;
        }
        .booking-bay-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }
        .bay-badge-box {
          background: #1e1b4b;
          border: 1px solid #4338ca;
          border-radius: var(--radius-sm);
          padding: 0.4rem 0.75rem;
          text-align: center;
        }
        .bay-code {
          font-family: var(--font-mono);
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          display: block;
        }
        .bay-floor {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .veh-info {
          display: flex;
          flex-direction: column;
        }
        .veh-plate {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
        }
        .veh-type {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .booking-meta-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.825rem;
          margin-bottom: 1.25rem;
          color: var(--text-muted);
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
        }
        .meta-lbl {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .meta-val {
          color: #fff;
          font-weight: 500;
        }
        .booking-card-actions {
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default MyBookings;
