import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, slotAPI } from '../services/api';
import TicketModal from '../components/TicketModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  ShieldCheck, 
  Car, 
  Layers, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  PlusCircle,
  BookOpen,
  QrCode,
  Users,
  Search,
  Filter,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  XCircle,
  Power,
  Zap,
  X,
  MapPin,
  Check,
  BookmarkCheck
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  // Navigation tabs: 'overview', 'slots', 'bookings'
  const [activeTab, setActiveTab] = useState('overview');

  // Chart view toggle: 'daily' vs 'monthly'
  const [chartView, setChartView] = useState('daily');

  // Global Dashboard Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Slots Management State
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotFloorFilter, setSlotFloorFilter] = useState('All');
  const [slotTypeFilter, setSlotTypeFilter] = useState('All');

  // Slot Modal State (Add / Edit)
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotFormData, setSlotFormData] = useState({
    slotNumber: '',
    floor: 'Ground Floor',
    vehicleType: 'Four-Wheeler',
    hourlyRate: 50,
    status: 'available',
    isCovered: true,
    hasCharging: false,
  });
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  // Bookings Management State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingSlotFilter, setBookingSlotFilter] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  // Notifications & Ticket Modal
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // 1. Fetch Real Admin Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError('');
      const res = await bookingAPI.getAdminStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.warn('API error in admin stats:', err.message);
      setStatsError(err.message || 'Unable to connect to Admin Stats API.');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Slots for Inventory Management
  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);
      const res = await slotAPI.getAllSlots({
        floor: slotFloorFilter,
        vehicleType: slotTypeFilter,
      });
      if (res.success && res.data) {
        setSlots(res.data);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.warn('Slot API error:', err.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  // 3. Fetch Bookings for Management
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingAPI.getAllBookings({
        status: bookingStatusFilter,
        date: bookingDateFilter,
        slotNumber: bookingSlotFilter,
        search: bookingSearch,
      });
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('Booking API error:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'slots') {
      fetchSlots();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab, slotFloorFilter, slotTypeFilter, bookingStatusFilter]);

  // Slot Management Handlers
  const handleOpenAddSlot = () => {
    setEditingSlot(null);
    setSlotFormData({
      slotNumber: '',
      floor: 'Ground Floor',
      vehicleType: 'Four-Wheeler',
      hourlyRate: 50,
      status: 'available',
      isCovered: true,
      hasCharging: false,
    });
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotFormData({
      slotNumber: slot.slotNumber,
      floor: slot.floor,
      vehicleType: slot.vehicleType,
      hourlyRate: slot.hourlyRate,
      status: slot.status,
      isCovered: slot.isCovered,
      hasCharging: slot.hasCharging,
    });
    setIsSlotModalOpen(true);
  };

  const handleSlotFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSlotFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      setSlotSubmitting(true);
      if (editingSlot) {
        const res = await slotAPI.updateSlot(editingSlot._id, slotFormData);
        if (res.success) {
          showNotification('success', `Parking slot ${slotFormData.slotNumber} updated successfully!`);
          setIsSlotModalOpen(false);
          fetchSlots();
          fetchStats();
        }
      } else {
        const res = await slotAPI.createSlot(slotFormData);
        if (res.success) {
          showNotification('success', `New bay ${slotFormData.slotNumber} created successfully!`);
          setIsSlotModalOpen(false);
          fetchSlots();
          fetchStats();
        }
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to save parking slot.');
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleToggleDisableSlot = async (slot) => {
    const newStatus = slot.status === 'maintenance' || slot.status === 'disabled' ? 'available' : 'maintenance';
    try {
      const res = await slotAPI.updateSlot(slot._id, { status: newStatus });
      if (res.success) {
        showNotification(
          'success',
          `Bay ${slot.slotNumber} has been ${newStatus === 'available' ? 'Enabled (Available)' : 'Disabled (Maintenance)'}.`
        );
        fetchSlots();
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Cannot change slot status.');
    }
  };

  const handleDeleteSlot = async (id, slotNum) => {
    if (!window.confirm(`Are you sure you want to permanently delete bay ${slotNum}?`)) {
      return;
    }
    try {
      const res = await slotAPI.deleteSlot(id);
      if (res.success) {
        showNotification('success', `Parking slot ${slotNum} deleted.`);
        fetchSlots();
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete parking slot.');
    }
  };

  // Booking Lifecycle Handlers (Confirm, Check In, Check Out, Cancel)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingBookingId(bookingId);
      const res = await bookingAPI.updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        showNotification('success', `Booking marked as ${newStatus}.`);
        if (activeTab === 'bookings') fetchBookings();
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update booking status.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleBookingSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleResetBookingFilters = () => {
    setBookingStatusFilter('All');
    setBookingDateFilter('');
    setBookingSlotFilter('');
    setBookingSearch('');
    setTimeout(() => {
      bookingAPI.getAllBookings().then((res) => {
        if (res.success) setBookings(res.data);
      });
    }, 50);
  };

  // ===================== CHARTS CONFIGURATION =====================
  // 1. Doughnut: Real-time Slot Occupancy Breakdown
  const doughnutData = {
    labels: ['Available Bays', 'Occupied Bays', 'Reserved / Maintenance'],
    datasets: [
      {
        data: [
          stats?.availableSlots || 0,
          stats?.occupiedSlots || 0,
          (stats?.maintenanceSlots || 0) + (stats?.reservedSlots || 0),
        ],
        backgroundColor: [
          '#10b981', // Green for available
          '#ef4444', // Red for occupied
          '#f59e0b', // Orange for reserved / maintenance
        ],
        borderColor: '#111827',
        borderWidth: 3,
      },
    ],
  };

  // 2. Bar: Capacity vs Demand by Vehicle Type
  const capacityBarData = {
    labels: ['Four-Wheeler', 'Two-Wheeler', 'EV Fast Charger'],
    datasets: [
      {
        label: 'Configured Inventory',
        data: [
          stats?.slotsByType?.find((s) => s._id === 'Four-Wheeler')?.count || 0,
          stats?.slotsByType?.find((s) => s._id === 'Two-Wheeler')?.count || 0,
          stats?.slotsByType?.find((s) => s._id === 'EV')?.count || 0,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Active Demand',
        data: [
          stats?.bookingsByType?.find((b) => b._id === 'Four-Wheeler')?.count || 0,
          stats?.bookingsByType?.find((b) => b._id === 'Two-Wheeler')?.count || 0,
          stats?.bookingsByType?.find((b) => b._id === 'EV')?.count || 0,
        ],
        backgroundColor: 'rgba(6, 182, 212, 0.85)',
        borderRadius: 6,
      },
    ],
  };

  // 3. Dynamic Daily vs Monthly Statistics Charts (Real Backend API Data)
  const isDaily = chartView === 'daily';
  const timeLabels = isDaily
    ? (stats?.dailyStats || []).map((d) => d.label)
    : (stats?.monthlyStats || []).map((m) => m.label);

  const bookingsCountData = isDaily
    ? (stats?.dailyStats || []).map((d) => d.bookings)
    : (stats?.monthlyStats || []).map((m) => m.bookings);

  const revenueData = isDaily
    ? (stats?.dailyStats || []).map((d) => d.revenue)
    : (stats?.monthlyStats || []).map((m) => m.revenue);

  const trendsChartData = {
    labels: timeLabels.length > 0 ? timeLabels : isDaily ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        type: 'bar',
        label: `${isDaily ? 'Daily' : 'Monthly'} Bookings Count`,
        data: bookingsCountData.length > 0 ? bookingsCountData : [0, 0, 0],
        backgroundColor: isDaily ? 'rgba(6, 182, 212, 0.85)' : 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: `${isDaily ? 'Daily' : 'Monthly'} Revenue (₹)`,
        data: revenueData.length > 0 ? revenueData : [0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointRadius: 5,
        yAxisID: 'y1',
      },
    ],
  };

  const trendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Bookings Volume', color: '#64748b' },
        ticks: { color: '#64748b', precision: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Revenue (₹)', color: '#10b981' },
        ticks: { color: '#10b981' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b', precision: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
  };

  return (
    <div className="admin-dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={28} className="text-purple" />
            Central Facility Command
          </h1>
          <p className="page-subtitle">
            Real-time reservation metrics, live spatial occupancy, revenue tracking, and gate access control (software-managed, sensor-free).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => { fetchStats(); if (activeTab === 'slots') fetchSlots(); if (activeTab === 'bookings') fetchBookings(); }} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button onClick={handleOpenAddSlot} className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Add New Bay
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification.message && (
        <div className={`alert alert-${notification.type === 'error' ? 'error' : 'success'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {statsError && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{statsError}</span>
          </div>
          <button onClick={fetchStats} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="nav-tabs-bar card">
        <button
          onClick={() => setActiveTab('overview')}
          className={`nav-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <TrendingUp size={16} />
          <span>Command Overview & Charts</span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`nav-tab-item ${activeTab === 'slots' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Parking Slots Inventory</span>
          <span className="tab-counter-badge">{stats?.totalSlots || slots.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`nav-tab-item ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          <span>Live Bookings & Gate Control</span>
          <span className="tab-counter-badge">{stats?.totalBookings || bookings.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & ANALYTICS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metric Stats Cards */}
          <div className="stats-grid">
            {/* 1. Total Parking Slots */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Total Parking Slots</span>
                <div className="stat-value">{stats?.totalSlots || 0}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Across all facility decks
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.12)' }}>
                <Layers size={26} />
              </div>
            </div>

            {/* 2. Currently Available Slots (Green) */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Currently Available Slots</span>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  {stats?.availableSlots || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <span className="status-indicator-dot available"></span> Free for Reservation
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
                <CheckCircle size={26} />
              </div>
            </div>

            {/* 3. Currently Occupied Slots (Red) */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Currently Occupied Slots</span>
                <div className="stat-value" style={{ color: '#ef4444' }}>
                  {stats?.occupiedSlots || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <span className="status-indicator-dot occupied"></span> Active in-session parking
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
                <Car size={26} />
              </div>
            </div>

            {/* 4. Active Reservations */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Active Reservations</span>
                <div className="stat-value" style={{ color: '#06b6d4' }}>
                  {stats?.activeReservations || stats?.activeBookings || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Confirmed & Active Passes
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
                <BookmarkCheck size={26} />
              </div>
            </div>

            {/* 5. Total Bookings */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Total Bookings</span>
                <div className="stat-value" style={{ color: '#a78bfa' }}>
                  {stats?.totalBookings || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Lifetime system records
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.12)' }}>
                <Calendar size={26} />
              </div>
            </div>

            {/* 6. Total Revenue */}
            <div className="stat-card">
              <div>
                <span className="stat-label">Total Revenue</span>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  ₹{stats?.totalRevenue || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  {stats?.occupancyRate || 0}% Facility Occupancy Rate
                </span>
              </div>
              <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
                <DollarSign size={26} />
              </div>
            </div>
          </div>

          {/* Daily & Monthly Trends Chart */}
          <div className="chart-card card" style={{ marginTop: '0.5rem' }}>
            <div className="chart-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3>{isDaily ? 'Daily' : 'Monthly'} Booking Statistics & Revenue Trends</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Computed dynamically from active database transactions (software-tracked, sensor-free).
                </p>
              </div>

              {/* Toggle Daily vs Monthly */}
              <div className="chart-toggle-group">
                <button
                  type="button"
                  onClick={() => setChartView('daily')}
                  className={`toggle-btn ${chartView === 'daily' ? 'active' : ''}`}
                >
                  Daily Trend (Last 7 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('monthly')}
                  className={`toggle-btn ${chartView === 'monthly' ? 'active' : ''}`}
                >
                  Monthly Trend (Last 6 Months)
                </button>
              </div>
            </div>

            <div className="chart-canvas-wrapper" style={{ height: '280px' }}>
              <Bar data={trendsChartData} options={trendsChartOptions} />
            </div>
          </div>

          {/* Side-by-Side Analytics Breakdown */}
          <div className="charts-grid">
            {/* Doughnut: Occupancy Breakdown */}
            <div className="chart-card card">
              <div className="chart-card-header">
                <h3>Live Slot Occupancy Breakdown</h3>
                <span className="badge badge-primary">Database Status</span>
              </div>
              <div className="chart-canvas-wrapper">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="chart-footer-note">
                <span style={{ color: '#10b981' }}>● Green = Available ({stats?.availableSlots || 0})</span> |{' '}
                <span style={{ color: '#ef4444' }}>● Red = Occupied ({stats?.occupiedSlots || 0})</span> |{' '}
                <span style={{ color: '#f59e0b' }}>● Orange = Reserved/Maint</span>
              </div>
            </div>

            {/* Bar: Vehicle Type Distribution */}
            <div className="chart-card card">
              <div className="chart-card-header">
                <h3>Vehicle Category Distribution</h3>
                <span className="badge badge-primary">Inventory vs Active</span>
              </div>
              <div className="chart-canvas-wrapper">
                <Bar data={capacityBarData} options={chartOptions} />
              </div>
              <div className="chart-footer-note">
                Configured inventory and active demand across Four-Wheeler, Two-Wheeler, and EV Fast Charger bays.
              </div>
            </div>
          </div>

          {/* Recent Bookings Feed */}
          <div className="recent-activity-card card">
            <div className="recent-header">
              <div>
                <h3>Recent Booking History & Activity</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Live gate passes, customer details, and vehicle check-in log.
                </p>
              </div>
              <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary btn-sm">
                View All Bookings <ArrowUpRight size={14} />
              </button>
            </div>

            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer / Driver</th>
                      <th>Bay & Area</th>
                      <th>Vehicle Plate</th>
                      <th>Schedule / Times</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Gate Lifecycle Actions</th>
                      <th>Pass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                          {b.ticketId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.user?.name || 'Registered Driver'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                          {b.user?.phone && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.user.phone}</div>
                          )}
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
                            <span style={{ color: '#fff', fontWeight: 600 }}>{b.durationHours} hrs</span>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>
                              {b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>₹{b.totalAmount}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                            {b.paymentStatus}
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
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Confirmed')}
                                  className="btn btn-success btn-sm"
                                  title="Confirm booking"
                                >
                                  <CheckCircle size={13} /> Confirm
                                </button>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Cancelled')}
                                  className="btn btn-danger btn-sm"
                                  title="Cancel booking"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              </>
                            )}

                            {b.bookingStatus === 'Confirmed' && (
                              <>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Active')}
                                  className="btn btn-primary btn-sm"
                                  title="Mark vehicle as Checked In at gate"
                                >
                                  <LogIn size={13} /> Check In
                                </button>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Cancelled')}
                                  className="btn btn-danger btn-sm"
                                  title="Cancel booking"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              </>
                            )}

                            {b.bookingStatus === 'Active' && (
                              <button
                                disabled={updatingBookingId === b._id}
                                onClick={() => handleUpdateBookingStatus(b._id, 'Completed')}
                                className="btn btn-success btn-sm"
                                title="Mark vehicle as Checked Out & release bay"
                              >
                                <LogOut size={13} /> Check Out
                              </button>
                            )}

                            {b.bookingStatus === 'Completed' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Archived (Completed)</span>
                            )}

                            {b.bookingStatus === 'Cancelled' && (
                              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Refunded (Cancelled)</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedTicket(b)}
                            className="btn btn-secondary btn-sm"
                            title="Inspect Pass"
                          >
                            <QrCode size={13} /> Pass
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No recent facility bookings recorded yet.</p>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PARKING SLOTS INVENTORY MANAGEMENT                                 */}
      {/* ========================================================================= */}
      {activeTab === 'slots' && (
        <div className="slots-tab-container">
          <div className="filter-card card">
            <div className="filters-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="filter-item">
                  <label className="filter-lbl">Filter Deck / Area:</label>
                  <select
                    className="form-control"
                    value={slotFloorFilter}
                    onChange={(e) => setSlotFloorFilter(e.target.value)}
                  >
                    <option value="All">All Decks</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Basement 1">Basement 1</option>
                    <option value="Basement 2">Basement 2</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label className="filter-lbl">Vehicle Category:</label>
                  <select
                    className="form-control"
                    value={slotTypeFilter}
                    onChange={(e) => setSlotTypeFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={fetchSlots} className="btn btn-secondary btn-sm">
                  <RefreshCw size={13} /> Refresh
                </button>
                <button onClick={handleOpenAddSlot} className="btn btn-primary btn-sm">
                  <PlusCircle size={14} /> Add New Slot
                </button>
              </div>
            </div>
          </div>

          <div className="table-card card" style={{ marginTop: '1rem' }}>
            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading parking bay inventory...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="empty-state-box">
                <Layers size={36} className="text-dim" />
                <h3>No Parking Bays Found</h3>
                <p>No parking slots match the selected deck and vehicle category filters.</p>
                <button onClick={handleOpenAddSlot} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  Add First Slot
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bay Code</th>
                      <th>Parking Area (Floor)</th>
                      <th>Supported Vehicle</th>
                      <th>Hourly Price</th>
                      <th>Amenities</th>
                      <th>Current Status</th>
                      <th>Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={s._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
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
                            {s.hasCharging && <span className="mini-tag tag-ev">⚡ EV Charger</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${s.status}`}>{s.status}</span>
                        </td>
                        <td>
                          <div className="table-action-btns">
                            <button
                              onClick={() => handleToggleDisableSlot(s)}
                              className={`btn btn-sm ${s.status === 'maintenance' || s.status === 'disabled' ? 'btn-success' : 'btn-secondary'}`}
                              title={s.status === 'maintenance' || s.status === 'disabled' ? 'Enable Bay' : 'Disable Bay for Maintenance'}
                            >
                              <Power size={13} />
                              {s.status === 'maintenance' || s.status === 'disabled' ? 'Enable' : 'Disable'}
                            </button>

                            <button
                              onClick={() => handleOpenEditSlot(s)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Slot Configuration"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL BOOKINGS & GATE ACCESS CONTROL                                 */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="bookings-tab-container">
          <div className="filter-card card">
            <form onSubmit={handleBookingSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Search Text */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="filter-lbl">Search Plate / Driver / Ticket:</label>
                  <div className="input-with-icon">
                    <Search size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-control with-icon"
                      placeholder="e.g. MH-12, Rahul, PK-849..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filter by Slot Number */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="filter-lbl">Filter by Slot Code:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. G-01, F1-04"
                    value={bookingSlotFilter}
                    onChange={(e) => setBookingSlotFilter(e.target.value)}
                  />
                </div>

                {/* Filter by Date */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="filter-lbl">Filter by Booking Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Pills & Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['All', 'Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingStatusFilter(st)}
                      className={`tab-btn ${bookingStatusFilter === st ? 'active' : ''}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={handleResetBookingFilters} className="btn btn-secondary btn-sm">
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Search size={13} /> Search Bookings
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="table-card card" style={{ marginTop: '1rem' }}>
            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Retrieving reservations from database...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state-box">
                <BookOpen size={36} className="text-dim" />
                <h3>No Matching Bookings Found</h3>
                <p>No customer reservations matched the date, slot number, or status criteria.</p>
                <button onClick={handleResetBookingFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer Details</th>
                      <th>Bay & Area</th>
                      <th>Vehicle Plate</th>
                      <th>Scheduled Window</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Lifecycle Actions</th>
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
                          <div style={{ fontWeight: 600 }}>{b.user?.name || 'Registered Driver'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                          {b.user?.phone && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.user.phone}</div>
                          )}
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
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Confirmed')}
                                  className="btn btn-success btn-sm"
                                  title="Confirm booking"
                                >
                                  <CheckCircle size={13} /> Confirm
                                </button>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Cancelled')}
                                  className="btn btn-danger btn-sm"
                                  title="Cancel booking"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              </>
                            )}

                            {b.bookingStatus === 'Confirmed' && (
                              <>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Active')}
                                  className="btn btn-primary btn-sm"
                                  title="Mark vehicle as Checked In at gate"
                                >
                                  <LogIn size={13} /> Check In
                                </button>
                                <button
                                  disabled={updatingBookingId === b._id}
                                  onClick={() => handleUpdateBookingStatus(b._id, 'Cancelled')}
                                  className="btn btn-danger btn-sm"
                                  title="Cancel booking & refund"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              </>
                            )}

                            {b.bookingStatus === 'Active' && (
                              <button
                                disabled={updatingBookingId === b._id}
                                onClick={() => handleUpdateBookingStatus(b._id, 'Completed')}
                                className="btn btn-success btn-sm"
                                title="Mark vehicle as Checked Out & release bay"
                              >
                                <LogOut size={13} /> Check Out
                              </button>
                            )}

                            {b.bookingStatus === 'Completed' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Archived (Completed)</span>
                            )}

                            {b.bookingStatus === 'Cancelled' && (
                              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Refunded (Cancelled)</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PARKING SLOT                                            */}
      {/* ========================================================================= */}
      {isSlotModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSlotModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {editingSlot ? `Edit Parking Bay: ${editingSlot.slotNumber}` : 'Add New Parking Bay'}
              </h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="modal-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Slot Number / Code (e.g. G-08, F1-04, EV-02)</label>
                <input
                  type="text"
                  name="slotNumber"
                  required
                  className="form-control"
                  placeholder="e.g. G-08"
                  value={slotFormData.slotNumber}
                  onChange={handleSlotFormChange}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Parking Area / Deck</label>
                  <select
                    name="floor"
                    className="form-control"
                    value={slotFormData.floor}
                    onChange={handleSlotFormChange}
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Basement 1">Basement 1</option>
                    <option value="Basement 2">Basement 2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Supported Vehicle Category</label>
                  <select
                    name="vehicleType"
                    className="form-control"
                    value={slotFormData.vehicleType}
                    onChange={handleSlotFormChange}
                  >
                    <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
                    <option value="Two-Wheeler">Two-Wheeler (Motorbike)</option>
                    <option value="EV">Electric Vehicle (EV Bay)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Hourly Price (₹)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    required
                    min="10"
                    className="form-control"
                    value={slotFormData.hourlyRate}
                    onChange={handleSlotFormChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={slotFormData.status}
                    onChange={handleSlotFormChange}
                  >
                    <option value="available">Available (Green)</option>
                    <option value="maintenance">Disabled / Maintenance (Gray)</option>
                  </select>
                </div>
              </div>

              <div className="checkboxes-row" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <label className="checkbox-lbl" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    name="isCovered"
                    checked={slotFormData.isCovered}
                    onChange={handleSlotFormChange}
                  />
                  <span>Weather-Covered Bay</span>
                </label>

                <label className="checkbox-lbl" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    name="hasCharging"
                    checked={slotFormData.hasCharging}
                    onChange={handleSlotFormChange}
                  />
                  <span>Fast EV Charging Port Included</span>
                </label>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsSlotModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={slotSubmitting} className="btn btn-primary">
                  {slotSubmitting ? 'Saving Bay...' : editingSlot ? 'Update Bay' : 'Create Bay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pass Modal */}
      {selectedTicket && (
        <TicketModal 
          booking={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}

      <style>{`
        .admin-dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .text-purple { color: #a78bfa; }
        .nav-tabs-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.6rem 0.85rem;
          flex-wrap: wrap;
        }
        .nav-tab-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-tab-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }
        .nav-tab-item.active {
          color: #fff;
          background: var(--primary);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }
        .tab-counter-badge {
          background: rgba(255, 255, 255, 0.15);
          font-size: 0.725rem;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          font-weight: 700;
        }
        .chart-toggle-group {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 0.25rem;
        }
        .toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.775rem;
          font-weight: 600;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: #4f46e5;
          color: #fff;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .chart-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .chart-card-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }
        .chart-canvas-wrapper {
          position: relative;
          height: 250px;
          width: 100%;
        }
        .chart-footer-note {
          font-size: 0.75rem;
          color: var(--text-dim);
          text-align: center;
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }
        .recent-activity-card {
          padding: 1.5rem;
          margin-top: 0.5rem;
        }
        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .recent-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .status-action-group {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .table-action-btns {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .tab-btn {
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          background: var(--bg-card-subtle);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: #4f46e5;
          color: #fff;
          border-color: #6366f1;
        }
        @media (max-width: 960px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
