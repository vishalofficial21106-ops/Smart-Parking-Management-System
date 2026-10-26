import React, { useState, useEffect } from 'react';
import { slotAPI } from '../services/api';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  X, 
  Car,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';

const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    slotNumber: '',
    floor: 'Ground Floor',
    vehicleType: 'Four-Wheeler',
    hourlyRate: 50,
    status: 'available',
    isCovered: true,
    hasCharging: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await slotAPI.getAllSlots({
        floor: selectedFloor,
        vehicleType: selectedType,
      });
      if (res.success && res.data) {
        setSlots(res.data);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.warn('Slot API error:', err.message);
      setError(err.message || 'Unable to connect to Parking Slot REST API (http://localhost:5000/api/slots). Ensure backend is running.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedFloor, selectedType]);

  const handleOpenAddModal = () => {
    setEditingSlot(null);
    setFormData({
      slotNumber: '',
      floor: 'Ground Floor',
      vehicleType: 'Four-Wheeler',
      hourlyRate: 50,
      status: 'available',
      isCovered: true,
      hasCharging: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      slotNumber: slot.slotNumber,
      floor: slot.floor,
      vehicleType: slot.vehicleType,
      hourlyRate: slot.hourlyRate,
      status: slot.status,
      isCovered: slot.isCovered,
      hasCharging: slot.hasCharging,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmitSlot = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (editingSlot) {
        // Update slot
        const res = await slotAPI.updateSlot(editingSlot._id, formData);
        if (res.success) {
          setSuccessMsg(`Slot ${formData.slotNumber} updated successfully!`);
          setIsModalOpen(false);
          fetchSlots();
        }
      } else {
        // Create slot
        const res = await slotAPI.createSlot(formData);
        if (res.success) {
          setSuccessMsg(`New slot ${formData.slotNumber} added successfully!`);
          setIsModalOpen(false);
          fetchSlots();
        }
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save parking slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id, slotNumber) => {
    if (!window.confirm(`Are you sure you want to delete parking bay ${slotNumber}?`)) {
      return;
    }

    try {
      const res = await slotAPI.deleteSlot(id);
      if (res.success) {
        setSuccessMsg(`Slot ${slotNumber} deleted.`);
        fetchSlots();
      }
    } catch (err) {
      setError(err.message || 'Cannot delete slot');
    }
  };

  const handleToggleStatus = async (slot) => {
    const newStatus = slot.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      const res = await slotAPI.updateSlot(slot._id, { status: newStatus });
      if (res.success) {
        setSuccessMsg(`Slot ${slot.slotNumber} status changed to ${newStatus}.`);
        fetchSlots();
      }
    } catch (err) {
      setError(err.message || 'Error updating status');
    }
  };

  return (
    <div className="manage-slots-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={28} className="text-primary-light" />
            Manage Parking Slots
          </h1>
          <p className="page-subtitle">Configure multi-floor slot inventory, vehicle categories, charging amenities, and hourly pricing.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchSlots} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <Plus size={15} /> Add New Slot
          </button>
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

      {/* Filter Bar */}
      <div className="filter-card card">
        <div className="filters-row">
          <div className="filter-item">
            <label className="filter-lbl">Floor Level:</label>
            <select
              className="form-control"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              <option value="All">All Floors</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="Floor 1">Floor 1</option>
              <option value="Floor 2">Floor 2</option>
              <option value="Basement 1">Basement 1</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-lbl">Vehicle Category:</label>
            <select
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Vehicle Types</option>
              <option value="Four-Wheeler">Four-Wheeler</option>
              <option value="Two-Wheeler">Two-Wheeler</option>
              <option value="EV">Electric Vehicle (EV)</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <span className="badge badge-primary">{slots.length} Total Slots Configured</span>
          </div>
        </div>
      </div>

      {/* Slots Table */}
      <div className="table-card card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading parking slot inventory...</p>
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No parking bays found matching the selected filters.</p>
            <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Create First Slot
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Bay Code</th>
                  <th>Floor</th>
                  <th>Supported Vehicle</th>
                  <th>Hourly Rate</th>
                  <th>Amenities</th>
                  <th>Live Status</th>
                  <th>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                      {s.slotNumber}
                    </td>
                    <td>{s.floor}</td>
                    <td>
                      <span className="badge badge-secondary">{s.vehicleType}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{s.hourlyRate}/hr</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {s.isCovered && <span className="mini-tag">Covered</span>}
                        {s.hasCharging && <span className="mini-tag tag-ev">⚡ EV</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`btn btn-sm ${s.status === 'maintenance' ? 'btn-success' : 'btn-secondary'}`}
                          title={s.status === 'maintenance' ? 'Enable Bay' : 'Disable Bay'}
                        >
                          <Wrench size={13} />
                          {s.status === 'maintenance' ? 'Enable' : 'Disable'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Bay"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(s._id, s.slotNumber)}
                          className="btn btn-danger btn-sm"
                          title="Delete Bay"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Slot Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {editingSlot ? `Edit Parking Slot: ${editingSlot.slotNumber}` : 'Add New Parking Bay'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSlot} style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Slot Identifier (e.g. G-07, F1-09, EV-05)</label>
                <input
                  type="text"
                  name="slotNumber"
                  required
                  className="form-control"
                  placeholder="e.g. G-08"
                  value={formData.slotNumber}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Floor Deck</label>
                  <select
                    name="floor"
                    className="form-control"
                    value={formData.floor}
                    onChange={handleFormChange}
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Basement 1">Basement 1</option>
                    <option value="Basement 2">Basement 2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Category</label>
                  <select
                    name="vehicleType"
                    className="form-control"
                    value={formData.vehicleType}
                    onChange={handleFormChange}
                  >
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    required
                    min="10"
                    className="form-control"
                    value={formData.hourlyRate}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="available">Available (Green)</option>
                    <option value="reserved">Reserved (Orange)</option>
                    <option value="occupied">Occupied (Red)</option>
                    <option value="maintenance">Disabled / Maintenance (Gray)</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="checkboxes-row">
                <label className="checkbox-lbl">
                  <input
                    type="checkbox"
                    name="isCovered"
                    checked={formData.isCovered}
                    onChange={handleFormChange}
                  />
                  <span>Weather-Covered Bay</span>
                </label>

                <label className="checkbox-lbl">
                  <input
                    type="checkbox"
                    name="hasCharging"
                    checked={formData.hasCharging}
                    onChange={handleFormChange}
                  />
                  <span>Fast EV Charging Port</span>
                </label>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : editingSlot ? 'Update Bay' : 'Create Bay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .manage-slots-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .filter-card {
          padding: 1rem 1.25rem;
        }
        .filters-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .table-card {
          padding: 1.25rem;
        }
        .table-action-btns {
          display: flex;
          gap: 0.4rem;
        }
        .modal-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }
        .modal-close {
          color: var(--text-muted);
        }
        .checkboxes-row {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .checkbox-lbl {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          cursor: pointer;
        }
        .checkbox-lbl input {
          accent-color: #6366f1;
        }
      `}</style>
    </div>
  );
};

export default ManageSlots;
