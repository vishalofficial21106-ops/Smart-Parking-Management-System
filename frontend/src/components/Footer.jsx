import React from 'react';
import { Car, Shield, Cpu, Database, Server, Smartphone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-col">
            <div className="footer-brand">
              <Car size={20} className="brand-accent" />
              <span className="brand-title">SmartPark <span className="brand-cyan">Cloud</span></span>
            </div>
            <p className="footer-desc">
              A full-stack, cloud-native Smart Parking Management System engineered for modern campuses, commercial hubs, and urban transit facilities.
            </p>
            <div className="tech-badge-row">
              <span className="tech-pill"><Server size={12} /> Node/Express</span>
              <span className="tech-pill"><Database size={12} /> MongoDB Atlas</span>
              <span className="tech-pill"><Cpu size={12} /> React 19 + Vite</span>
              <span className="tech-pill"><Shield size={12} /> JWT Auth</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">System Modules</h4>
            <ul className="footer-links">
              <li><a href="/slots">Live Slot Visualizer</a></li>
              <li><a href="/book">Express Reservation</a></li>
              <li><a href="/my-bookings">Digital Passes & Receipts</a></li>
              <li><a href="/admin-dashboard">Analytics & Occupancy</a></li>
            </ul>
          </div>

          {/* College Project Highlights */}
          <div className="footer-col">
            <h4 className="footer-heading">Project Features</h4>
            <ul className="footer-features">
              <li>✓ Real-Time Multi-Floor Slot Mapping</li>
              <li>✓ Role-Based Access Control (Admin/User)</li>
              <li>✓ Dynamic Pricing by Vehicle & Floor</li>
              <li>✓ QR-Equipped Digital Entry Passes</li>
              <li>✓ Automated Occupancy State Transitions</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Cloud-Based Smart Parking Management System. Academic & Engineering Demonstration Project.</p>
          <div className="footer-status-pill">
            <span className="pulse-indicator"></span>
            Cloud Services Operational
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background: #080c14;
          border-top: 1px solid var(--border-color);
          padding: 3.5rem 1.5rem 1.5rem 1.5rem;
          margin-top: auto;
        }
        .footer-content {
          max-width: 1320px;
          margin: 0 auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr;
          gap: 3rem;
          margin-bottom: 2.5rem;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.75rem;
        }
        .brand-accent {
          color: #6366f1;
        }
        .brand-cyan {
          color: #06b6d4;
        }
        .footer-desc {
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.6;
          max-width: 420px;
          margin-bottom: 1.25rem;
        }
        .tech-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tech-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .footer-heading {
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 1.25rem;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .footer-links a {
          font-size: 0.875rem;
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #fff;
        }
        .footer-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .footer-bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.8rem;
          color: var(--text-dim);
          gap: 1rem;
        }
        .footer-status-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .pulse-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
