import React from 'react';
import { Lock, RotateCw, Mail, Code2, Loader2 } from 'lucide-react';
import { CanvasNode, ClientAction, LevelMechanics } from '../types';
import { BOB_SID } from '../sim/engine';

export interface NetworkEntry {
  id: number;
  method: string;
  path: string;
  status: number | null; // null while in flight, 0 when it never connected
  ms: number | null;
}

export interface ClientState {
  seat: string;
  sending: null | { action: ClientAction; startedAt: number };
  last?: { action: ClientAction; status: number; statusText: string; title: string; detail: string; latencyMs: number };
  network: NetworkEntry[];
  freeSeats: number;
  booked: string[];
  emails: Array<{ id: number; text: string }>;
}

export const initialClient = (): ClientState => ({
  seat: '14C',
  sending: null,
  network: [],
  freeSeats: 1204,
  booked: [],
  emails: []
});

const ROWS = ['14', '15'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SOLD = new Set(['14B', '14E', '15A', '15F', '15G']);

interface BrowserMonitorProps {
  node: CanvasNode;
  levelNumber: number;
  mechanics: LevelMechanics;
  client: ClientState;
  now: number;
  busyLabel?: string; // replaces the elapsed timer while a step-by-step request plays
  isPendingWireActive: boolean;
  onAction: (action: ClientAction) => void;
  onSelectSeat: (seat: string) => void;
  onStartWire: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndWire: (nodeId: string, portId: string) => void;
  onOpenCode: (nodeId: string) => void;
}

const statusTone = (s: number | null) => (s === null ? 'pending' : s >= 200 && s < 300 ? 'ok' : s >= 400 && s < 500 ? 'warn' : 'err');

export const BrowserMonitor: React.FC<BrowserMonitorProps> = ({
  node,
  levelNumber,
  mechanics,
  client,
  now,
  busyLabel,
  isPendingWireActive,
  onAction,
  onSelectSeat,
  onStartWire,
  onEndWire,
  onOpenCode
}) => {
  const busy = !!client.sending;
  const elapsed = client.sending ? Math.max(0, now - client.sending.startedAt) : 0;
  const showCookie = levelNumber >= 4;
  const showRefresh = !!mechanics.readHeavy || levelNumber >= 6;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className={`bm ${isPendingWireActive ? 'is-wiring' : ''}`}
      onMouseUp={() => isPendingWireActive && onEndWire(node.id, 'in')}
    >
      <div className="bm-bezel">
        <div className="bm-chrome">
          <span className="bm-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="bm-url">
            <Lock size={10} /> tokyodome.tickets<span className="bm-url-path">/seats</span>
          </span>
          <button className="bm-code-btn" title="See the code this button runs" onMouseDown={stop} onClick={() => onOpenCode(node.id)}>
            <Code2 size={12} />
          </button>
        </div>

        <div className="bm-page">
          {client.emails.length > 0 && (
            <div className="bm-email" key={client.emails[client.emails.length - 1].id}>
              <Mail size={12} /> {client.emails[client.emails.length - 1].text}
            </div>
          )}

          <div className="bm-header">
            <div>
              <div className="bm-brand">Tokyo Dome · Live 2026</div>
              <div className="bm-sub">Arena seats · rows 14–15</div>
            </div>
            <div className="bm-user">
              Bob{showCookie && <span className="bm-cookie">cookie sid={BOB_SID}</span>}
            </div>
          </div>

          {showRefresh && (
            <div className="bm-free">
              <span>
                Free seats <strong>{client.freeSeats.toLocaleString('en-US')}</strong>
              </span>
              <button
                className="bm-refresh"
                disabled={busy}
                onMouseDown={stop}
                onClick={() => onAction('browse')}
                title="Reload the seat map: GET /api/seats"
              >
                <RotateCw size={12} className={busy && client.sending?.action === 'browse' ? 'spin' : ''} /> Refresh
              </button>
            </div>
          )}

          <div className="bm-seats" onMouseDown={stop}>
            {ROWS.map((row) => (
              <div className="bm-seat-row" key={row}>
                <span className="bm-row-label">{row}</span>
                {LETTERS.map((l) => {
                  const id = row + l;
                  const mine = client.booked.includes(id);
                  const sold = SOLD.has(id);
                  const selected = client.seat === id;
                  return (
                    <button
                      key={id}
                      className={`bm-seat ${sold ? 'sold' : ''} ${mine ? 'mine' : ''} ${selected && !mine ? 'selected' : ''}`}
                      disabled={sold || mine || busy}
                      onClick={() => onSelectSeat(id)}
                      title={sold ? `${id}: sold` : mine ? `${id}: yours` : `Seat ${id}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            className={`bm-cta ${busy ? 'is-busy' : ''}`}
            disabled={busy || client.booked.includes(client.seat)}
            onMouseDown={stop}
            onClick={() => onAction('buy')}
          >
            {busy ? (
              <>
                <Loader2 size={14} className="spin" /> {busyLabel ?? `Waiting for the response… ${(elapsed / 1000).toFixed(1)} s`}
              </>
            ) : client.booked.includes(client.seat) ? (
              <>Seat {client.seat} is yours: pick another</>
            ) : (
              <>Reserve seat {client.seat} · $85</>
            )}
          </button>

          {client.last && !busy && (
            <div className={`bm-result tone-${client.last.status === 0 ? 'err' : statusTone(client.last.status)}`}>
              <div className="bm-result-head">
                <span className="bm-status">{client.last.status === 0 ? 'no connection' : `${client.last.status} ${client.last.statusText}`}</span>
                <span className="bm-result-title">
                  {client.last.title === `${client.last.status} ${client.last.statusText}` ? '' : client.last.title}
                </span>
                {client.last.status !== 0 && (
                  <span className="bm-result-ms">
                    {client.last.latencyMs >= 1000 ? `${(client.last.latencyMs / 1000).toFixed(1)} s` : `${client.last.latencyMs} ms`}
                  </span>
                )}
              </div>
              <p className="bm-result-detail">{client.last.detail}</p>
            </div>
          )}
        </div>

        <div className="bm-network">
          <div className="bm-net-head">
            <span>Network</span>
            <span>status</span>
            <span>time</span>
          </div>
          {client.network.length === 0 && <div className="bm-net-empty">No requests yet</div>}
          {client.network.slice(-3).map((r) => (
            <div className="bm-net-row" key={r.id}>
              <span className="bm-net-req">
                <b>{r.method}</b> {r.path}
              </span>
              <span className={`bm-net-status tone-${r.status === 0 ? 'err' : statusTone(r.status)}`}>
                {r.status === null ? '…' : r.status === 0 ? 'failed' : r.status}
              </span>
              <span className="bm-net-ms">{r.ms === null ? '' : r.ms >= 1000 ? `${(r.ms / 1000).toFixed(1)} s` : `${r.ms} ms`}</span>
            </div>
          ))}
        </div>

        <div
          className={`bm-jack ${isPendingWireActive ? '' : 'is-ready'}`}
          title="Network jack: drag a wire from here"
          data-node-id={node.id}
          data-port-dir="out"
          data-port-id="out-req"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartWire(node.id, 'out-req', true, e);
          }}
        >
          <span className="bm-jack-dot" />
        </div>
      </div>
      <div className="bm-stand" />
    </div>
  );
};
