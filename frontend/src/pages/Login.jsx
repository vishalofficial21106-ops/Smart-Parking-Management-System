import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Shield, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.returnTo || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email, password);
      if (res.success) {
        if (returnTo) {
          navigate(returnTo);
        } else if (res.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or start the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click test fill for college presentation
  const fillDemoAdmin = () => {
    setEmail('admin@parking.com');
    setPassword('admin123');
    setError('');
  };

  const fillDemoUser = () => {
    setEmail('user@parking.com');
    setPassword('user123');
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <LogIn size={24} />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Log in to manage your bookings and access smart parking bays.</p>
        </div>

        {/* 1-Click College Demo Credentials */}
        <div className="demo-fill-box">
          <span className="demo-fill-title">Quick Demo Logins (Click to autofill):</span>
          <div className="demo-btn-row">
            <button type="button" onClick={fillDemoUser} className="btn-demo">
              <User size={13} /> Demo User
            </button>
            <button type="button" onClick={fillDemoAdmin} className="btn-demo admin">
              <Shield size={13} /> Demo Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                className="form-control with-icon"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                className="form-control with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
        }
        .auth-card {
          max-width: 440px;
          width: 100%;
          background: #111827;
          border: 1px solid var(--border-color);
          padding: 2.25rem;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 1.75rem;
        }
        .auth-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.35rem;
        }
        .auth-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .demo-fill-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .demo-fill-title {
          font-size: 0.75rem;
          color: var(--text-dim);
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .demo-btn-row {
          display: flex;
          gap: 0.5rem;
        }
        .btn-demo {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.35rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .btn-demo:hover {
          background: rgba(16, 185, 129, 0.25);
        }
        .btn-demo.admin {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
          color: #a78bfa;
        }
        .btn-demo.admin:hover {
          background: rgba(139, 92, 246, 0.25);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-dim);
        }
        .form-control.with-icon {
          padding-left: 2.5rem;
        }
        .auth-footer {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .auth-link {
          color: #818cf8;
          font-weight: 600;
        }
        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
