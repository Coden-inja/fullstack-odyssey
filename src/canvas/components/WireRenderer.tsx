import React from 'react';
import { CanvasWire, CanvasNode, WirePacket } from '../types';

interface WireRendererProps {
  wires: CanvasWire[];
  nodes: CanvasNode[];
  packets: WirePacket[];
  pendingWire: {
    sourceNodeId: string;
    sourcePortId: string;
    isOutput: boolean;
    currentMousePos: { x: number; y: number };
  } | null;
  onDeleteWire?: (wireId: string) => void;
  // Port socket centres measured from the DOM, keyed `${nodeId}:${in|out}:${portId}`
  portPositions?: Record<string, { x: number; y: number }>;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wires,
  nodes,
  packets,
  pendingWire,
  onDeleteWire,
  portPositions = {}
}) => {
  // Helper to compute node port positions
  const getPortPosition = (nodeId: string, portId: string, isOutput: boolean) => {
    const dir = isOutput ? 'out' : 'in';
    const measured = portPositions[`${nodeId}:${dir}:${portId}`];
    if (measured) return measured;

    // Port id not rendered as a socket (e.g. browser 'in-resp'): use any socket on that node, same side first
    const sameSide = Object.keys(portPositions).find((k) => k.startsWith(`${nodeId}:${dir}:`));
    const anySide = Object.keys(portPositions).find((k) => k.startsWith(`${nodeId}:`));
    if (sameSide || anySide) return portPositions[(sameSide || anySide)!];

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const width = 230;
    const height = 155;
    const portList = isOutput ? node.ports.outputs : node.ports.inputs;
    const portIndex = portList.indexOf(portId);
    const totalPorts = Math.max(1, portList.length);

    const x = isOutput ? node.position.x + width : node.position.x;
    const y = node.position.y + 35 + ((portIndex + 0.5) / totalPorts) * (height - 45);

    return { x, y };
  };

  return (
    <svg className="canvas-wires-layer">
      <defs>
        {/* Active Wire Gradient */}
        <linearGradient id="activeWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.95" />
        </linearGradient>

        {/* Database Wire Gradient */}
        <linearGradient id="dbWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
        </linearGradient>

        {/* Pending Wire Gradient */}
        <linearGradient id="pendingWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
        </linearGradient>

        {/* Packet Glow Filter */}
        <filter id="packetGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. RENDER COMMITTED WIRES */}
      {wires.map((wire) => {
        const sourceNode = nodes.find((n) => n.id === wire.sourceNodeId);
        const targetNode = nodes.find((n) => n.id === wire.targetNodeId);

        const p1 = getPortPosition(wire.sourceNodeId, wire.sourcePortId, true);
        const p2 = getPortPosition(wire.targetNodeId, wire.targetPortId, false);

        // Smooth cubic-bezier curve
        const dx = Math.abs(p2.x - p1.x) * 0.5;
        const curvature = Math.max(dx, 45);
        const cx1 = p1.x + curvature;
        const cy1 = p1.y;
        const cx2 = p2.x - curvature;
        const cy2 = p2.y;

        const pathData = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
        const isDbWire = targetNode?.type === 'database' || sourceNode?.type === 'database';

        // Curve midpoint at t = 0.5:
        // B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
        const midX = 0.125 * p1.x + 0.375 * cx1 + 0.375 * cx2 + 0.125 * p2.x;
        const midY = 0.125 * p1.y + 0.375 * cy1 + 0.375 * cy2 + 0.125 * p2.y;

        return (
          <g key={wire.id} className="wire-group">
            {/* Ambient Background Glow */}
            <path
              d={pathData}
              fill="none"
              stroke={isDbWire ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.18)'}
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Core Wire Line */}
            <path
              d={pathData}
              fill="none"
              stroke={isDbWire ? 'url(#dbWireGrad)' : 'url(#activeWireGrad)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              className={wire.status === 'active' ? 'wire-core-line active' : 'wire-core-line'}
            />

            {/* Invisible Hit Zone for Hover and Context Menu */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              className="wire-hit-zone"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteWire?.(wire.id);
              }}
            />

            {/* Interactive Disconnect / Cut Chip on Wire Midpoint */}
            {/* Outer <g> owns the SVG translate; inner <g> takes the CSS hover scale so they don't clobber each other */}
            {onDeleteWire && (
              <g transform={`translate(${midX}, ${midY})`}>
                <g
                  className="wire-cut-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWire(wire.id);
                  }}
                >
                  <title>Click to disconnect wire (or right click)</title>
                  <circle r="10" className="cut-chip-bg" />
                  <text x="0" y="3.5" textAnchor="middle" className="cut-chip-icon">
                    ✕
                  </text>
                </g>
              </g>
            )}
          </g>
        );
      })}

      {/* 2. PENDING WIRE DRAG PREVIEW */}
      {pendingWire && (
        (() => {
          const p1 = getPortPosition(
            pendingWire.sourceNodeId,
            pendingWire.sourcePortId,
            pendingWire.isOutput
          );
          const p2 = pendingWire.currentMousePos;

          const dx = Math.abs(p2.x - p1.x) * 0.5;
          const curvature = Math.max(dx, 40);
          const cx1 = pendingWire.isOutput ? p1.x + curvature : p1.x - curvature;
          const cy1 = p1.y;
          const cx2 = pendingWire.isOutput ? p2.x - curvature : p2.x + curvature;
          const cy2 = p2.y;

          const pathData = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

          return (
            <path
              d={pathData}
              fill="none"
              stroke="url(#pendingWireGrad)"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="wire-drag-preview"
            />
          );
        })()
      )}

      {/* 3. IN-FLIGHT VISIBLE PACKETS WITH ENRICHED PAYLOAD PILLS */}
      {packets.map((pkt) => {
        const wire = wires.find((w) => w.id === pkt.wireId);
        if (!wire) return null;

        const p1 = pkt.isReturn
          ? getPortPosition(wire.targetNodeId, wire.targetPortId, false)
          : getPortPosition(wire.sourceNodeId, wire.sourcePortId, true);
        const p2 = pkt.isReturn
          ? getPortPosition(wire.sourceNodeId, wire.sourcePortId, true)
          : getPortPosition(wire.targetNodeId, wire.targetPortId, false);

        // Parametric point on cubic bezier
        const t = Math.max(0, Math.min(1, pkt.progress / 100));
        const dx = Math.abs(p2.x - p1.x) * 0.5;
        const curvature = Math.max(dx, 40);
        const cx1 = pkt.isReturn ? p1.x - curvature : p1.x + curvature;
        const cy1 = p1.y;
        const cx2 = pkt.isReturn ? p2.x + curvature : p2.x - curvature;
        const cy2 = p2.y;

        // Bezier formula
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const px = uuu * p1.x + 3 * uu * t * cx1 + 3 * u * tt * cx2 + ttt * p2.x;
        const py = uuu * p1.y + 3 * uu * t * cy1 + 3 * u * tt * cy2 + ttt * p2.y;

        // Color coding by packet kind
        const isSql = pkt.kind === 'sql_query' || pkt.kind === 'sql_resp';
        const isReturn = pkt.isReturn || pkt.kind === 'http_resp';
        const badgeColor = isSql ? '#f59e0b' : isReturn ? '#34d399' : '#38bdf8';
        const badgeBg = isSql ? 'rgba(245, 158, 11, 0.95)' : isReturn ? 'rgba(52, 211, 153, 0.95)' : 'rgba(56, 189, 248, 0.95)';

        const labelText = pkt.label || `${pkt.method} ${pkt.endpoint}`;
        const pillWidth = Math.max(130, labelText.length * 7 + 36);

        return (
          <g key={pkt.id} transform={`translate(${px}, ${py})`} filter="url(#packetGlow)">
            {/* Pulsing Core Point */}
            <circle r="7" fill={badgeColor} opacity="0.3" className="packet-glow-circle" />
            <circle r="4" fill={badgeColor} className="packet-core-circle" />

            {/* Floating Payload Pill */}
            <g transform="translate(10, -14)">
              <rect
                width={pillWidth}
                height="26"
                rx="13"
                ry="13"
                fill="rgba(11, 15, 23, 0.94)"
                stroke={badgeColor}
                strokeWidth="1.2"
              />
              {/* Method Badge Inside Pill */}
              <rect
                x="4"
                y="4"
                width="34"
                height="18"
                rx="9"
                fill={badgeBg}
              />
              <text
                x="21"
                y="16"
                textAnchor="middle"
                fill="#0b0f17"
                fontSize="9"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
              >
                {pkt.kind === 'sql_query' ? 'SQL' : pkt.kind === 'sql_resp' ? 'RES' : pkt.isReturn ? '200' : pkt.method}
              </text>

              {/* Payload / Query Text */}
              <text
                x="44"
                y="16"
                fill="#e2e8f0"
                fontSize="9.5"
                fontWeight="600"
                fontFamily="ui-monospace, monospace"
              >
                {labelText}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
