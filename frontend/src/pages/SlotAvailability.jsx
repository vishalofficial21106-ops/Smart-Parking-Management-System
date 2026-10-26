import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotAPI } from '../services/api';
import SlotCard from '../components/SlotCard';
import { 
  MapPin, 
  Layers, 
  Car, 
  Bike, 
  Zap, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Search,
  SlidersHorizontal,
  Clock,
  Wrench
} from 'lucide-react';

const SlotAvailability = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await slotAPI.getAllSlots({
        floor: selectedFloor,
        vehicleType: selectedType,
        status: selectedStatus,
      });

      if (res.success && res.data) {
        setSlots(res.data);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.warn('API error fetching slots:', err.message);
      setError(err.message || 'Unable to connect to Parking Slot REST API (http://localhost:5000/api/slots). Ensure the backend server is running.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedFloor, selectedType, selectedStatus]);

  // Client-side search filter
  const filteredSlots = slots.filter((s) => {
    if (!searchQuery) return true;
    return (
      s.slotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.floor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const availableCount = slots.filter((s) => s.status === 'available').length;
  const reservedCount = slots.filter((s) => s.status === 'reserved').length;
  const occupiedCount = slots.filter((s) => s.status === 'occupied').length;
  const maintenanceCount = slots.filter((s) => s.status === 'maintenance').length;
  const occupancyPercent = slots.length > 0 ? Math.round(((occupiedCount + reservedCount) / slots.length) * 100) : 0;

  const floorsList = ['All', 'Ground Floor', 'Floor 1', 'Floor 2', 'Basement 1'];

  return (
    <div className="slot-availability-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MapPin size={28} className="text-cyan" />
            Parking Bay Availability & Schedule
          </h1>
          <p className="page-subtitle">Live bay occupancy and scheduled reservations derived from system bookings (software-managed, sensor-free).</p>
        </div>
        <button onClick={fetchSlots} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Grid
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchSlots} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Facility Occupancy Bar */}
      <div className="occupancy-progress-card card">
        <div className="occupancy-stats-row">
          <div>
            <span className="occupancy-label">CAMPUS PARKING OCCUPANCY</span>
            <span className="occupancy-value">{occupancyPercent}% Utilized</span>
          </div>
          <div className="occupancy-counts">
            <span className="count-pill available">
              <span className="pill-dot available"></span>
              {availableCount} Available
            </span>
            <span className="count-pill reserved">
              <span className="pill-dot reserved"></span>
              {reservedCount} Reserved
            </span>
            <span className="count-pill occupied">
              <span className="pill-dot occupied"></span>
              {occupiedCount} Occupied
            </span>
            <span className="count-pill total">Total: {slots.length} Bays</span>
          </div>
        </div>
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${occupancyPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="controls-card card">
        {/* Floor Navigation Pills */}
        <div className="floor-tabs-row">
          <span className="tabs-label"><Layers size={14} /> Level / Deck:</span>
          <div className="tabs-list">
            {floorsList.map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`tab-btn ${selectedFloor === floor ? 'active' : ''}`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="filter-inputs-grid">
          <div className="filter-group">
            <label className="filter-lbl">Vehicle Category</label>
            <select
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Vehicle Types</option>
              <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
              <option value="Two-Wheeler">Two-Wheeler (Motorbike)</option>
              <option value="EV">Electric Vehicle (EV Bay)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-lbl">Slot Status</label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="available">Available Only (Green)</option>
              <option value="reserved">Reserved Only (Orange)</option>
              <option value="occupied">Occupied Only (Red)</option>
              <option value="maintenance">Maintenance (Gray)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-lbl">Search Bay Code</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                className="form-control with-icon"
                placeholder="Search bay e.g. G-01, F1-02..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="legend-row">
          <span className="legend-item"><span className="legend-dot available"></span> <strong>Available</strong> (Green)</span>
          <span className="legend-item"><span className="legend-dot reserved"></span> <strong>Reserved</strong> (Orange)</span>
          <span className="legend-item"><span className="legend-dot occupied"></span> <strong>Occupied</strong> (Red)</span>
          <span className="legend-item"><span className="legend-dot maintenance"></span> <strong>Maintenance</strong> (Gray)</span>
          <span className="legend-item"><span className="legend-dot ev"></span> ⚡ EV Charger</span>
        </div>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Querying active bookings & bay availability...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-state-icon">
            <AlertCircle size={28} />
          </div>
          <h3 className="empty-state-title">No Parking Slots Found</h3>
          <p className="empty-state-desc">
            {error ? 'Unable to load slots from API. Ensure your backend server is running.' : 'No slots matched the selected deck, vehicle category, or status filter.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => { setSelectedFloor('All'); setSelectedType('All'); setSelectedStatus('All'); setSearchQuery(''); }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
            <button onClick={fetchSlots} className="btn btn-primary btn-sm">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="slots-container">
          {filteredSlots.map((slot) => (
            <SlotCard key={slot._id} slot={slot} />
          ))}
        </div>
      )}

      <style>{`
        .slot-availability-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .occupancy-progress-card {
          padding: 1.25rem 1.5rem;
          background: #111827;
        }
        .occupancy-stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .occupancy-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
          letter-spacing: 0.06em;
          display: block;
        }
        .occupancy-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
        }
        .occupancy-counts {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .count-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
        }
        .count-pill.available { color: #10b981; }
        .count-pill.reserved { color: #f59e0b; }
        .count-pill.occupied { color: #ef4444; }
        .count-pill.total { color: var(--text-muted); }

        .pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .pill-dot.available { background: #10b981; }
        .pill-dot.reserved { background: #f59e0b; }
        .pill-dot.occupied { background: #ef4444; }

        .progress-bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }
        .controls-card {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .floor-tabs-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .tabs-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .tabs-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tab-btn {
          padding: 0.4rem 0.85rem;
          font-size: 0.825rem;
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
        .filter-inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .filter-lbl {
          display: block;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .legend-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .legend-dot.available { background: #10b981; box-shadow: 0 0 6px #10b981; }
        .legend-dot.occupied { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        .legend-dot.reserved { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
        .legend-dot.maintenance { background: #64748b; }
        .legend-dot.ev { background: #06b6d4; box-shadow: 0 0 6px #06b6d4; }
      `}</style>
    </div>
  );
};

export default SlotAvailability;
