import React from 'react';
import { Shield, Server, Zap, Database, ListTodo, Cable, Code2, Cog } from 'lucide-react';
import { CanvasNode, LevelMechanics } from '../types';
import { NodeMetrics } from '../sim/engine';
import { inr, inrWords } from '../data/story';

export interface QueueState {
  depth: number;
  sent: number;
  working: boolean;
}

interface NodeRendererProps {
  node: CanvasNode;
  levelNumber: number;
  mechanics: LevelMechanics;
  metrics?: NodeMetrics;
  activity?: string; // what this node is doing while it holds the request
  cacheWarm?: boolean;
  queue?: QueueState;
  isPendingWireActive: boolean;
  onStartWire: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndWire: (targetNodeId: string, targetPortId: string) => void;
  onOpenCode: (nodeId: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  balancer: <Shield size={14} />,
  server: <Server size={14} />,
  redis: <Zap size={14} />,
  database: <Database size={14} />,
  queue: <ListTodo size={14} />,
  pool: <Cable size={14} />
};

const Row: React.FC<{ label: string; value: React.ReactNode; tone?: 'ok' | 'warn' | 'err' }> = ({ label, value, tone }) => (
  <div className="nc-row">
    <span className="nc-label">{label}</span>
    <span className={`nc-value ${tone ? `tone-${tone}` : ''}`}>{value}</span>
  </div>
);

const fmt = inr;
const fmtRows = inrWords;

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  levelNumber,
  mechanics,
  metrics = {},
  activity,
  cacheWarm,
  queue,
  isPendingWireActive,
  onStartWire,
  onEndWire,
  onOpenCode
}) => {
  const { type, data } = node;
  const kind = type === 'redis' ? (data.role === 'cache' ? 'cache' : 'sessions') : type;
  const instances = (data.instances as number) ?? 1;

  const body = (() => {
    switch (type) {
      case 'server': {
        const sessions = (data.localSessions as string[] | undefined) ?? undefined;
        return (
          <>
            {instances > 1 && <Row label="instances" value={instances} />}
            {levelNumber < 2 ? (
              <Row label="listening on" value="port 3000" />
            ) : (
              <>
                <div className={`nc-meter ${metrics.overloaded ? 'is-hot' : (metrics.cpu ?? 0) > 70 ? 'is-warm' : ''}`}>
                  <span style={{ width: `${metrics.cpu ?? 0}%` }} />
                </div>
                <Row label="CPU" value={`${metrics.cpu ?? 0}%`} tone={metrics.overloaded ? 'err' : undefined} />
                <Row
                  label="requests/s in"
                  value={`${fmt(metrics.rpsIn ?? 0)} / ${fmt(mechanics.serverCapacityRps * instances)}`}
                  tone={metrics.overloaded ? 'err' : undefined}
                />
              </>
            )}
            {mechanics.sessions && sessions && (
              <Row label="sessions in memory" value={sessions.length ? sessions.join(', ') : 'none'} tone={sessions.length ? undefined : 'warn'} />
            )}
          </>
        );
      }
      case 'balancer':
        return (
          <>
            <Row label="rule" value="round-robin" />
            <Row label="next request →" value={metrics.nextBackend ?? 'no servers wired'} tone={metrics.nextBackend ? undefined : 'warn'} />
          </>
        );
      case 'database': {
        const overConn = mechanics.connectionLimit && (metrics.connections ?? 0) > (metrics.maxConnections ?? 100);
        const overQ = metrics.queryLoad !== undefined && metrics.queryLoad > (metrics.queryCapacity ?? 800);
        return (
          <>
            {metrics.rows !== undefined && (
              <Row
                label="rows"
                value={fmtRows(metrics.rows)}
                tone={mechanics.sharding && metrics.rows > 100_000_000 ? 'err' : undefined}
              />
            )}
            {mechanics.connectionLimit && (
              <Row label="connections" value={`${metrics.connections ?? 0} / ${metrics.maxConnections ?? 100}`} tone={overConn ? 'err' : undefined} />
            )}
            {metrics.queryLoad !== undefined && (
              <Row label="queries/s" value={`${fmt(metrics.queryLoad)} / ${fmt(metrics.queryCapacity ?? 800)}`} tone={overQ ? 'err' : undefined} />
            )}
            {mechanics.sharding && data.shard && <Row label="holds" value={`user_id % N → ${data.shard}`} />}
          </>
        );
      }
      case 'redis':
        return data.role === 'cache' ? (
          <Row label="avail:B2" value={cacheWarm ? 'AVL 12 · TTL 5 s' : 'empty'} tone={cacheWarm ? 'ok' : undefined} />
        ) : (
          <Row
            label="stored"
            value={metrics.sessionsHeld?.length ? metrics.sessionsHeld.join(', ') : 'nothing yet'}
            tone={metrics.sessionsHeld?.length ? 'ok' : undefined}
          />
        );
      case 'pool':
        return (
          <>
            <Row label="open connections" value={data.poolSize ?? 20} />
            <Row label="lent out" value="per query" />
          </>
        );
      case 'queue':
        return (
          <>
            <Row label="jobs waiting" value={queue?.depth ?? 0} />
            <Row label="worker" value={queue?.working ? 'sending an email…' : 'idle'} tone={queue?.working ? 'warn' : undefined} />
            <Row label="emails sent" value={queue?.sent ?? 0} />
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <div
      className={`nc nc-${kind} ${activity ? 'is-active' : ''} ${metrics.overloaded ? 'is-overloaded' : ''} ${
        isPendingWireActive ? 'is-drop-target' : ''
      }`}
      onMouseUp={(e) => {
        if (isPendingWireActive) {
          e.stopPropagation();
          onEndWire(node.id, node.ports.inputs[0] ?? 'in');
        }
      }}
    >
      {activity && (
        <div className="nc-activity">
          <Cog size={11} className="spin" /> {activity}
        </div>
      )}

      {node.ports.inputs.map((p) => (
        <div
          key={p}
          className="nc-port nc-port-in"
          data-node-id={node.id}
          data-port-dir="in"
          data-port-id={p}
          title="Drop a wire here"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartWire(node.id, p, false, e);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onEndWire(node.id, p);
          }}
        />
      ))}

      <div className="nc-head">
        <span className="nc-icon">{ICONS[type]}</span>
        <span className="nc-title">{node.title}</span>
        <button
          className="nc-code-btn"
          title="See this node’s code"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onOpenCode(node.id)}
        >
          <Code2 size={12} />
        </button>
      </div>
      <div className="nc-body">
        {body}
        {metrics.waitS !== undefined && levelNumber >= 2 && (metrics.waiting ?? 0) > 0 && (
          <div className="nc-line" title="Requests waiting in front of this node. Full bar = 10 s of work: anyone further back times out.">
            <div className="nc-line-bar">
              <span style={{ width: `${Math.min(100, (metrics.waitS / 10) * 100)}%` }} />
            </div>
            <Row label="in line" value={`${fmt(metrics.waiting ?? 0)} · ${Math.round(metrics.waitS)} s`} tone={metrics.waitS >= 9.9 ? 'err' : 'warn'} />
            {(metrics.gaveUp ?? 0) > 0 && <Row label="giving up" value={`${fmt(metrics.gaveUp ?? 0)}/s`} tone="err" />}
          </div>
        )}
      </div>

      {node.ports.outputs.map((p) => (
        <div
          key={p}
          className="nc-port nc-port-out"
          data-node-id={node.id}
          data-port-dir="out"
          data-port-id={p}
          title="Drag a wire from here"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartWire(node.id, p, true, e);
          }}
        />
      ))}
    </div>
  );
};
