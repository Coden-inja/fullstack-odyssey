import React, { useState } from 'react';
import {
  Monitor,
  Wifi,
  Globe,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Ticket,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Maximize2,
  Minimize2,
  User,
  Zap
} from 'lucide-react';

interface ClientWorkstationProps {
  activeTab: 'Bob' | 'Alice';
  seatSelected: string;
  status: 'idle' | 'sending' | 'confirmed' | 'error';
  lastLatencyMs: number;
  lastTicketId?: string;
  lastErrorMessage?: string;
  onSelectTab: (tab: 'Bob' | 'Alice') => void;
  onSelectSeat: (seat: string) => void;
  onSendRequest: (action: 'buy' | 'browse' | 'login') => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ClientWorkstation: React.FC<ClientWorkstationProps> = ({
  activeTab,
  seatSelected,
  status,
  lastLatencyMs,
  lastTicketId = 'TKT-9842',
  lastErrorMessage,
  onSelectTab,
  onSelectSeat,
  onSendRequest,
  isExpanded = false,
  onToggleExpand
}) => {
  const [showDevTools, setShowDevTools] = useState(true);

  const seats = [
    { id: '14A', price: 85, available: true },
    { id: '14B', price: 85, available: false },
    { id: '14C', price: 85, available: true },
    { id: '15A', price: 95, available: true },
    { id: '15B', price: 95, available: false }
  ];

  return (
    <div className={`client-workstation-container ${isExpanded ? 'expanded' : ''}`}>
      {/* 1. MONITOR FRAME & BEZEL */}
      <div className="monitor-frame">
        {/* Top Bezel with Webcam & Status Bar */}
        <div className="monitor-bezel-top">
          <div className="webcam-notch" />
          <div className="os-status-bar">
            <span className="os-brand">WORKSTATION // {activeTab.toUpperCase()}-PC</span>
            <div className="os-status-icons">
              <span className="nic-status">
                <span className="nic-led blinking" /> NIC eth0: 192.168.1.104
              </span>
              <Wifi size={12} className="wifi-icon" />
              <span className="os-time">10:00 AM</span>
              {onToggleExpand && (
                <button
                  className="expand-monitor-btn"
                  onClick={onToggleExpand}
                  title={isExpanded ? 'Dock to Side' : 'Expand Computer View'}
                >
                  {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. REALISTIC OPERATING BROWSER WINDOW */}
        <div className="browser-app-window">
          {/* Browser Navigation Toolbar */}
          <div className="browser-navbar">
            <div className="browser-window-controls">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>

            <div className="browser-nav-arrows">
              <ArrowLeft size={12} className="nav-arrow disabled" />
              <ArrowRight size={12} className="nav-arrow disabled" />
              <RefreshCw
                size={12}
                className={`nav-arrow ${status === 'sending' ? 'spinning' : ''}`}
                onClick={() => onSendRequest('browse')}
              />
            </div>

            <div className="browser-url-bar">
              <Globe size={11} className="globe-icon" />
              <span className="url-protocol">https://</span>
              <span className="url-domain">odyssey-tickets.com</span>
              <span className="url-path">/events/tokyo-dome</span>
              <span className="url-secure">
                <ShieldCheck size={11} />
              </span>
            </div>

            {/* User Tab Switcher (Bob / Alice) */}
            <div className="browser-user-tabs">
              <button
                className={`user-tab-btn ${activeTab === 'Bob' ? 'active' : ''}`}
                onClick={() => onSelectTab('Bob')}
              >
                <User size={11} />
                <span>Bob</span>
                <span className="tab-cookie-pill">Auth</span>
              </button>
              <button
                className={`user-tab-btn ${activeTab === 'Alice' ? 'active' : ''}`}
                onClick={() => onSelectTab('Alice')}
              >
                <User size={11} />
                <span>Alice</span>
                <span className="tab-cookie-pill anon">Incognito</span>
              </button>
            </div>
          </div>

          {/* Browser Content Area: Real Ticketmaster-style Website */}
          <div className="browser-viewport-content">
            {/* Event Header Banner */}
            <div className="event-banner">
              <div className="banner-tag">LIVE WORLD TOUR</div>
              <h2 className="banner-title">NEON ODYSSEY // TOKYO DOME</h2>
              <div className="banner-meta">
                <span>Friday, Oct 30 • 20:00 JST</span>
                <span>•</span>
                <span>Tokyo Dome, Arena Section</span>
              </div>
            </div>

            {/* Main Interactive Ticket Booking Form */}
            <div className="booking-form-grid">
              {/* Left Column: Interactive Seat Selector */}
              <div className="seat-selection-card">
                <div className="card-section-label">
                  <Ticket size={12} />
                  <span>SELECT YOUR ARENA SEAT</span>
                </div>
                <div className="stage-indicator">STAGE FRONT</div>
                <div className="seats-layout">
                  {seats.map((s) => (
                    <button
                      key={s.id}
                      disabled={!s.available || status === 'sending'}
                      className={`seat-btn ${seatSelected === s.id ? 'selected' : ''} ${
                        !s.available ? 'taken' : ''
                      }`}
                      onClick={() => onSelectSeat(s.id)}
                    >
                      <span className="seat-id">{s.id}</span>
                      <span className="seat-price">${s.price}</span>
                      {!s.available && <span className="sold-out">SOLD</span>}
                    </button>
                  ))}
                </div>
                <div className="seat-legend">
                  <span className="legend-item"><span className="legend-dot available" /> Available</span>
                  <span className="legend-item"><span className="legend-dot active" /> Selected</span>
                  <span className="legend-item"><span className="legend-dot sold" /> Taken</span>
                </div>
              </div>

              {/* Right Column: Order Checkout Summary */}
              <div className="checkout-summary-card">
                <div className="card-section-label">
                  <CreditCard size={12} />
                  <span>ORDER SUMMARY</span>
                </div>

                <div className="summary-row">
                  <span>Reserved Seat</span>
                  <span className="summary-val highlight">Row 14, Seat {seatSelected}</span>
                </div>
                <div className="summary-row">
                  <span>Ticket Price</span>
                  <span className="summary-val">$85.00</span>
                </div>
                <div className="summary-row">
                  <span>Booking Fee (0%)</span>
                  <span className="summary-val">$0.00</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="summary-val price-total">$85.00 USD</span>
                </div>

                {/* Primary Action Button */}
                <button
                  className={`btn-reserve-ticket ${status}`}
                  disabled={status === 'sending'}
                  onClick={() => onSendRequest('buy')}
                >
                  {status === 'sending' ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Transmitting HTTP Request...</span>
                    </>
                  ) : status === 'confirmed' ? (
                    <>
                      <CheckCircle size={13} />
                      <span>Ticket Confirmed! Click to Buy Another</span>
                    </>
                  ) : status === 'error' ? (
                    <>
                      <AlertTriangle size={13} />
                      <span>Retry Reservation</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} />
                      <span>Confirm & Reserve Seat {seatSelected}</span>
                    </>
                  )}
                </button>

                {/* Confirmed Ticket Receipt Banner */}
                {status === 'confirmed' && (
                  <div className="ticket-receipt-card">
                    <div className="receipt-header">
                      <CheckCircle size={14} className="green-check" />
                      <span>BOOKING CONFIRMED</span>
                    </div>
                    <div className="receipt-details">
                      <span>Receipt: #{lastTicketId}</span>
                      <span>User: {activeTab}</span>
                      <span>Latency: {lastLatencyMs}ms (Round-trip)</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {status === 'error' && (
                  <div className="ticket-error-card">
                    <AlertTriangle size={14} className="red-alert" />
                    <div className="error-text">
                      <span>504 Gateway Timeout</span>
                      <small>{lastErrorMessage || 'Server CPU at 100%. Request timed out after 24s.'}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. BROWSER DEVTOOLS NETWORK INSPECTOR TAB */}
            <div className="browser-devtools-drawer">
              <div
                className="devtools-header"
                onClick={() => setShowDevTools(!showDevTools)}
              >
                <div className="devtools-title">
                  <Terminal size={11} />
                  <span>DevTools Network Waterfall</span>
                  <span className="pill-method">POST</span>
                  <span className="pill-path">/api/orders/reserve</span>
                </div>
                <div className="devtools-stats">
                  <span className={status === 'confirmed' ? 'stat-200' : status === 'error' ? 'stat-504' : ''}>
                    {status === 'confirmed' ? '200 OK' : status === 'error' ? '504 Timeout' : status === 'sending' ? 'Pending...' : 'Idle'}
                  </span>
                  <span>•</span>
                  <span>{lastLatencyMs}ms</span>
                </div>
              </div>

              {showDevTools && (
                <div className="devtools-waterfall">
                  <div className="waterfall-row">
                    <span className="waterfall-label">DNS Resolution</span>
                    <div className="waterfall-bar dns" style={{ width: '8%' }} />
                    <span className="waterfall-time">2ms</span>
                  </div>
                  <div className="waterfall-row">
                    <span className="waterfall-label">TCP Handshake</span>
                    <div className="waterfall-bar tcp" style={{ width: '22%' }} />
                    <span className="waterfall-time">18ms</span>
                  </div>
                  <div className="waterfall-row">
                    <span className="waterfall-label">Server TTFB (DB Write)</span>
                    <div className={`waterfall-bar server ${status === 'error' ? 'error' : ''}`} style={{ width: '45%' }} />
                    <span className="waterfall-time">{Math.max(4, lastLatencyMs - 20)}ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. PHYSICAL ETHERNET OUTLET TO CANVAS */}
        <div className="monitor-nic-port" title="Ethernet Cable Connected to Architecture Canvas">
          <div className="nic-connector">
            <span className="nic-pins" />
            <span className="nic-cable-wire" />
          </div>
        </div>
      </div>

      {/* Monitor Stand */}
      <div className="monitor-stand">
        <div className="stand-pole" />
        <div className="stand-base" />
      </div>
    </div>
  );
};
