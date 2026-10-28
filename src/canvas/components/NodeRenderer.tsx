import React from 'react';
import { CanvasNode } from '../types';
import {
  Globe,
  Shield,
  Server,
  Zap,
  Layers,
  Mail,
  Cpu,
  Ticket,
  User,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Wifi,
  Lock,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface NodeRendererProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelectNode: (id: string) => void;
  onStartWire: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndWire?: (targetNodeId: string, targetPortId: string) => void;
  isPendingWireActive?: boolean;
  onSendClientRequest?: (action: 'buy' | 'browse' | 'login') => void;
  onClientSelectSeat?: (seat: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  onSelectNode,
  onStartWire,
  onEndWire,
  isPendingWireActive = false,
  onSendClientRequest,
  onClientSelectSeat
}) => {
  const { type, title, data } = node;

  // 1. DEDICATED REALISTIC COMPUTER WORKSTATION MONITOR (WHEN TYPE === 'BROWSER')
  if (type === 'browser') {
    const isSending = data.status === 'sending';
    const isConfirmed = data.status === 'confirmed';
    const isTimeout = data.status === 'timeout' || data.status === 'error';

    return (
      <div
        className={`canvas-desktop-monitor ${isSelected ? 'selected' : ''} ${
          isPendingWireActive ? 'valid-wire-target' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (isPendingWireActive) {
            onEndWire?.(node.id, node.ports.inputs[0] || 'in-resp');
          } else {
            onSelectNode(node.id);
          }
        }}
        onMouseUp={(e) => {
          if (isPendingWireActive) {
            e.stopPropagation();
            onEndWire?.(node.id, node.ports.inputs[0] || 'in-resp');
          }
        }}
      >
        {/* PHYSICAL MONITOR BEZEL & CASING */}
        <div className="monitor-chassis">
          {/* Top Bezel with Webcam and Ambient Status */}
          <div className="monitor-top-bezel">
            <div className="monitor-mic-hole left" />
            <div className="monitor-webcam-lens">
              <span className="webcam-reflection" />
              <span className="webcam-status-led" />
            </div>
            <div className="monitor-mic-hole right" />
            <div className="monitor-os-bar">
              <span className="os-host-id">WORKSTATION // {data.activeTab || 'BOB'}-PC</span>
              <div className="os-meta-group">
                <span className="nic-badge">
                  <span className="nic-led blinking" /> eth0: 192.168.1.104
                </span>
                <Wifi size={10} className="wifi-icon" />
              </div>
            </div>
          </div>

          {/* REALISTIC BROWSER DISPLAY SCREEN */}
          <div className="monitor-screen-glass">
            {/* Anti-glare glass sheen */}
            <div className="glass-reflection-overlay" />

            {/* Browser Window Header */}
            <div className="browser-chrome-nav">
              <div className="browser-window-dots">
                <span className="dot dot-close" />
                <span className="dot dot-min" />
                <span className="dot dot-max" />
              </div>

              <div className="browser-url-bar">
                <Lock size={9} className="ssl-lock-icon" />
                <span className="url-protocol">https://</span>
                <span className="url-domain">tokyodome.tickets</span>
                <span className="url-path">/concert/2026/seats</span>
                <button
                  className="url-reload-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendClientRequest?.('browse');
                  }}
                  title="Reload Webpage"
                >
                  <RefreshCw size={10} className={isSending ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Tokyo Dome Live Ticket Store Application */}
            <div className="tokyo-dome-app">
              <div className="arena-header">
                <div className="arena-brand-group">
                  <span className="arena-title">TOKYO DOME 2026</span>
                  <span className="arena-badge">ARENA TICKETS</span>
                </div>

                <div className="user-profile-toggle">
                  <span className="user-toggle-lbl">USER:</span>
                  <div className="user-pill-group">
                    <button
                      className={`user-pill ${data.activeTab === 'Bob' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        node.data.activeTab = 'Bob';
                      }}
                      title="Switch to Bob (Logged In User)"
                    >
                      <User size={10} />
                      <span>Bob</span>
                    </button>
                    <button
                      className={`user-pill ${data.activeTab === 'Alice' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        node.data.activeTab = 'Alice';
                      }}
                      title="Switch to Alice (Incognito User)"
                    >
                      <User size={10} />
                      <span>Alice</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Seating Row */}
              <div className="seat-selection-strip">
                {['14A', '14B', '14C', '15A', '15B'].map((seat) => {
                  const isReserved = seat === '14B' || seat === '15B';
                  const isSelected = (data.seatSelected || '14C') === seat;
                  return (
                    <button
                      key={seat}
                      className={`arena-seat-btn ${isSelected ? 'selected' : ''} ${
                        isReserved ? 'reserved' : ''
                      }`}
                      disabled={isReserved || isSending}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClientSelectSeat?.(seat);
                        node.data.seatSelected = seat;
                      }}
                      title={isReserved ? `Seat ${seat} is already sold out` : `Select Seat ${seat}`}
                    >
                      <Ticket size={9} />
                      <span>{seat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Order Checkout Strip */}
              <div className="order-summary-strip">
                <div className="order-price-info">
                  <span className="order-seat-lbl">Selected: {data.seatSelected || '14C'}</span>
                  <span className="order-price-tag">${data.price || 85}.00</span>
                </div>

                <button
                  className={`checkout-action-btn ${data.status || 'idle'}`}
                  disabled={isSending}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendClientRequest?.('buy');
                  }}
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={11} className="spin" />
                      <span>POST /api/orders...</span>
                    </>
                  ) : isConfirmed ? (
                    <>
                      <CheckCircle2 size={11} className="icon-green" />
                      <span>Confirmed! #{data.lastTicketId || 'TKT-9842'}</span>
                    </>
                  ) : isTimeout ? (
                    <>
                      <Flame size={11} className="icon-red" />
                      <span>504 Gateway Timeout</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Reserve Seat {data.seatSelected || '14C'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* DevTools Network Telemetry Drawer */}
              <div className="devtools-status-bar">
                <span className="devtools-label">NETWORK DEVTOOLS:</span>
                <span className="devtools-ttfb">TTFB: {data.lastLatencyMs || 28}ms</span>
                <span
                  className={`devtools-status-pill ${
                    isTimeout ? 'status-err' : isConfirmed ? 'status-ok' : ''
                  }`}
                >
                  {isTimeout ? '504 TIMEOUT' : isConfirmed ? '200 OK' : 'READY'}
                </span>
              </div>
            </div>
          </div>

          {/* Monitor Metallic Bottom Chin */}
          <div className="monitor-chin">
            <span className="monitor-brand-engraved">ODYSSEY RETINA PRO // 4K 144Hz</span>
            <span className="monitor-power-led" />
          </div>

          {/* Physical Ethernet RJ45 Output Jack (Mounted on Right Edge) */}
          <div className="physical-rj45-jack" title="Ethernet NIC: 1GbE Physical Connection">
            <span className="rj45-label">ETH0</span>
            <div
              className={`port-socket output-socket ${isPendingWireActive ? 'active-snap-target' : ''}`}
              data-node-id={node.id}
              data-port-dir="out"
              data-port-id="out-req"
              title="Drag Ethernet Cable from Client Workstation to Server or Balancer"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartWire(node.id, 'out-req', true, e);
              }}
            >
              <span className="socket-dot" />
            </div>
            <span className="rj45-led blinking" />
          </div>
        </div>

        {/* Heavy Aluminum Monitor Stand Neck & Base */}
        <div className="monitor-stand-neck" />
        <div className="monitor-stand-base">
          <div className="stand-pedestal-shadow" />
        </div>
      </div>
    );
  }

  // 2. STANDARD BACKEND HARDWARE NODES (SERVER, BALANCER, REDIS, DATABASE, QUEUE)
  return (
    <div
      className={`canvas-node-card node-${type} ${isSelected ? 'selected' : ''} ${
        isPendingWireActive ? 'valid-wire-target' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (isPendingWireActive) {
          const targetPortId = node.ports.inputs[0] || 'in-main';
          onEndWire?.(node.id, targetPortId);
        } else {
          onSelectNode(node.id);
        }
      }}
      onMouseUp={(e) => {
        if (isPendingWireActive) {
          e.stopPropagation();
          const targetPortId = node.ports.inputs[0] || 'in-main';
          onEndWire?.(node.id, targetPortId);
        }
      }}
    >
      {/* Input Ports (Left) */}
      <div className="ports-column input-ports">
        {node.ports.inputs.map((pId) => (
          <div
            key={pId}
            className={`port-socket input-socket ${isPendingWireActive ? 'active-snap-target' : ''}`}
            data-node-id={node.id}
            data-port-dir="in"
            data-port-id={pId}
            title={`Snap wire to input: ${pId}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartWire(node.id, pId, false, e);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onEndWire?.(node.id, pId);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEndWire?.(node.id, pId);
            }}
          >
            <span className="socket-dot" />
            <span className="socket-tooltip">In</span>
          </div>
        ))}
      </div>

      {/* Node Content Body */}
      <div className="node-body">
        {/* Node Header */}
        <div className="node-card-header">
          <div className="node-title-group">
            {type === 'balancer' && <Shield size={14} className="node-icon icon-cyan" />}
            {type === 'server' && <Server size={14} className="node-icon icon-green" />}
            {type === 'redis' && <Zap size={14} className="node-icon icon-amber" />}
            {type === 'database' && <Layers size={14} className="node-icon icon-emerald" />}
            {type === 'queue' && <Mail size={14} className="node-icon icon-indigo" />}
            <span className="node-card-title">{title}</span>
          </div>
          <span className="node-type-pill">{type.toUpperCase()}</span>
        </div>

        {/* Node Interior By Type */}
        <div className="node-card-interior">
          {/* LOAD BALANCER NODE */}
          {type === 'balancer' && (
            <div className="balancer-node-content">
              <div className="algo-badge">
                <span>Algo:</span>
                <strong>{data.algorithm || 'least_conn'}</strong>
              </div>
              <div className="metric-row">
                <span>Active Conns</span>
                <span className="metric-val">{data.activeConns || 80}</span>
              </div>
              <div className="metric-row">
                <span>Health Checks</span>
                <span className="green-txt">All 2/2 Up</span>
              </div>
            </div>
          )}

          {/* SERVER NODE */}
          {type === 'server' && (
            <div className="server-node-content">
              <div className="metric-row">
                <span className="metric-lbl">
                  <Cpu size={10} /> CPU Load
                </span>
                <span
                  className={`metric-val ${
                    (data.cpuUsage || 0) > 85
                      ? 'danger-txt'
                      : (data.cpuUsage || 0) > 60
                      ? 'warning-txt'
                      : 'green-txt'
                  }`}
                >
                  {data.cpuUsage || 12}%
                </span>
              </div>

              {/* Animated CPU Bar */}
              <div className="cpu-meter-bar">
                <div
                  className={`cpu-fill ${
                    (data.cpuUsage || 0) > 85
                      ? 'fill-red'
                      : (data.cpuUsage || 0) > 60
                      ? 'fill-amber'
                      : 'fill-green'
                  }`}
                  style={{ width: `${Math.min(100, data.cpuUsage || 12)}%` }}
                />
              </div>

              <div className="metric-row">
                <span className="metric-lbl">Active Sockets</span>
                <span className="metric-val">
                  {data.activeSockets || 4} / {data.maxSockets || 128}
                </span>
              </div>

              {data.localSessions && Object.keys(data.localSessions).length > 0 && (
                <div className="session-warning-tag">
                  Local RAM Sessions: {Object.keys(data.localSessions).length}
                </div>
              )}
            </div>
          )}

          {/* REDIS CACHE NODE */}
          {type === 'redis' && (
            <div className="redis-node-content">
              <div className="metric-row">
                <span>Memory</span>
                <span className="metric-val">{data.memoryMb || 18} MB</span>
              </div>
              <div className="metric-row">
                <span>Hit Rate</span>
                <span className="green-txt">{data.cacheHitRate || 99.4}%</span>
              </div>
              <div className="metric-row">
                <span>Keys Cached</span>
                <span className="metric-val">{data.cachedKeys || 1420}</span>
              </div>
            </div>
          )}

          {/* DATABASE NODE */}
          {type === 'database' && (
            <div className="database-node-content">
              <div className="metric-row">
                <span>Active Conns</span>
                <span
                  className={`metric-val ${
                    (data.activeConnections || 0) >= (data.maxConnections || 100)
                      ? 'danger-txt'
                      : ''
                  }`}
                >
                  {data.activeConnections || 6} / {data.maxConnections || 100}
                </span>
              </div>
              <div className="metric-row">
                <span>Total Bookings</span>
                <span className="metric-val">{(data.rowCount || 12480).toLocaleString()} rows</span>
              </div>
              <div className="metric-row">
                <span>Query Time</span>
                <span
                  className={`metric-val ${
                    (data.queryTimeMs || 4) > 100 ? 'danger-txt' : 'green-txt'
                  }`}
                >
                  {data.queryTimeMs || 4}ms
                </span>
              </div>
            </div>
          )}

          {/* QUEUE NODE */}
          {type === 'queue' && (
            <div className="queue-node-content">
              <div className="metric-row">
                <span>Queue Depth</span>
                <span className="metric-val">{data.depth || 4} jobs</span>
              </div>
              <div className="metric-row">
                <span>Active Workers</span>
                <span className="green-txt">{data.workersActive || 3} online</span>
              </div>
              <div className="metric-row">
                <span>Processed/sec</span>
                <span className="metric-val">240 msgs/s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Ports (Right) */}
      <div className="ports-column output-ports">
        {node.ports.outputs.map((pId) => (
          <div
            key={pId}
            className="port-socket output-socket"
            data-node-id={node.id}
            data-port-dir="out"
            data-port-id={pId}
            title={`Drag wire from output: ${pId}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartWire(node.id, pId, true, e);
            }}
          >
            <span className="socket-dot" />
            <span className="socket-tooltip">Out</span>
          </div>
        ))}
      </div>
    </div>
  );
};
