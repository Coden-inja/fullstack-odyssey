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
  justConnectedId?: string | null;
  activeWireId?: string | null;
  layer?: 'wires' | 'packets'; // packets render in a second SVG above the cards
  flows?: Record<string, number>; // crowd req/s per wire
  dotScale?: number; // req/s per moving dot
}

const PACKET_COLOR: Record<string, string> = {
  http_req: 'var(--c-sky)',
  http_resp: 'var(--c-mint)',
  sql_query: 'var(--c-honey)',
  sql_resp: 'var(--c-honey)',
  redis: 'var(--c-coral)',
  job: 'var(--c-lavender)'
};

// Cubic bezier between two ports; returns path data plus a point-at-t function
const curve = (p1: { x: number; y: number }, p2: { x: number; y: number }, outward = 1) => {
  const c = Math.max(Math.abs(p2.x - p1.x) * 0.5, 45);
  const cx1 = p1.x + c * outward;
  const cx2 = p2.x - c * outward;
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * p1.x + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * p2.x,
      y: u * u * u * p1.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p2.y
    };
  };
  return { d: `M ${p1.x} ${p1.y} C ${cx1} ${p1.y}, ${cx2} ${p2.y}, ${p2.x} ${p2.y}`, at };
};

export const WireRenderer: React.FC<WireRendererProps> = ({
  wires,
  nodes,
  packets,
  pendingWire,
  onDeleteWire,
  portPositions = {},
  justConnectedId,
  activeWireId,
  layer = 'wires',
  flows,
  dotScale = 1
}) => {
  const getPortPosition = (nodeId: string, portId: string, isOutput: boolean) => {
    const dir = isOutput ? 'out' : 'in';
    const measured = portPositions[`${nodeId}:${dir}:${portId}`];
    if (measured) return measured;

    // Port id not rendered as a socket: use any socket on that node, same side first
    const sameSide = Object.keys(portPositions).find((k) => k.startsWith(`${nodeId}:${dir}:`));
    const anySide = Object.keys(portPositions).find((k) => k.startsWith(`${nodeId}:`));
    if (sameSide || anySide) return portPositions[(sameSide || anySide)!];

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.position.x + (isOutput ? 230 : 0), y: node.position.y + 60 };
  };

  const endpoints = (w: CanvasWire) => ({
    p1: getPortPosition(w.sourceNodeId, w.sourcePortId, true),
    p2: getPortPosition(w.targetNodeId, w.targetPortId, false)
  });

  return (
    <svg className={layer === 'packets' ? 'canvas-wires-layer packets-layer' : 'canvas-wires-layer'}>
      {layer === 'wires' && wires.map((wire) => {
        const { p1, p2 } = endpoints(wire);
        const { d, at } = curve(p1, p2);
        const mid = at(0.5);
        const cls = [
          'wire',
          wire.id === justConnectedId ? 'is-new' : '',
          wire.id === activeWireId ? 'is-carrying' : ''
        ].join(' ');

        return (
          <g key={wire.id} className={cls}>
            <path d={d} className="wire-halo" />
            <path d={d} className="wire-line" />
            {flows && (flows[wire.id] ?? 0) > 0 &&
              (() => {
                const n = Math.min(14, Math.max(1, Math.round((flows[wire.id] ?? 0) / dotScale)));
                return Array.from({ length: n }, (_, i) => (
                  <circle key={i} r="2.6" className="crowd-dot">
                    <animateMotion dur="2.4s" repeatCount="indefinite" begin={`-${((i / n) * 2.4).toFixed(2)}s`} path={d} />
                  </circle>
                ));
              })()}
            <path
              d={d}
              className="wire-hit-zone"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteWire?.(wire.id);
              }}
            />
            {/* Outer <g> owns the SVG translate; inner <g> takes the CSS hover scale so they don't clobber each other */}
            {onDeleteWire && !pendingWire && (
              <g transform={`translate(${mid.x}, ${mid.y})`}>
                <g
                  className="wire-cut-chip"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWire(wire.id);
                  }}
                >
                  <title>Disconnect this wire</title>
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

      {layer === 'wires' && pendingWire &&
        (() => {
          const p1 = getPortPosition(pendingWire.sourceNodeId, pendingWire.sourcePortId, pendingWire.isOutput);
          const { d } = curve(p1, pendingWire.currentMousePos, pendingWire.isOutput ? 1 : -1);
          return <path d={d} className="wire-drag-preview" />;
        })()}

      {layer === 'packets' && packets.map((pkt) => {
        const wire = wires.find((w) => w.id === pkt.wireId);
        if (!wire) return null;
        const { p1, p2 } = endpoints(wire);
        const t = Math.max(0, Math.min(1, pkt.progress / 100));
        const pos = curve(p1, p2).at(pkt.isReturn ? 1 - t : t);
        const color = pkt.isError ? 'var(--c-coral)' : PACKET_COLOR[pkt.kind ?? 'http_req'];
        const width = Math.round(pkt.label.length * 6.2 + 18);

        return (
          <g key={pkt.id} transform={`translate(${pos.x}, ${pos.y})`} className="packet">
            <circle r="9" fill={color} opacity="0.25" />
            <circle r="5" fill={color} />
            <g transform={`translate(${-width / 2}, -30)`}>
              <rect width={width} height="20" rx="10" className="packet-chip" style={{ stroke: color }} />
              <text x={width / 2} y="13.5" textAnchor="middle" className="packet-chip-text">
                {pkt.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
