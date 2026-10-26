import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../services/api';
import TicketModal from '../components/TicketModal';
import { 
  BookOpen, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  QrCode, 
  Car, 
  Clock, 
  User, 
  ArrowRight,
  LogOut,
  LogIn,
  XCircle
} from 'lucide-react';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingAPI.getAllBookings({
        status: selectedStatus,
        search: searchQuery,
      });

      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('Booking API error:', err.message);
      setError(err.message || 'Unable to connect to Bookings REST API (http://localhost:5000/api/bookings). Ensure backend server is running.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      const res = await bookingAPI.updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setSuccessMsg(`Booking status changed to ${newStatus}.`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchBookings();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.bookingStatus === 'Confirmed').length;
  const activeCount = bookings.filter((b) => b.bookingStatus === 'Active').length;
  const completedCount = bookings.filter((b) => b.bookingStatus === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.bookingStatus === 'Cancelled').length;

  return (
    <div className="manage-bookings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BookOpen size={28} className="text-primary-light" />
            Manage Facility Reservations
          </h1>
          <p className="page-subtitle">Track gate entries, manage active parking sessions, issue check-outs, and review payments.</p>
        </div>
        <button onClick={fetchBookings} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchBookings} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Quick Summary Metrics */}
      <div className="booking-metrics-row">
        <div className="metric-pill">
          <span className="metric-label">Total Shown:</span>
          <span className="metric-value">{totalCount}</span>
        </div>
        <div className="metric-pill available">
          <span className="metric-dot available"></span>
          <span className="metric-label">Confirmed:</span>
          <span className="metric-value">{confirmedCount}</span>
        </div>
        <div className="metric-pill active">
          <span className="metric-dot active"></span>
          <span className="metric-label">Active Checked-In:</span>
          <span className="metric-value">{activeCount}</span>
        </div>
        <div className="metric-pill completed">
          <span className="metric-dot completed"></span>
          <span className="metric-label">Completed:</span>
          <span className="metric-value">{completedCount}</span>
        </div>
        <div className="metric-pill cancelled">
          <span className="metric-dot cancelled"></span>
          <span className="metric-label">Cancelled:</span>
          <span className="metric-value">{cancelledCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-card card">
        <div className="filter-search-row">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                className="form-control with-icon"
                placeholder="Search plate (e.g. MH-12) or ticket ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          <div className="status-filter-pills">
            {['All', 'Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`tab-btn ${selectedStatus === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-card card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Retrieving live facility bookings from backend...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <BookOpen size={28} />
            </div>
            <h3 className="empty-state-title">No Reservation Records Found</h3>
            <p className="empty-state-desc">
              {error ? 'Unable to connect to backend server. Make sure API is running.' : 'No customer reservations matched the selected status or search filter.'}
            </p>
            <button 
              onClick={() => { setSelectedStatus('All'); setSearchQuery(''); fetchBookings(); }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Driver / Customer</th>
                  <th>Bay & Floor</th>
                  <th>Vehicle Details</th>
                  <th>Duration / Schedule</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Lifecycle Action</th>
                  <th>Pass</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                      {b.ticketId}
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block' }}>{b.user?.name || 'Registered Driver'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{b.user?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{b.slot?.slotNumber || 'Bay'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.2rem' }}>
                        {b.slot?.floor}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block' }}>{b.vehicleNumber}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.vehicleType}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{b.durationHours} Hours</span>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>
                          {b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>₹{b.totalAmount}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                        {b.paymentStatus} ({b.paymentMethod || 'UPI'})
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${b.bookingStatus === 'Active' ? 'available' : b.bookingStatus === 'Confirmed' ? 'reserved' : b.bookingStatus === 'Pending' ? 'maintenance' : b.bookingStatus === 'Cancelled' ? 'occupied' : 'maintenance'}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td>
                      <div className="status-action-group">
                        {b.bookingStatus === 'Pending' && (
                          <>
                            <button
                              disabled={updatingId === b._id}
                              onClick={() => handleStatusChange(b._id, 'Confirmed')}
                              className="btn btn-success btn-sm"
                              title="Confirm booking"
                            >
                              <CheckCircle size={13} /> Confirm
                            </button>
                            <button
                              disabled={updatingId === b._id}
                              onClick={() => handleStatusChange(b._id, 'Cancelled')}
                              className="btn btn-danger btn-sm"
                              title="Reject & cancel"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {b.bookingStatus === 'Confirmed' && (
                          <button
                            disabled={updatingId === b._id}
                            onClick={() => handleStatusChange(b._id, 'Active')}
                            className="btn btn-primary btn-sm"
                            title="Check in vehicle at gate"
                          >
                            <LogIn size={13} /> Check In
                          </button>
                        )}
                        {b.bookingStatus === 'Active' && (
                          <button
                            disabled={updatingId === b._id}
                            onClick={() => handleStatusChange(b._id, 'Completed')}
                            className="btn btn-success btn-sm"
                            title="Check out vehicle & release bay"
                          >
                            <LogOut size={13} /> Check Out
                          </button>
                        )}
                        {(b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Active') && (
                          <button
                            disabled={updatingId === b._id}
                            onClick={() => handleStatusChange(b._id, 'Cancelled')}
                            className="btn btn-danger btn-sm"
                            title="Cancel booking & release bay"
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                        {b.bookingStatus === 'Completed' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Archived</span>
                        )}
                        {b.bookingStatus === 'Cancelled' && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Refunded</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedTicket(b)}
                        className="btn btn-secondary btn-sm"
                        title="View Full Pass"
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

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <TicketModal 
          booking={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}

      <style>{`
        .manage-bookings-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .booking-metrics-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .metric-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          font-size: 0.825rem;
        }
        .metric-label {
          color: var(--text-muted);
        }
        .metric-value {
          font-weight: 700;
          color: #fff;
        }
        .metric-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .metric-dot.available { background: #10b981; }
        .metric-dot.active { background: #06b6d4; }
        .metric-dot.completed { background: #64748b; }
        .metric-dot.cancelled { background: #ef4444; }

        .filter-search-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .search-form {
          display: flex;
          gap: 0.5rem;
          flex: 1;
          max-width: 450px;
        }
        .status-filter-pills {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 600;
          background: var(--bg-card-subtle);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.25);
        }
        .tab-btn.active {
          background: #4f46e5;
          color: #fff;
          border-color: #6366f1;
        }
        .status-action-group {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        @media (max-width: 768px) {
          .filter-search-row {
            flex-direction: column;
            align-items: stretch;
          }
          .search-form {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageBookings;
