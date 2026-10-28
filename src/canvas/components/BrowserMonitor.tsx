import React from 'react';
import { Lock, RotateCw, MessageSquare, Code2, Loader2, TrainFront } from 'lucide-react';
import { CanvasNode, ClientAction, LevelMechanics } from '../types';
import { SID } from '../sim/engine';
import { BERTHS_TAKEN, DEFAULT_BERTH, PERSONA, TRIP, berthType, inr } from '../data/story';

export interface NetworkEntry {
  id: number;
  method: string;
  path: string;
  status: number | null; // null while in flight, 0 when it never connected
  ms: number | null;
}

export interface ClientState {
  berth: string;
  sending: null | { action: ClientAction; startedAt: number };
  last?: { action: ClientAction; status: number; statusText: string; title: string; detail: string; latencyMs: number };
  network: NetworkEntry[];
  available: number;
  booked: string[];
  messages: Array<{ id: number; text: string }>;
}

export const initialClient = (): ClientState => ({
  berth: DEFAULT_BERTH,
  sending: null,
  network: [],
  available: 12,
  booked: [],
  messages: []
});

export type AvatarState = 'idle' | 'waiting' | 'booked' | 'gaveup' | 'error';

export interface CrowdView {
  avatars: AvatarState[];
  arriving: number;
  waiting: number;
  booked: number;
  gaveUp: number;
}

const BAYS = [
  ['1', '2', '3', '4', '5', '6', '7', '8'],
  ['9', '10', '11', '12', '13', '14', '15', '16']
];
const SHORT: Record<string, string> = { Lower: 'L', Middle: 'M', Upper: 'U', 'Side lower': 'SL', 'Side upper': 'SU' };

interface BrowserMonitorProps {
  node: CanvasNode;
  levelNumber: number;
  mechanics: LevelMechanics;
  client: ClientState;
  crowd?: CrowdView;
  now: number;
  busyLabel?: string; // replaces the elapsed timer while a step-by-step request plays
  isPendingWireActive: boolean;
  onAction: (action: ClientAction) => void;
  onSelectBerth: (berth: string) => void;
  onStartWire: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndWire: (nodeId: string, portId: string) => void;
  onOpenCode: (nodeId: string) => void;
}

const statusTone = (s: number | null) => (s === null ? 'pending' : s >= 200 && s < 300 ? 'ok' : s >= 400 && s < 500 ? 'warn' : 'err');
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

export const BrowserMonitor: React.FC<BrowserMonitorProps> = ({
  node,
  levelNumber,
  mechanics,
  client,
  crowd,
  now,
  busyLabel,
  isPendingWireActive,
  onAction,
  onSelectBerth,
  onStartWire,
  onEndWire,
  onOpenCode
}) => {
  const busy = !!client.sending;
  const elapsed = client.sending ? Math.max(0, now - client.sending.startedAt) : 0;
  const showCookie = levelNumber >= 4;
  const showRefresh = !!mechanics.readHeavy || levelNumber >= 6;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const mine = client.booked.includes(client.berth);

  return (
    <div className={`bm ${isPendingWireActive ? 'is-wiring' : ''}`} onMouseUp={() => isPendingWireActive && onEndWire(node.id, 'in')}>
      {crowd && (
        <div className="crowd" onMouseDown={stop} title="Everyone else pressing Book right now. Each face is a share of the traffic.">
          <div className="crowd-head">
            <span>Others booking now</span>
            <span className="crowd-legend">
              <i className="av av-waiting" /> waiting <i className="av av-booked" /> booked <i className="av av-gaveup" /> gave up
            </span>
          </div>
          <div className="crowd-faces">
            {crowd.avatars.length === 0 ? (
              <span className="crowd-empty">Only {PERSONA.name} right now</span>
            ) : (
              crowd.avatars.map((a, i) => <i key={i} className={`av av-${a}`} />)
            )}
          </div>
          <div className="crowd-stats">
            <span>
              <b>{inr(crowd.arriving)}</b>/s arriving
            </span>
            <span className={crowd.waiting > 0 ? 'tone-warn' : ''}>
              <b>{inr(crowd.waiting)}</b> waiting
            </span>
            <span className="tone-ok">
              <b>{inr(crowd.booked)}</b>/s booked
            </span>
            <span className={crowd.gaveUp > 0 ? 'tone-err' : ''}>
              <b>{inr(crowd.gaveUp)}</b>/s gave up
            </span>
          </div>
        </div>
      )}

      <div className="bm-bezel">
        <div className="bm-chrome">
          <span className="bm-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="bm-url">
            <Lock size={10} /> {TRIP.site}
            <span className="bm-url-path">/tatkal</span>
          </span>
          <button className="bm-code-btn" title="See the code this button runs" onMouseDown={stop} onClick={() => onOpenCode(node.id)}>
            <Code2 size={12} />
          </button>
        </div>

        <div className="bm-page">
          {client.messages.length > 0 && (
            <div className="bm-email" key={client.messages[client.messages.length - 1].id}>
              <MessageSquare size={12} /> {client.messages[client.messages.length - 1].text}
            </div>
          )}

          <div className="bm-header">
            <div>
              <div className="bm-brand">
                <TrainFront size={14} /> {TRIP.brand} · Tatkal
              </div>
              <div className="bm-sub">
                {TRIP.train} · {TRIP.from} → {TRIP.to} · coach {TRIP.coach} (3A)
              </div>
            </div>
            <div className="bm-user">
              {PERSONA.name}
              {showCookie && <span className="bm-cookie">cookie sid={SID}</span>}
            </div>
          </div>

          {showRefresh && (
            <div className="bm-free">
              <span>
                Availability <strong className="tone-ok">AVL {client.available}</strong>
              </span>
              <button className="bm-refresh" disabled={busy} onMouseDown={stop} onClick={() => onAction('browse')} title="Check again: GET /api/availability">
                <RotateCw size={12} className={busy && client.sending?.action === 'browse' ? 'spin' : ''} /> Refresh
              </button>
            </div>
          )}

          <div className="bm-seats" onMouseDown={stop}>
            {BAYS.map((bay, b) => (
              <div className="bm-seat-row" key={b}>
                <span className="bm-row-label">bay {b + 1}</span>
                {bay.map((n) => {
                  const own = client.booked.includes(n);
                  const taken = BERTHS_TAKEN.has(n);
                  const selected = client.berth === n;
                  return (
                    <button
                      key={n}
                      className={`bm-seat ${taken ? 'sold' : ''} ${own ? 'mine' : ''} ${selected && !own ? 'selected' : ''}`}
                      disabled={taken || own || busy}
                      onClick={() => onSelectBerth(n)}
                      title={taken ? `Berth ${n}: booked` : own ? `Berth ${n}: yours` : `Berth ${n} · ${berthType(n)}`}
                    >
                      <span className="bm-berth-n">{n}</span>
                      <span className="bm-berth-t">{SHORT[berthType(n)]}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button className={`bm-cta ${busy ? 'is-busy' : ''}`} disabled={busy || mine} onMouseDown={stop} onClick={() => onAction('buy')}>
            {busy ? (
              <>
                <Loader2 size={14} className="spin" /> {busyLabel ?? `Waiting for the response… ${(elapsed / 1000).toFixed(1)} s`}
              </>
            ) : mine ? (
              <>Berth {client.berth} is yours: pick another</>
            ) : (
              <>
                Book berth {client.berth} ({berthType(client.berth)}) · ₹{inr(TRIP.fare)}
              </>
            )}
          </button>

          {client.last && !busy && (
            <div className={`bm-result tone-${client.last.status === 0 ? 'err' : statusTone(client.last.status)}`}>
              <div className="bm-result-head">
                <span className="bm-status">{client.last.status === 0 ? 'no connection' : `${client.last.status} ${client.last.statusText}`}</span>
                <span className="bm-result-title">
                  {client.last.title === `${client.last.status} ${client.last.statusText}` ? '' : client.last.title}
                </span>
                {client.last.status !== 0 && <span className="bm-result-ms">{fmtMs(client.last.latencyMs)}</span>}
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
              <span className={`bm-net-status tone-${r.status === 0 ? 'err' : statusTone(r.status)}`}>{r.status === null ? '…' : r.status === 0 ? 'failed' : r.status}</span>
              <span className="bm-net-ms">{r.ms === null ? '' : fmtMs(r.ms)}</span>
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
