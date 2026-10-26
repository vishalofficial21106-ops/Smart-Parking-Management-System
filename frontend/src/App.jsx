import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public & User Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SlotAvailability from './pages/SlotAvailability';
import BookParking from './pages/BookParking';
import MyBookings from './pages/MyBookings';
import UserDashboard from './pages/UserDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageSlots from './pages/ManageSlots';
import ManageBookings from './pages/ManageBookings';

const AppLayout = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Portal routes where sidebar navigation is active
  const portalRoutes = [
    '/slots',
    '/book',
    '/my-bookings',
    '/user-dashboard',
    '/admin-dashboard',
    '/manage-slots',
    '/manage-bookings',
  ];

  const isPortalRoute = portalRoutes.some((route) => location.pathname.startsWith(route));

  return (
    <div className="app-container">
      <Navbar 
        showSidebarToggle={isPortalRoute}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onToggleMobileSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
      />

      {isPortalRoute ? (
        <div className="portal-layout">
          <Sidebar 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobileOpen={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />
          <div className="portal-main-area">
            <main className="main-content">
              <AppRoutes />
            </main>
          </div>
        </div>
      ) : (
        <main className="main-content">
          <AppRoutes />
        </main>
      )}

      <Footer />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/slots" element={<SlotAvailability />} />

      {/* Protected User Routes */}
      <Route element={<ProtectedRoute adminOnly={false} />}>
        <Route path="/book" element={<BookParking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute adminOnly={true} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manage-slots" element={<ManageSlots />} />
        <Route path="/manage-bookings" element={<ManageBookings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
