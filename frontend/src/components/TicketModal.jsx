import React from 'react';
import { X, Printer, CheckCircle, Car, Calendar, Clock, DollarSign, QrCode } from 'lucide-react';

const TicketModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const slotData = booking.slot || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog ticket-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ticket-header">
          <div className="ticket-title-row">
            <span className="ticket-app-name">SmartPark Cloud</span>
            <span className="badge badge-available">
              <CheckCircle size={12} /> {booking.bookingStatus || 'Confirmed'}
            </span>
          </div>
          <button onClick={onClose} className="ticket-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Printable Pass Container */}
        <div className="ticket-body" id="printable-ticket">
          <div className="ticket-pass-card">
            {/* Top Pass Bar */}
            <div className="pass-top">
              <div>
                <span className="pass-sub-label">PASS / TICKET NUMBER</span>
                <h3 className="pass-ticket-id">{booking.ticketId || 'PK-DEMO'}</h3>
              </div>
              <div className="pass-slot-big">
                <span className="pass-sub-label">ASSIGNED BAY</span>
                <span className="pass-slot-number">{slotData.slotNumber || 'SLOT'}</span>
              </div>
            </div>

            {/* Simulated QR Code Box */}
            <div className="qr-container">
              <div className="qr-box">
                <QrCode size={110} color="#0f172a" />
              </div>
              <div className="qr-info">
                <span className="qr-title">Contactless Entry Pass</span>
                <p className="qr-instruction">Scan at barrier gate scanner upon arrival and departure.</p>
                <span className="qr-code-text">{booking.ticketId}</span>
              </div>
            </div>

            {/* Grid of Details */}
            <div className="pass-details-grid">
              <div className="pass-detail-item">
                <span className="detail-label">Vehicle Number</span>
                <span className="detail-value mono">{booking.vehicleNumber}</span>
              </div>
              <div className="pass-detail-item">
                <span className="detail-label">Vehicle Type</span>
                <span className="detail-value">{booking.vehicleType}</span>
              </div>
              <div className="pass-detail-item">
                <span className="detail-label">Floor Location</span>
                <span className="detail-value">{slotData.floor || 'Level 1'}</span>
              </div>
              <div className="pass-detail-item">
                <span className="detail-label">Duration</span>
                <span className="detail-value">{booking.durationHours} Hours</span>
              </div>
              <div className="pass-detail-item">
                <span className="detail-label">Valid From</span>
                <span className="detail-value">
                  {booking.startTime ? new Date(booking.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Now'}
                </span>
              </div>
              <div className="pass-detail-item">
                <span className="detail-label">Valid Until</span>
                <span className="detail-value">
                  {booking.endTime ? new Date(booking.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Later'}
                </span>
              </div>
            </div>

            {/* Payment Summary Banner */}
            <div className="pass-payment-summary">
              <div>
                <span className="payment-label">Amount Paid ({booking.paymentMethod || 'UPI'})</span>
                <span className="payment-status">Status: {booking.paymentStatus || 'Paid'}</span>
              </div>
              <div className="payment-amount">
                ₹{booking.totalAmount}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="ticket-actions">
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} /> Print / Save Pass
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>

      <style>{`
        .ticket-dialog {
          max-width: 480px;
          background: #0f172a;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 1.5rem;
        }
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .ticket-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ticket-app-name {
          font-weight: 700;
          color: #fff;
          font-size: 1.1rem;
        }
        .ticket-close-btn {
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .ticket-close-btn:hover {
          color: #fff;
        }
        .ticket-pass-card {
          background: #1e293b;
          border-radius: var(--radius-md);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          padding: 1.25rem;
        }
        .pass-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .pass-sub-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
        }
        .pass-ticket-id {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          color: #38bdf8;
          font-weight: 800;
        }
        .pass-slot-big {
          text-align: right;
        }
        .pass-slot-number {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 800;
          color: #10b981;
          display: block;
        }
        .qr-container {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
          color: #0f172a;
        }
        .qr-box {
          background: #fff;
          padding: 0.25rem;
          border-radius: 6px;
        }
        .qr-title {
          font-weight: 700;
          font-size: 0.95rem;
          display: block;
        }
        .qr-instruction {
          font-size: 0.75rem;
          color: #475569;
          margin: 0.25rem 0;
          line-height: 1.3;
        }
        .qr-code-text {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563eb;
        }
        .pass-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.85rem;
          border-radius: var(--radius-sm);
        }
        .detail-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          display: block;
          text-transform: uppercase;
        }
        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #f1f5f9;
        }
        .detail-value.mono {
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }
        .pass-payment-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
        }
        .payment-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          display: block;
        }
        .payment-status {
          font-size: 0.7rem;
          color: #34d399;
        }
        .payment-amount {
          font-size: 1.35rem;
          font-weight: 800;
          color: #10b981;
        }
        .ticket-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket, #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TicketModal;
