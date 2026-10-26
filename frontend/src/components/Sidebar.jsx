import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  BookOpen,
  ShieldCheck,
  Layers,
  LogOut,
  Car,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile}></div>
      )}

      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-box">
            <div className="brand-icon-mini">
              <Car size={20} />
            </div>
            {!isCollapsed && (
              <div className="brand-text-block">
                <span className="brand-name">SmartPark</span>
                <span className="brand-edition">Cloud Console</span>
              </div>
            )}
          </div>
          {/* Collapse Toggle for Desktop */}
          <button 
            type="button" 
            onClick={onToggleCollapse} 
            className="sidebar-collapse-btn"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Live System Status Pill */}
        {!isCollapsed && (
          <div className="sidebar-status-banner">
            <div className="status-pulse-dot"></div>
            <div className="status-text-meta">
              <span className="status-label">Live Gateway</span>
              <span className="status-desc">Cloud Sync Active</span>
            </div>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="sidebar-nav-scroll">
          {/* General & Driver Navigation */}
          <div className="nav-group">
            {!isCollapsed && <span className="nav-group-title">Navigation</span>}
            
            {isAuthenticated && !isAdmin && (
              <NavLink 
                to="/user-dashboard" 
                onClick={navItemClick}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                title="User Dashboard"
              >
                <LayoutDashboard size={19} className="nav-icon" />
                {!isCollapsed && <span className="nav-text">Dashboard</span>}
              </NavLink>
            )}

            <NavLink 
              to="/slots" 
              onClick={navItemClick}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              title="Parking Slot Availability"
            >
              <MapPin size={19} className="nav-icon" />
              {!isCollapsed && <span className="nav-text">Slot Availability</span>}
            </NavLink>

            <NavLink 
              to="/book" 
              onClick={navItemClick}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              title="Book Parking Bay"
            >
              <CalendarCheck size={19} className="nav-icon" />
              {!isCollapsed && (
                <span className="nav-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Book Parking</span>
                  <span className="nav-chip">Pass</span>
                </span>
              )}
            </NavLink>

            {isAuthenticated && !isAdmin && (
              <NavLink 
                to="/my-bookings" 
                onClick={navItemClick}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                title="My Reservations"
              >
                <BookOpen size={19} className="nav-icon" />
                {!isCollapsed && <span className="nav-text">My Bookings</span>}
              </NavLink>
            )}
          </div>

          {/* Admin Management Section */}
          {isAuthenticated && isAdmin && (
            <div className="nav-group">
              {!isCollapsed && <span className="nav-group-title admin-title">Admin Management</span>}
              
              <NavLink 
                to="/admin-dashboard" 
                onClick={navItemClick}
                className={({ isActive }) => `sidebar-nav-item admin-item ${isActive ? 'active' : ''}`}
                title="Admin Overview & Analytics"
              >
                <ShieldCheck size={19} className="nav-icon admin-icon" />
                {!isCollapsed && <span className="nav-text">Admin Dashboard</span>}
              </NavLink>

              <NavLink 
                to="/manage-slots" 
                onClick={navItemClick}
                className={({ isActive }) => `sidebar-nav-item admin-item ${isActive ? 'active' : ''}`}
                title="Manage Parking Slots"
              >
                <Layers size={19} className="nav-icon admin-icon" />
                {!isCollapsed && <span className="nav-text">Manage Slots</span>}
              </NavLink>

              <NavLink 
                to="/manage-bookings" 
                onClick={navItemClick}
                className={({ isActive }) => `sidebar-nav-item admin-item ${isActive ? 'active' : ''}`}
                title="Manage Facility Bookings"
              >
                <BookOpen size={19} className="nav-icon admin-icon" />
                {!isCollapsed && <span className="nav-text">Manage Bookings</span>}
              </NavLink>
            </div>
          )}

          {/* Quick Info Box for Users */}
          {!isCollapsed && (
            <div className="sidebar-quick-box">
              <div className="quick-box-header">
                <Zap size={14} className="text-cyan" />
                <span>Smart Bay Color Key</span>
              </div>
              <div className="color-key-list">
                <div className="color-key-item">
                  <span className="key-dot available"></span>
                  <span>Green: Available</span>
                </div>
                <div className="color-key-item">
                  <span className="key-dot reserved"></span>
                  <span>Orange: Reserved</span>
                </div>
                <div className="color-key-item">
                  <span className="key-dot occupied"></span>
                  <span>Red: Occupied</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="sidebar-footer">
          {isAuthenticated ? (
            <div className="sidebar-user-card">
              <div className="sidebar-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="sidebar-user-details">
                  <span className="user-name-truncate">{user?.name}</span>
                  <span className={`user-role-tag ${isAdmin ? 'admin-tag' : 'user-tag'}`}>
                    {isAdmin ? 'ADMINISTRATOR' : 'DRIVER / USER'}
                  </span>
                </div>
              )}
              <button 
                type="button" 
                onClick={handleLogout} 
                className="sidebar-logout-btn" 
                title="Sign Out"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            !isCollapsed && (
              <div className="sidebar-guest-cta">
                <p>Welcome, Guest!</p>
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Sign In
                </button>
              </div>
            )
          )}
        </div>
      </aside>

      <style>{`
        .sidebar-mobile-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 998;
          display: none;
        }

        .app-sidebar {
          width: 260px;
          min-width: 260px;
          background: #0f1627;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 990;
          position: sticky;
          top: 65px;
          height: calc(100vh - 65px);
          overflow-x: hidden;
        }

        .app-sidebar.collapsed {
          width: 72px;
          min-width: 72px;
        }

        .sidebar-header {
          padding: 1.1rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          gap: 0.5rem;
        }

        .sidebar-brand-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          overflow: hidden;
        }

        .brand-icon-mini {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
        }

        .brand-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
          white-space: nowrap;
        }

        .brand-name {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .brand-edition {
          font-size: 0.65rem;
          color: #06b6d4;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .sidebar-collapse-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }

        .sidebar-collapse-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-status-banner {
          margin: 0.85rem 0.85rem 0.25rem 0.85rem;
          padding: 0.55rem 0.75rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .status-pulse-dot {
          width: 8px;
          height: 8px;
          min-width: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseGlow 2s infinite ease-in-out;
        }

        .status-text-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .status-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #34d399;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .sidebar-nav-scroll {
          flex: 1;
          padding: 0.85rem 0.65rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .nav-group-title {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
          padding: 0.25rem 0.65rem;
        }

        .nav-group-title.admin-title {
          color: #a78bfa;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sidebar-nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(2px);
        }

        .sidebar-nav-item.active {
          color: #ffffff;
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.08));
          border-left: 3px solid var(--primary-light);
          font-weight: 600;
        }

        .sidebar-nav-item.admin-item.active {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.08));
          border-left-color: #8b5cf6;
          color: #e0e7ff;
        }

        .nav-icon {
          min-width: 19px;
        }

        .admin-icon {
          color: #c4b5fd;
        }

        .nav-chip {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          background: rgba(99, 102, 241, 0.3);
          color: #c7d2fe;
          border-radius: 4px;
        }

        .sidebar-quick-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          font-size: 0.75rem;
          margin-top: auto;
        }

        .quick-box-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .color-key-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .color-key-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-muted);
        }

        .key-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .key-dot.available {
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .key-dot.reserved {
          background: #f59e0b;
          box-shadow: 0 0 6px #f59e0b;
        }

        .key-dot.occupied {
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }

        .sidebar-footer {
          padding: 0.85rem;
          border-top: 1px solid var(--border-color);
          background: rgba(11, 15, 25, 0.4);
        }

        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.4rem 0.5rem;
          border-radius: var(--radius-md);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .sidebar-avatar {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #8b5cf6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .sidebar-user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
        }

        .user-name-truncate {
          font-size: 0.825rem;
          font-weight: 600;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-tag {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .user-role-tag.admin-tag {
          color: #a78bfa;
        }

        .user-role-tag.user-tag {
          color: #34d399;
        }

        .sidebar-logout-btn {
          color: #94a3b8;
          padding: 0.35rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .sidebar-logout-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }

        .sidebar-guest-cta {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
        }

        @media (max-width: 1024px) {
          .app-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            height: 100vh;
            left: -280px;
            width: 260px !important;
            transition: left 0.3s ease;
            box-shadow: var(--shadow-lg);
            z-index: 999;
          }

          .app-sidebar.mobile-open {
            left: 0;
          }

          .sidebar-mobile-backdrop {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
