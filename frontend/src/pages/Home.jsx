import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Clock, 
  QrCode, 
  ArrowRight, 
  CheckCircle, 
  BarChart3, 
  Sparkles,
  Layers,
  ChevronRight,
  CalendarCheck
} from 'lucide-react';
import { slotAPI } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState({
    total: 20,
    available: 14,
    reserved: 2,
    occupied: 4,
    evCount: 4,
  });

  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const res = await slotAPI.getAllSlots();
        if (res.success && res.data) {
          const total = res.data.length;
          const available = res.data.filter((s) => s.status === 'available').length;
          const reserved = res.data.filter((s) => s.status === 'reserved').length;
          const occupied = res.data.filter((s) => s.status === 'occupied').length;
          const evCount = res.data.filter((s) => s.vehicleType === 'EV').length;
          setStats({ total, available, reserved, occupied, evCount });
        }
      } catch (err) {
        // Fallback to sample stats
      }
    };
    fetchLiveCount();
  }, []);

  return (
    <div className="home-page">
      {/* College Project Top Banner */}
      <div className="project-highlight-bar">
        <span className="sparkle-icon"><Sparkles size={14} /></span>
        <span>College Capstone Project: Full-Stack MERN Cloud Parking Architecture with JWT & Real-Time Tracking</span>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge badge-primary hero-badge">
            <span className="live-dot"></span> Next-Gen Smart Mobility
          </div>
          <h1 className="hero-title">
            Cloud-Based <span className="gradient-text">Smart Parking</span> Management System
          </h1>
          <p className="hero-description">
            Eliminate parking hassles with real-time multi-floor slot tracking, instant reservation, contactless QR gate passes, and cloud-synchronized analytics.
          </p>

          <div className="hero-cta-group">
            <Link to="/book" className="btn btn-primary btn-lg">
              <CalendarCheck size={18} />
              Book Parking
            </Link>
            <Link to="/slots" className="btn btn-secondary btn-lg">
              <MapPin size={18} />
              Check Live Slots
            </Link>
          </div>

          {/* Quick Demo Credentials Pill for Examiners */}
          <div className="demo-credentials-banner">
            <span className="demo-tag">DEMO LOGINS:</span>
            <span>Admin: <code>admin@parking.com</code> / <code>admin123</code></span>
            <span className="divider">|</span>
            <span>User: <code>user@parking.com</code> / <code>user123</code></span>
          </div>
        </div>

        {/* Hero Interactive Live Visual Card */}
        <div className="hero-card-container">
          <div className="live-overview-card card">
            <div className="overview-header">
              <div>
                <span className="overview-subtitle">LIVE CAMPUS OCCUPANCY</span>
                <h3 className="overview-title">Central Smart Garage</h3>
              </div>
              <span className="badge badge-available">
                <CheckCircle size={12} /> Cloud Synced
              </span>
            </div>

            <div className="quick-stats-row">
              <div className="quick-stat-box">
                <span className="quick-stat-val text-emerald">{stats.available}</span>
                <span className="quick-stat-lbl">Available</span>
              </div>
              <div className="quick-stat-box">
                <span className="quick-stat-val text-amber">{stats.reserved || 2}</span>
                <span className="quick-stat-lbl">Reserved</span>
              </div>
              <div className="quick-stat-box">
                <span className="quick-stat-val text-rose">{stats.occupied}</span>
                <span className="quick-stat-lbl">Occupied</span>
              </div>
              <div className="quick-stat-box">
                <span className="quick-stat-val text-white">{stats.total}</span>
                <span className="quick-stat-lbl">Total Bays</span>
              </div>
            </div>

            {/* Simulated Live Parking Bay Mini Grid with color code */}
            <div className="mini-bay-preview">
              <div className="bay-item available">G-01 (Avail)</div>
              <div className="bay-item reserved">G-02 (Rsvd)</div>
              <div className="bay-item occupied">G-03 (Occ)</div>
              <div className="bay-item available ev">⚡ EV-01</div>
              <div className="bay-item available">F1-01 (Avail)</div>
              <div className="bay-item occupied">F1-02 (Occ)</div>
            </div>

            <div className="overview-footer">
              <Link to="/slots" className="overview-link">
                View interactive multi-floor visualizer <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section">
        <h2 className="section-title">How The Cloud System Works</h2>
        <p className="section-subtitle">Simplified 3-step automated flow from reservation to contactless checkout</p>

        <div className="steps-grid">
          <div className="step-card card">
            <div className="step-number">01</div>
            <div className="step-icon-box">
              <MapPin size={24} className="text-cyan" />
            </div>
            <h3 className="step-title">Choose Floor & Slot</h3>
            <p className="step-desc">
              Browse our real-time interactive multi-level parking map. Filter by Ground Floor, Level 1, Basement, or EV charging spots.
            </p>
          </div>

          <div className="step-card card">
            <div className="step-number">02</div>
            <div className="step-icon-box">
              <QrCode size={24} className="text-primary-light" />
            </div>
            <h3 className="step-title">Instant Booking & QR Pass</h3>
            <p className="step-desc">
              Specify your arrival time and duration. Receive an encrypted digital parking pass with an automated contactless entry code.
            </p>
          </div>

          <div className="step-card card">
            <div className="step-number">03</div>
            <div className="step-icon-box">
              <CheckCircle size={24} className="text-emerald" />
            </div>
            <h3 className="step-title">Park & Smart Checkout</h3>
            <p className="step-desc">
              Glide straight to your designated bay. The system automatically handles check-in, check-out, and receipt generation.
            </p>
          </div>
        </div>
      </section>

      {/* System Key Capabilities Grid */}
      <section className="features-section">
        <h2 className="section-title">Engineered Capabilities</h2>
        <p className="section-subtitle">Designed to demonstrate complete modern web engineering patterns</p>

        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon"><Layers size={22} /></div>
            <h4>Multi-Floor Visualizer</h4>
            <p>Interactive 2D spatial slot representations showing occupancy states across distinct facility levels.</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon"><Zap size={22} /></div>
            <h4>EV Fast-Charging Bays</h4>
            <p>Specialized slots equipped with EV charging flags, tailored rates, and charging availability indicators.</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon"><ShieldCheck size={22} /></div>
            <h4>Role-Based Access (RBAC)</h4>
            <p>Dual user and administrator permission layers with secure password hashing via bcrypt and signed JWT tokens.</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon"><BarChart3 size={22} /></div>
            <h4>Admin Analytics & Charts</h4>
            <p>Real-time occupancy percentages, revenue trends, and vehicle category distribution visualized with Chart.js.</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon"><Clock size={22} /></div>
            <h4>Dynamic Duration Rates</h4>
            <p>Real-time calculation of parking fees based on vehicle type (2-Wheeler, 4-Wheeler, EV) and hours reserved.</p>
          </div>

          <div className="feature-card card">
            <div className="feature-icon"><Car size={22} /></div>
            <h4>Vehicle Management</h4>
            <p>Save vehicle license plate numbers for single-click booking and instantaneous pass issuance.</p>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner with Book Parking CTA */}
      <section className="cta-banner-card card">
        <div className="cta-banner-content">
          <span className="badge badge-primary">Campus Fast-Track</span>
          <h2 className="cta-banner-title">Ready to Park Without the Stress?</h2>
          <p className="cta-banner-desc">Reserve your spot now, enjoy dedicated EV charging if needed, and access the garage via contactless QR scan.</p>
          <div className="cta-banner-actions">
            <Link to="/book" className="btn btn-primary btn-lg">
              <CalendarCheck size={18} />
              Book Parking Now
            </Link>
            <Link to="/slots" className="btn btn-secondary btn-lg">
              <MapPin size={18} />
              Check Bay Availability
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .home-page {
          display: flex;
          flex-direction: column;
          gap: 4.5rem;
        }
        .project-highlight-bar {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-full);
          padding: 0.5rem 1.25rem;
          font-size: 0.8rem;
          color: #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: -1rem;
        }
        .sparkle-icon {
          color: #38bdf8;
          display: flex;
        }
        .hero-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3.5rem;
          align-items: center;
          padding: 1rem 0;
        }
        .hero-badge {
          margin-bottom: 1.25rem;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #10b981;
        }
        .hero-title {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }
        .gradient-text {
          background: linear-gradient(135deg, #60a5fa, #06b6d4, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 540px;
        }
        .hero-cta-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .demo-credentials-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.775rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          padding: 0.6rem 0.9rem;
          border-radius: var(--radius-md);
        }
        .demo-tag {
          font-weight: 700;
          color: #f59e0b;
        }
        .demo-credentials-banner code {
          background: rgba(0, 0, 0, 0.3);
          color: #38bdf8;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }
        .divider {
          color: rgba(255, 255, 255, 0.2);
        }
        .live-overview-card {
          background: linear-gradient(145deg, #131b2e, #0c1220);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 1.75rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }
        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .overview-subtitle {
          font-size: 0.7rem;
          font-weight: 700;
          color: #06b6d4;
          letter-spacing: 0.08em;
          display: block;
        }
        .overview-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #fff;
        }
        .quick-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .quick-stat-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          text-align: center;
        }
        .quick-stat-val {
          font-size: 1.4rem;
          font-weight: 800;
          display: block;
          line-height: 1.1;
        }
        .quick-stat-lbl {
          font-size: 0.7rem;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-top: 0.25rem;
          display: block;
        }
        .text-emerald { color: #10b981; }
        .text-amber { color: #f59e0b; }
        .text-rose { color: #ef4444; }
        .text-cyan { color: #06b6d4; }
        .text-white { color: #ffffff; }

        .mini-bay-preview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.85rem;
          border-radius: var(--radius-md);
        }
        .bay-item {
          padding: 0.6rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
          font-family: var(--font-mono);
        }
        .bay-item.available {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .bay-item.reserved {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .bay-item.occupied {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .bay-item.ev {
          border-color: rgba(6, 182, 212, 0.5);
          color: #38bdf8;
        }

        .cta-banner-card {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(6, 182, 212, 0.12));
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 3rem 2rem;
          text-align: center;
          border-radius: var(--radius-lg);
        }
        .cta-banner-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .cta-banner-title {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin: 1rem 0 0.75rem 0;
          letter-spacing: -0.02em;
        }
        .cta-banner-desc {
          color: var(--text-muted);
          font-size: 1rem;
          margin-bottom: 2rem;
        }
        .cta-banner-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .overview-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }
        .overview-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          transition: color 0.2s;
        }
        .overview-link:hover {
          color: #c7d2fe;
        }
        .section-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #fff;
          text-align: center;
          margin-bottom: 0.35rem;
        }
        .section-subtitle {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 2.5rem;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
        }
        .step-card {
          position: relative;
          padding: 2rem 1.5rem;
        }
        .step-number {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          font-family: var(--font-mono);
          font-size: 2.5rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.05);
        }
        .step-icon-box {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          background: var(--bg-card-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .step-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .step-desc {
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .feature-card {
          padding: 1.5rem;
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.12);
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .feature-card h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.4rem;
        }
        .feature-card p {
          color: var(--text-muted);
          font-size: 0.85rem;
          line-height: 1.55;
        }
        @media (max-width: 960px) {
          .hero-section {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
