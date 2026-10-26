import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  MapPin, 
  CalendarCheck, 
  LayoutDashboard, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X,
  User,
  PanelLeft
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, showSidebarToggle, onToggleMobileSidebar }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Left Side: Brand Logo and Optional Sidebar Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {showSidebarToggle && (
            <button 
              type="button" 
              onClick={onToggleSidebar} 
              className="nav-sidebar-toggle-btn"
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Navigation Sidebar"
            >
              <PanelLeft size={18} />
            </button>
          )}

          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="brand-icon-box">
              <Car size={22} className="brand-car-icon" />
              <span className="brand-dot"></span>
            </div>
            <div className="brand-text-group">
              <span className="brand-title">SmartPark<span className="brand-highlight">Cloud</span></span>
              <span className="brand-badge">College Project</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/slots" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <MapPin size={16} />
            Slot Availability
          </NavLink>
          <NavLink to="/book" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CalendarCheck size={16} />
            Book Parking
          </NavLink>

          {isAuthenticated && !isAdmin && (
            <>
              <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={16} />
                My Bookings
              </NavLink>
              <NavLink to="/user-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={16} />
                Admin Overview
              </NavLink>
              <NavLink to="/manage-slots" className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}>
                <Layers size={16} />
                Manage Slots
              </NavLink>
              <NavLink to="/manage-bookings" className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={16} />
                Manage Bookings
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Action / Auth Buttons */}
        <div className="navbar-auth-actions">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-info-pill">
                <div className="user-avatar-circle">
                  <User size={15} />
                </div>
                <div className="user-text-meta">
                  <span className="user-display-name">{user?.name}</span>
                  <span className={`user-role-badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
                    {isAdmin ? 'ADMIN' : 'USER'}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="guest-actions">
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => {
              if (showSidebarToggle && onToggleMobileSidebar) {
                onToggleMobileSidebar();
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <NavLink to="/" onClick={closeMenu} className="mobile-nav-link">Home</NavLink>
          <NavLink to="/slots" onClick={closeMenu} className="mobile-nav-link">Slot Availability</NavLink>
          <NavLink to="/book" onClick={closeMenu} className="mobile-nav-link">Book Parking</NavLink>
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink to="/my-bookings" onClick={closeMenu} className="mobile-nav-link">My Bookings</NavLink>
              <NavLink to="/user-dashboard" onClick={closeMenu} className="mobile-nav-link">User Dashboard</NavLink>
            </>
          )}
          {isAuthenticated && isAdmin && (
            <>
              <NavLink to="/admin-dashboard" onClick={closeMenu} className="mobile-nav-link">Admin Dashboard</NavLink>
              <NavLink to="/manage-slots" onClick={closeMenu} className="mobile-nav-link">Manage Parking Slots</NavLink>
              <NavLink to="/manage-bookings" onClick={closeMenu} className="mobile-nav-link">Manage Bookings</NavLink>
            </>
          )}
          {!isAuthenticated && (
            <div className="mobile-auth-btns">
              <Link to="/login" onClick={closeMenu} className="btn btn-secondary">Login</Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary">Register</Link>
            </div>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-danger" style={{ marginTop: '1rem', width: '100%' }}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}

      {/* Navbar specific CSS */}
      <style>{`
        .navbar-header {
          position: sticky;
          top: 0;
          z-index: 999;
          background: rgba(11, 15, 25, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
        }
        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0.85rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .nav-sidebar-toggle-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-sidebar-toggle-btn:hover {
          color: #fff;
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.35);
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .brand-icon-box {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }
        .brand-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid var(--bg-dark);
        }
        .brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .brand-highlight {
          color: #06b6d4;
        }
        .brand-badge {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-link.active {
          color: #ffffff;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .nav-link.admin-link.active {
          background: rgba(139, 92, 246, 0.18);
          border-color: rgba(139, 92, 246, 0.35);
          color: #c4b5fd;
        }
        .navbar-auth-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .guest-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-info-pill {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.35rem 0.75rem 0.35rem 0.4rem;
          background: var(--bg-card-subtle);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
        }
        .user-avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #312e81;
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-text-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .user-display-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f1f5f9;
        }
        .user-role-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .badge-admin {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.4);
        }
        .badge-user {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .btn-logout:hover {
          background: #ef4444;
          color: #ffffff;
        }
        .mobile-toggle-btn {
          display: none;
          color: var(--text-main);
          padding: 0.25rem;
        }
        .mobile-drawer {
          display: none;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.25rem 1.5rem;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
        }
        .mobile-nav-link {
          padding: 0.65rem 0.75rem;
          font-size: 0.95rem;
          color: var(--text-muted);
          border-radius: var(--radius-md);
        }
        .mobile-nav-link:hover {
          background: var(--bg-card-hover);
          color: #fff;
        }
        .mobile-auth-btns {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .mobile-auth-btns a {
          flex: 1;
        }
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }
          .mobile-toggle-btn {
            display: block;
          }
          .mobile-drawer {
            display: flex;
          }
          .logout-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
