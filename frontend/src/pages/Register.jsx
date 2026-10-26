import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, Car, Shield, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    vehicleNumber: '',
    vehicleType: 'Four-Wheeler',
    adminSecretKey: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.role === 'admin' && formData.adminSecretKey !== 'admin123') {
      setError('Invalid Admin Passkey. For college demo, use "admin123"');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register(formData);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs or database status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card register-card card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <User size={24} />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join SmartPark Cloud to reserve parking spots across multi-level campus decks.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Role Selector */}
          <div className="role-selector-group">
            <label className="form-label">Select Account Role:</label>
            <div className="role-options">
              <label className={`role-label ${formData.role === 'user' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                />
                <User size={16} /> User / Driver
              </label>
              <label className={`role-label ${formData.role === 'admin' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                />
                <Shield size={16} /> Administrator
              </label>
            </div>
          </div>

          {/* Admin Secret Key (if role is admin) */}
          {formData.role === 'admin' && (
            <div className="form-group admin-key-box">
              <label className="form-label" style={{ color: '#c4b5fd' }}>
                Admin Passkey (College Demo: <code>admin123</code>)
              </label>
              <input
                type="password"
                name="adminSecretKey"
                required
                className="form-control"
                placeholder="Enter admin passkey..."
                value={formData.adminSecretKey}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  required
                  className="form-control with-icon"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  required
                  className="form-control with-icon"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Password (min 6 chars)</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  required
                  className="form-control with-icon"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="form-control with-icon"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <div className="input-with-icon">
                <Car size={16} className="input-icon" />
                <input
                  type="text"
                  name="vehicleNumber"
                  className="form-control with-icon"
                  placeholder="KA-01-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Category</label>
              <select
                name="vehicleType"
                className="form-control"
                value={formData.vehicleType}
                onChange={handleChange}
              >
                <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
                <option value="Two-Wheeler">Two-Wheeler (Bike / Scooter)</option>
                <option value="EV">Electric Vehicle (EV)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
          >
            {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .register-card {
          max-width: 600px;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .role-selector-group {
          margin-bottom: 1.25rem;
        }
        .role-options {
          display: flex;
          gap: 1rem;
        }
        .role-label {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--bg-card-subtle);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .role-label input {
          display: none;
        }
        .role-label.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.15);
          color: #fff;
        }
        .admin-key-box {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 640px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
