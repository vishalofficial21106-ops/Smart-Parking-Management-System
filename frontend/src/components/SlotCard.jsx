import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bike, Zap, CheckCircle, AlertCircle, Wrench, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SlotCard = ({ slot, onSelectForBooking }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Two-Wheeler':
        return <Bike size={18} />;
      case 'EV':
        return <Zap size={18} style={{ color: '#06b6d4' }} />;
      default:
        return <Car size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="badge badge-available">
            <CheckCircle size={12} /> Available
          </span>
        );
      case 'reserved':
        return (
          <span className="badge badge-reserved">
            <Clock size={12} /> Reserved
          </span>
        );
      case 'occupied':
        return (
          <span className="badge badge-occupied">
            <AlertCircle size={12} /> Occupied
          </span>
        );
      case 'maintenance':
        return (
          <span className="badge badge-maintenance">
            <Wrench size={12} /> Maintenance
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const handleBookClick = () => {
    if (onSelectForBooking) {
      onSelectForBooking(slot);
    } else {
      if (!isAuthenticated) {
        navigate('/login', { state: { returnTo: `/book?slotId=${slot._id}` } });
      } else {
        navigate(`/book?slotId=${slot._id}`);
      }
    }
  };

  return (
    <div className={`slot-card ${slot.status}`}>
      {/* Top bar: Slot code with glowing dot & status */}
      <div className="slot-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`status-indicator-dot ${slot.status}`}></span>
          <div>
            <div className="slot-code">{slot.slotNumber}</div>
            <div className="slot-floor">{slot.floor}</div>
          </div>
        </div>
        <div>{getStatusBadge(slot.status)}</div>
      </div>

      {/* Middle Specs */}
      <div className="slot-meta">
        <div className="slot-meta-item">
          {getVehicleIcon(slot.vehicleType)}
          <span>{slot.vehicleType}</span>
        </div>
        <div className="slot-meta-item">
          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>₹{slot.hourlyRate}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/ hour</span>
        </div>

        <div className="slot-tags-row">
          {slot.isCovered && (
            <span className="mini-tag">Covered Bay</span>
          )}
          {slot.hasCharging && (
            <span className="mini-tag tag-ev">⚡ EV Fast Charger</span>
          )}
          {slot.hasUpcomingReservation && slot.status === 'available' && (
            <span className="mini-tag" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              🕒 Reserved Later ({new Date(slot.nextReservationStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="slot-footer">
        {slot.status === 'available' ? (
          <button 
            onClick={handleBookClick}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', gap: '0.4rem' }}
          >
            <span>Book This Bay</span>
            <ArrowRight size={14} />
          </button>
        ) : slot.status === 'reserved' ? (
          <button 
            disabled 
            className="btn btn-sm" 
            style={{ 
              width: '100%', 
              background: 'rgba(245, 158, 11, 0.15)', 
              color: '#f59e0b', 
              border: '1px solid rgba(245, 158, 11, 0.35)', 
              cursor: 'not-allowed',
              fontWeight: 600 
            }}
          >
            <Clock size={13} style={{ marginRight: 4 }} /> Currently Reserved
          </button>
        ) : slot.status === 'occupied' ? (
          <button 
            disabled 
            className="btn btn-sm" 
            style={{ 
              width: '100%', 
              background: 'rgba(239, 68, 68, 0.12)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.35)', 
              cursor: 'not-allowed',
              fontWeight: 600 
            }}
          >
            <AlertCircle size={13} style={{ marginRight: 4 }} /> Occupied Bay
          </button>
        ) : (
          <button 
            disabled 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', opacity: 0.55, cursor: 'not-allowed' }}
          >
            <Wrench size={13} style={{ marginRight: 4 }} /> Out of Service
          </button>
        )}
      </div>

      <style>{`
        .slot-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.4rem;
        }
        .mini-tag {
          font-size: 0.7rem;
          padding: 0.18rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          color: var(--text-muted);
        }
        .mini-tag.tag-ev {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.35);
        }
        .slot-footer {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
};

export default SlotCard;
