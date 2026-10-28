// The code each node "runs", generated from what it is wired to right now.
// Wire Server 2 to Redis and its source gains the session lookup; cut the wire
// and the lines disappear. Hidden infrastructure counts as wired.

import { CanvasNode, CanvasWire, LevelDefinition } from '../types';
import { BOB_SID, BOB_USER_ID, graph, instancesOf, reachableShards } from '../sim/engine';

export interface GeneratedSource {
  filename: string;
  language: 'js' | 'sql' | 'conf';
  code: string;
}

const host = (n: CanvasNode) => n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function serverSource(node: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[], level: LevelDefinition): GeneratedSource {
  const { byId, outTo } = graph(nodes, wires);
  const m = level.mechanics;
  const hidden = new Set(level.hiddenInfra ?? []);
  const redisRoles = outTo(node.id, 'redis').map((w) => byId.get(w.targetNodeId)?.data.role);

  const sessions = m.sessions ? (redisRoles.includes('session') ? 'redis' : 'local') : hidden.has('sessions') ? 'redis' : 'none';
  const cache = redisRoles.includes('cache') || hidden.has('cache') ? 'cache' : m.readHeavy ? 'uncached' : 'none';
  const email = m.slowSideEffects ? (outTo(node.id, 'queue').length ? 'queue' : 'sync') : hidden.has('queue') ? 'queue' : 'none';

  const pools = outTo(node.id, 'pool');
  const directDb = outTo(node.id, 'database');
  const shards = m.sharding ? reachableShards(node, nodes, wires) : [];
  const db: 'none' | 'client' | 'direct-pool' | 'pgbouncer' | 'shards' = shards.length
    ? 'shards'
    : pools.length && !directDb.length
    ? 'pgbouncer'
    : directDb.length
    ? level.levelNumber >= 5
      ? 'direct-pool'
      : 'client'
    : hidden.has('pool')
    ? 'pgbouncer'
    : 'none';

  const L: string[] = [];
  L.push(`// server.js: the program "${node.title}" runs${instancesOf(node) > 1 ? ` (${instancesOf(node)} instances of it)` : ''}`);
  L.push(`import express from 'express';`);
  if (db !== 'none') L.push(`import pg from 'pg';`);
  if (sessions !== 'none') L.push(`import cookieParser from 'cookie-parser';`);
  if (sessions === 'redis' || cache === 'cache') L.push(`import { createClient } from 'redis';`);
  if (email === 'queue') L.push(`import { Queue } from 'bullmq';`);
  L.push('');

  if (db === 'client') {
    L.push('// one connection to PostgreSQL, opened when the program starts');
    L.push(`const db = new pg.Client({ host: 'postgresql', port: 5432 });`);
    L.push('await db.connect();');
  } else if (db === 'direct-pool') {
    L.push('// every instance opens up to 30 connections straight to PostgreSQL');
    L.push(`const db = new pg.Pool({ host: 'postgresql', port: 5432, max: 30 });`);
  } else if (db === 'pgbouncer') {
    L.push('// talk to PgBouncer instead: it shares 20 real connections to PostgreSQL');
    L.push(`const db = new pg.Pool({ host: 'pgbouncer', port: 6432, max: 30 });`);
  } else if (db === 'shards') {
    L.push(`// one database per shard; the shard key decides which one to ask`);
    L.push(`const shards = [${shards.map((s) => `'${host(s)}'`).join(', ')}].map(`);
    L.push(`  (host) => new pg.Pool({ host, port: 6432 })`);
    L.push(');');
    L.push('const shardFor = (userId) => shards[userId % shards.length];');
  } else {
    L.push('// no database is wired to this server: nowhere to keep bookings');
  }

  if (sessions === 'local') {
    const held = ((node.data.localSessions as string[]) ?? []).includes('Bob');
    L.push('');
    L.push(`// sessions live in THIS process's memory; other instances can't see them`);
    L.push(`const sessions = new Map(${held ? `[['${BOB_SID}', '${BOB_USER_ID}']]` : ''});${held ? ' // Bob logged in here' : ' // empty'}`);
  } else if (sessions === 'redis') {
    L.push('');
    L.push('// sessions live in Redis, shared by every instance');
    L.push(`const sessions = createClient({ url: 'redis://sessions:6379' });`);
    L.push('await sessions.connect();');
  }
  if (cache === 'cache') {
    L.push(`const cache = createClient({ url: 'redis://cache:6379' });`);
    L.push('await cache.connect();');
  }
  if (email === 'queue') L.push(`const emails = new Queue('send-ticket', { connection: { host: 'redis' } });`);

  L.push('');
  L.push('const app = express();');
  L.push('app.use(express.json());');
  if (sessions !== 'none') L.push('app.use(cookieParser());');

  const q = (sql: string, args: string) =>
    db === 'shards' ? `await shardFor(userId).query(\n    ${sql},\n    ${args}\n  )` : `await db.query(\n    ${sql},\n    ${args}\n  )`;

  // GET /api/seats: only exists once reads matter
  if (cache !== 'none') {
    L.push('');
    L.push(`app.get('/api/seats', async (req, res) => {`);
    if (cache === 'cache') {
      L.push(`  const copy = await cache.get('seats:free');`);
      L.push('  if (copy) return res.json({ free: Number(copy) }); // hit: ~1 ms, PostgreSQL not asked');
      L.push('');
    } else {
      L.push('  // runs on EVERY page view, thousands of times a second');
    }
    L.push(
      db === 'shards'
        ? `  const { rows } = await shards[0].query("SELECT count(*) FROM seats WHERE status = 'free'"); // seats aren't sharded`
        : `  const { rows } = await db.query("SELECT count(*) FROM seats WHERE status = 'free'");`
    );
    if (cache === 'cache') L.push(`  await cache.set('seats:free', rows[0].count, { EX: 5 }); // TTL: thrown away after 5 s`);
    L.push('  res.json({ free: Number(rows[0].count) });');
    L.push('});');
  }

  L.push('');
  L.push(`app.post('/api/orders', async (req, res) => {`);
  if (sessions === 'local') {
    L.push('  const userId = sessions.get(req.cookies.sid);');
    L.push(`  if (!userId) return res.status(401).json({ error: 'unknown session' });`);
  } else if (sessions === 'redis') {
    L.push('  const userId = await sessions.get(`session:${req.cookies.sid}`);');
    L.push(`  if (!userId) return res.status(401).json({ error: 'unknown session' });`);
  } else {
    L.push(`  const userId = ${BOB_USER_ID}; // Bob (logins arrive in Level 4)`);
  }
  L.push('  const { seat } = req.body;');
  if (db === 'none') {
    L.push(`  res.status(500).json({ error: 'nowhere to save the booking' });`);
  } else {
    L.push(`  const { rows } = ${q(`'INSERT INTO bookings (user_id, seat) VALUES ($1, $2) RETURNING id'`, '[userId, seat]')};`);
    if (email === 'sync') {
      L.push('');
      L.push('  // Bob waits for all of this before he sees anything');
      L.push('  const pdf = await renderTicketPdf(userId, seat); // ~1.8 s');
      L.push('  await emailProvider.send({ to: userId, attachment: pdf }); // ~1.4 s');
    } else if (email === 'queue') {
      L.push(`  await emails.add('send-ticket', { userId, seat }); // ~2 ms; a worker does the rest`);
    }
    L.push('  res.status(200).json({ bookingId: rows[0].id, seat });');
  }
  L.push('});');
  L.push('');
  L.push('// ask the operating system: hand me everything that arrives on port 3000');
  L.push('app.listen(3000);');

  return { filename: 'server.js', language: 'js', code: L.join('\n') };
}

export function generateSource(
  node: CanvasNode,
  nodes: CanvasNode[],
  wires: CanvasWire[],
  level: LevelDefinition
): GeneratedSource {
  const { byId, outTo } = graph(nodes, wires);
  switch (node.type) {
    case 'server':
      return serverSource(node, nodes, wires, level);

    case 'browser': {
      const L = [
        '// what the Reserve button runs in Bob’s browser',
        `const res = await fetch('/api/orders', {`,
        `  method: 'POST',`,
        `  headers: { 'Content-Type': 'application/json' },`,
        `  body: JSON.stringify({ seat: '14C' }),`
      ];
      if (level.levelNumber >= 4) L.push(`  credentials: 'include' // sends the cookie sid=${BOB_SID} along`);
      L.push('});', '', '// the browser waits here until the response arrives', 'console.log(res.status); // 200, 500, …');
      return { filename: 'reserve.js', language: 'js', code: L.join('\n') };
    }

    case 'balancer': {
      const backends = outTo(node.id, 'server').map((w) => byId.get(w.targetNodeId)!);
      const lines = backends.flatMap((b) =>
        instancesOf(b) > 1
          ? Array.from({ length: instancesOf(b) }, (_, i) => `    server ${host(b)}-${i + 1}:3000;`)
          : [`    server ${host(b)}:3000;`]
      );
      return {
        filename: 'nginx.conf',
        language: 'conf',
        code: [
          '# the load balancer: one address in front, several instances behind',
          'upstream app {',
          '    # no rule named here means round-robin',
          ...(lines.length ? lines : ['    # no servers wired yet: every request gets 502']),
          '}',
          '',
          'server {',
          '    listen 80;',
          '    location / {',
          '        proxy_pass http://app;',
          '    }',
          '}'
        ].join('\n')
      };
    }

    case 'database': {
      const L = ['-- PostgreSQL, listening on port 5432'];
      if (level.mechanics.connectionLimit) L.push('-- postgresql.conf: max_connections = 100  (one OS process each)');
      if (node.data.shard) L.push(`-- this shard holds rows where user_id % number_of_shards points at ${node.title}`);
      L.push('', 'CREATE TABLE bookings (', '  id      bigserial PRIMARY KEY,', '  user_id bigint NOT NULL,', '  seat    text   NOT NULL', ');');
      if (level.mechanics.sharding) L.push('', '-- a sorted B-tree on user_id; fast only while it fits in RAM', 'CREATE INDEX bookings_user_id ON bookings (user_id);');
      if (level.mechanics.readHeavy || level.levelNumber >= 6) L.push('', "SELECT count(*) FROM seats WHERE status = 'free';  -- walks every seat row");
      return { filename: 'schema.sql', language: 'sql', code: L.join('\n') };
    }

    case 'redis':
      return node.data.role === 'cache'
        ? {
            filename: 'redis (cache)',
            language: 'conf',
            code: [
              '# Redis used as a cache for one expensive answer',
              'GET seats:free             # hit → "1204", miss → (nil)',
              'SET seats:free 1204 EX 5   # keep the copy for 5 s (TTL)'
            ].join('\n')
          }
        : {
            filename: 'redis (sessions)',
            language: 'conf',
            code: [
              '# Redis: an in-memory key-value store, port 6379',
              `SET session:${BOB_SID} "${BOB_USER_ID}"   # written by the server Bob logged in on`,
              `GET session:${BOB_SID}          # any instance can read it back`
            ].join('\n')
          };

    case 'pool':
      return {
        filename: 'pgbouncer.ini',
        language: 'conf',
        code: [
          '[databases]',
          'tickets = host=postgresql port=5432',
          '',
          '[pgbouncer]',
          'listen_port = 6432',
          'max_client_conn = 1000   ; instances may open this many to PgBouncer…',
          `default_pool_size = ${node.data.poolSize ?? 20}    ; …but only this many reach PostgreSQL`,
          'pool_mode = transaction  ; borrowed for one transaction, then returned'
        ].join('\n')
      };

    case 'queue':
      return {
        filename: 'worker.js',
        language: 'js',
        code: [
          '// worker.js: a separate process that drains the job queue',
          `import { Worker } from 'bullmq';`,
          '',
          `new Worker('send-ticket', async (job) => {`,
          '  const pdf = await renderTicketPdf(job.data.userId, job.data.seat); // 1.8 s, nobody waiting',
          '  await emailProvider.send({ to: job.data.userId, attachment: pdf }); // 1.4 s',
          `}, { connection: { host: 'redis' } });`
        ].join('\n')
      };
  }
}

// One sentence per node type, in the words of the level that introduced it
export const NODE_BLURB: Record<CanvasNode['type'], string> = {
  browser: 'Bob’s browser: the client. It starts every conversation and waits for the response.',
  server: 'A program listening on port 3000. Its code below changes as you wire it to things.',
  database: 'PostgreSQL: keeps rows on disk so they survive restarts. Only servers talk to it.',
  balancer: 'Accepts every request and forwards each one to an instance behind it.',
  redis: 'Redis: an in-memory key-value store every instance can reach.',
  pool: 'PgBouncer: lends a few open PostgreSQL connections to many instances.',
  queue: 'A job queue plus its worker process, which does the slow work later.'
};
