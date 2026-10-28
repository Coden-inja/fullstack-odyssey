import React, { useState } from 'react';
import { CanvasNode } from '../types';
import {
  X,
  Code,
  Terminal,
  Cpu,
  Database,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  Sliders,
  Play,
  RotateCcw
} from 'lucide-react';

interface NodeInspectorProps {
  node: CanvasNode | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, updates: Record<string, any>) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onClose,
  onUpdateNodeData
}) => {
  if (!node) return null;

  const [activeTab, setActiveTab] = useState<'code' | 'config' | 'metrics'>('code');

  return (
    <div className="inspector-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-title-group">
          <span className="drawer-tag">{node.type.toUpperCase()}</span>
          <h3 className="drawer-title">{node.title}</h3>
        </div>
        <button className="drawer-close-btn" onClick={onClose} title="Close Inspector">
          <X size={16} />
        </button>
      </div>

      {/* Drawer Tabs */}
      <div className="drawer-tabs">
        <button
          className={`drawer-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <Code size={13} /> Source / Spec
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Sliders size={13} /> Runtime Config
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <Cpu size={13} /> Telemetry
        </button>
      </div>

      {/* Drawer Content */}
      <div className="drawer-content">
        {/* 1. CODE / SPEC TAB */}
        {activeTab === 'code' && (
          <div className="code-view">
            {node.type === 'server' && (
              <pre className="syntax-code-block">
                <code>{`// server.ts — HTTP Order Handler
import express from 'express';
import { pool } from './db';
import { redis } from './redis';

const app = express();

app.post('/api/orders', async (req, res) => {
  const token = req.cookies.session_token;
  
  // 1. Authenticate user via session
  const user = await redis.get(\`session:\${token}\`);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  // 2. Commit order transaction
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO orders (user_id, seat, price) VALUES ($1, $2, $3) RETURNING id',
      [user, req.body.seat, 85.00]
    );
    return res.status(200).json({ status: 'confirmed', orderId: result.rows[0].id });
  } finally {
    client.release(); // Return connection to pool
  }
});`}</code>
              </pre>
            )}

            {node.type === 'balancer' && (
              <pre className="syntax-code-block">
                <code>{`# /etc/nginx/nginx.conf — Upstream Cluster

upstream ticket_backends {
    # Distribution Strategy: round_robin | least_conn | ip_hash
    ${node.data.algorithm || 'round-robin'};

    server 10.0.1.10:3000 max_fails=3 fail_timeout=10s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=10s;
    
    # Keepalive idle connection pool to backends
    keepalive 32;
}

server {
    listen 80;
    server_name tickets.yourapp.com;

    location / {
        proxy_pass http://ticket_backends;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}`}</code>
              </pre>
            )}

            {node.type === 'database' && (
              <pre className="syntax-code-block">
                <code>{`-- PostgreSQL Schema & Execution Plan
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    seat VARCHAR(16) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);

-- Query Planner: EXPLAIN ANALYZE
EXPLAIN ANALYZE 
SELECT * FROM orders WHERE seat = '14C';
-- Result: Index Scan using idx_orders_user (cost=0.28..8.29 rows=1)
-- Execution Time: 0.842 ms`}</code>
              </pre>
            )}

            {node.type === 'redis' && (
              <pre className="syntax-code-block">
                <code>{`// redis-cache.ts — Cache-Aside Pattern
export async function getRemainingSeats(eventId: string) {
  const cacheKey = \`cache:tickets:\${eventId}\`;
  
  // 1. Check in-memory RAM cache first (1ms)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // Cache Hit
  }

  // 2. Cache Miss: Query SQL Database (240ms)
  const count = await db.query('SELECT COUNT(*) FROM tickets WHERE event_id = $1', [eventId]);
  
  // 3. Populate Redis with 60s TTL
  await redis.set(cacheKey, JSON.stringify(count.rows[0]), 'EX', 60);
  return count.rows[0];
}`}</code>
              </pre>
            )}

            {node.type === 'queue' && (
              <pre className="syntax-code-block">
                <code>{`// worker.ts — BullMQ Asynchronous Consumer
import { Worker, Queue } from 'bullmq';

export const emailQueue = new Queue('order-emails');

// Dedicated background worker process
const worker = new Worker('order-emails', async (job) => {
  // Heavy third-party API call (3,200ms)
  await sendgrid.sendEmail({
    to: job.data.userEmail,
    subject: 'Your Concert Ticket Order',
    body: \`Seat \${job.data.seat} confirmed!\`
  });
}, {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 }
});`}</code>
              </pre>
            )}

            {node.type === 'browser' && (
              <pre className="syntax-code-block">
                <code>{`// client.ts — Fetch API Wire Request
async function buyTicket(seatId: string) {
  const startTime = performance.now();
  
  const response = await fetch('https://tickets.yourapp.com/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seat: seatId })
  });

  const duration = Math.round(performance.now() - startTime);
  console.log(\`Received \${response.status} in \${duration}ms\`);
  return response.json();
}`}</code>
              </pre>
            )}
          </div>
        )}

        {/* 2. RUNTIME CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="config-view">
            {node.type === 'balancer' && (
              <div className="config-form">
                <div className="form-item">
                  <label className="form-label">Routing Algorithm</label>
                  <select
                    className="form-select"
                    value={node.data.algorithm || 'round-robin'}
                    onChange={(e) => onUpdateNodeData(node.id, { algorithm: e.target.value })}
                  >
                    <option value="round-robin">Round Robin (Sequential)</option>
                    <option value="least-connections">Least Connections (Dynamic Concurrency)</option>
                    <option value="ip-hash">IP Hash (Client IP Affinity)</option>
                  </select>
                  <span className="form-hint">
                    Least Connections dynamically directs traffic to backends with fewest active sockets.
                  </span>
                </div>
              </div>
            )}

            {node.type === 'database' && (
              <div className="config-form">
                <div className="form-item">
                  <label className="form-label">Connection Pooler (PgBouncer)</label>
                  <button
                    className={`toggle-btn ${node.data.hasPooler ? 'active' : ''}`}
                    onClick={() =>
                      onUpdateNodeData(node.id, {
                        hasPooler: !node.data.hasPooler,
                        maxConnections: node.data.hasPooler ? 100 : 20,
                        activeConnections: Math.min(20, node.data.activeConnections)
                      })
                    }
                  >
                    {node.data.hasPooler ? '✓ PgBouncer Active (Pool: 20)' : 'Enable PgBouncer Pooler'}
                  </button>
                  <span className="form-hint">
                    Multiplexes thousands of client TCP connections into a small pool of active PostgreSQL worker backends.
                  </span>
                </div>
              </div>
            )}

            {node.type === 'server' && (
              <div className="config-form">
                <div className="form-item">
                  <label className="form-label">Instance Scaling Policy</label>
                  <div className="info-stat-pill">
                    <span>Target CPU: 70%</span>
                    <span>Cooldown: 300s</span>
                  </div>
                </div>
              </div>
            )}

            {node.type === 'redis' && (
              <div className="config-form">
                <div className="form-item">
                  <label className="form-label">Memory Eviction Policy</label>
                  <span className="code-badge">allkeys-lru (Least Recently Used)</span>
                  <span className="form-hint">
                    When Redis memory ceiling is reached, keys with oldest access time are evicted first.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. METRICS TELEMETRY TAB */}
        {activeTab === 'metrics' && (
          <div className="metrics-view">
            <div className="metric-card">
              <span className="metric-card-label">HEALTH STATUS</span>
              <span className="metric-card-val green-txt">
                <CheckCircle2 size={14} /> NOMINAL (HEALTH CHECKS PASSING)
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card-label">ROUND TRIP LATENCY</span>
              <span className="metric-card-val">{node.data.lastLatencyMs || 18} ms</span>
            </div>

            {node.data.cpuUsage !== undefined && (
              <div className="metric-card">
                <span className="metric-card-label">ACTIVE CPU UTILIZATION</span>
                <span className="metric-card-val">{node.data.cpuUsage}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
