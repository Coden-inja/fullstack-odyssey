// One tracked request — the player's — walking the actual wires. Everyone else is the
// crowd in sim/flow.ts; this request joins the same waiting lines, so its wait
// and its timeout come from the crowd, not from a threshold.

import { CanvasNode, CanvasWire, ClientAction, LevelMechanics, PacketKind } from '../types';
import { PERSONA, inr, inrWords } from '../data/story';
import { FlowState, TIMEOUT_S, waitAt } from './flow';
import {
  cacheFor,
  dbConnections,
  dbRoutes,
  graph,
  instancesOf,
  reachableShards,
  totalRows,
  trafficTargets
} from './graph';

export { graph, instancesOf, trafficTargets, dbConnections, reachableShards, totalRows } from './graph';

export interface QueueSpot {
  ahead: number; // requests in front when this one joined
  rate: number; // how many of them finish per simulated second
  timesOut: boolean;
}

export interface Hop {
  wireId: string;
  reverse: boolean; // travelling target → source along the wire (a reply)
  kind: PacketKind;
  label: string; // short: fits on the packet chip
  trace: string; // full sentence for the numbered trace list
  isError?: boolean;
  work?: string; // what the receiving node does before the next hop starts
  holdMs?: number; // fixed work time (simulated ms)
  queue?: QueueSpot; // the request waits in this node's line first
}

export interface SimResult {
  hops: Hop[];
  status: number; // 0 = the request never reached a server
  statusText: string;
  title: string;
  detail: string;
  latencyMs: number;
  servedBy?: string;
  nextRrCursor: number;
  warmedCache?: string;
  queuedOn?: string;
  email?: 'sync' | 'queued';
}

export interface SimInput {
  nodes: CanvasNode[];
  wires: CanvasWire[];
  flow: FlowState;
  mechanics: LevelMechanics;
  action: ClientAction;
  berth: string;
  rrCursor: number;
  warmCaches: string[];
}

export const USER_ID = PERSONA.userId;
export const SID = PERSONA.sid;
const SIDE_EFFECT_MS = 3_200; // PDF e-ticket 1.8 s + SMS/email 1.4 s
const SLOW_SHARD_ROWS = 100_000_000; // 10 crore: past this the index no longer fits in RAM
const SLOW_WRITE_MS = 2_400;

const secs = (s: number) => (s >= 10 ? `${Math.round(s)} s` : `${s.toFixed(1)} s`);

export function simulateRequest(input: SimInput): SimResult {
  const { nodes, wires, flow, mechanics, action, berth, rrCursor, warmCaches } = input;
  const { byId, outWires, outTo } = graph(nodes, wires);
  const isRead = action === 'browse';
  const who = PERSONA.name;
  const httpLabel = isRead ? 'GET /api/availability' : 'POST /api/bookings';

  const hops: Hop[] = [];
  const inbound: CanvasWire[] = [];
  let next = rrCursor;
  let latency = 2;

  const reply = (status: number, statusText: string, isError: boolean) => {
    const back = [...inbound].reverse();
    back.forEach((w, i) => {
      const from = byId.get(w.targetNodeId)!;
      const to = byId.get(w.sourceNodeId)!;
      hops.push({
        wireId: w.id,
        reverse: true,
        kind: 'http_resp',
        label: `${status} ${statusText}`,
        trace: `${from.title} → ${to.title}: ${status} ${statusText}`,
        isError,
        work: i === back.length - 1 ? undefined : 'passing the response back'
      });
    });
  };

  const finish = (status: number, statusText: string, title: string, detail: string, extra: Partial<SimResult> = {}): SimResult => {
    if (inbound.length) reply(status, statusText, status >= 400);
    return { hops, status, statusText, title, detail, latencyMs: Math.round(latency), nextRrCursor: next, ...extra };
  };

  // 1. Is anything plugged into the player's computer?
  const { entry, browserWire } = trafficTargets(nodes, wires);
  if (!browserWire || !entry) {
    return {
      hops,
      status: 0,
      statusText: 'No connection',
      title: 'Can’t reach the server',
      detail: `Nothing is plugged into ${who}’s computer, so the request never left it. Drag a wire from the round jack on the right edge of the monitor.`,
      latencyMs: 0,
      nextRrCursor: next
    };
  }
  hops.push({
    wireId: browserWire.id,
    reverse: false,
    kind: 'http_req',
    label: httpLabel,
    trace: `${who}’s browser → ${entry.title}: ${httpLabel}${isRead ? '' : ` (berth ${berth})`}`,
    work: entry.type === 'balancer' ? 'choosing a server' : 'reading the request',
    holdMs: 300
  });
  inbound.push(browserWire);

  // 2. Which server handles it?
  let server: CanvasNode;
  if (entry.type === 'balancer') {
    const bw = outTo(entry.id, 'server');
    if (!bw.length) {
      return finish(502, 'Bad Gateway', '502 Bad Gateway', 'The load balancer received the request but has no servers wired behind it to forward it to.');
    }
    const pick = bw[rrCursor % bw.length];
    next = rrCursor + 1;
    server = byId.get(pick.targetNodeId)!;
    hops.push({
      wireId: pick.id,
      reverse: false,
      kind: 'http_req',
      label: httpLabel,
      trace: `Load balancer → ${server.title}: forwards the request (round-robin, turn ${(rrCursor % bw.length) + 1} of ${bw.length})`,
      work: 'reading the request',
      holdMs: 300
    });
    inbound.push(pick);
  } else if (entry.type === 'server') {
    server = entry;
  } else {
    return finish(0, 'No server', 'No server on this wire', `${entry.title} doesn’t answer browser requests.`);
  }

  // 3. Join the line at the server. Everyone else's requests are already in it.
  const mu = flow.capacity[server.id] ?? mechanics.serverCapacityRps * instancesOf(server);
  const ahead = Math.round(flow.backlog[server.id] ?? 0);
  const wait = waitAt(flow, server.id);
  const lastIn = hops[hops.length - 1];
  if (ahead > 0) {
    lastIn.queue = { ahead, rate: mu, timesOut: wait >= TIMEOUT_S - 0.05 };
    lastIn.work = undefined;
  }
  if (wait >= TIMEOUT_S - 0.05) {
    latency = TIMEOUT_S * 1000;
    const arriving = flow.arriving[server.id] ?? 0;
    return finish(
      504,
      'Gateway Timeout',
      '504 Gateway Timeout',
      `${who} joined the line at ${server.title} behind ${inr(ahead)} requests. It finishes about ${inr(mu)} a second while ${inr(arriving)} arrive, so the line only grows. After ${TIMEOUT_S} s of waiting the browser gave up.`,
      { servedBy: server.id }
    );
  }
  latency += wait * 1000 + 3;

  const notes: string[] = [];
  if (entry.type === 'balancer') notes.push(`The load balancer sent this request to ${server.title}.`);
  if (ahead > 0) notes.push(`It waited behind ${inr(ahead)} other requests for ${secs(wait)}.`);

  // 4. Does this server know who the player is?
  if (mechanics.sessions) {
    const storeWire = outTo(server.id, 'redis').find((w) => byId.get(w.targetNodeId)?.data.role === 'session');
    const loginServers = nodes.filter((n) => n.type === 'server' && ((n.data.localSessions as string[]) ?? []).includes(who));
    let known = ((server.data.localSessions as string[]) ?? []).includes(who);
    if (storeWire) {
      const store = byId.get(storeWire.targetNodeId)!;
      known = loginServers.some((ls) => outWires(ls.id).some((w) => w.targetNodeId === store.id));
      hops.push({ wireId: storeWire.id, reverse: false, kind: 'redis', label: `GET session:${SID}`, trace: `${server.title} → Redis: GET session:${SID} (whose cookie is this?)`, work: 'looking up the key', holdMs: 200 });
      hops.push({
        wireId: storeWire.id,
        reverse: true,
        kind: 'redis',
        label: known ? `"${who}"` : '(nil)',
        trace: `Redis → ${server.title}: ${known ? `"${who}"` : '(nil): no such key'}`,
        isError: !known,
        work: known ? `${who} is logged in` : 'unknown session',
        holdMs: 250
      });
      latency += 1;
    } else {
      const last = hops[hops.length - 1];
      if (!last.queue) {
        last.work = `looking up session ${SID} in its own memory`;
        last.holdMs = 600;
      }
    }
    if (!known) {
      const login = loginServers.map((n) => n.title).join(', ') || 'another server';
      const detail = storeWire
        ? `${server.title} asked Redis for session ${SID} and got nothing back. ${login} created that session but isn’t wired to Redis, so it still only exists in ${login}’s own memory. ${who} sees “Session expired, please log in again”.`
        : `${server.title} looked up session ${SID} in its own memory and found nothing. ${who} logged in on ${login}, and only ${login} remembers that. ${who} sees “Session expired, please log in again”.`;
      return finish(401, 'Unauthorized', '401: session expired', detail, { servedBy: server.id });
    }
    notes.push(storeWire ? `${server.title} found session ${SID} in Redis: it’s ${who}.` : `${server.title} found ${who}’s session in its own memory.`);
  }

  // 5. Availability reads may be answered by the cache without touching the database
  const cache = cacheFor(server, nodes, wires);
  let cacheMiss = false;
  if (isRead && cache) {
    const warm = warmCaches.includes(cache.node.id);
    hops.push({ wireId: cache.wire.id, reverse: false, kind: 'redis', label: 'GET avail:B2', trace: `${server.title} → Redis cache: GET avail:B2`, work: 'looking up the key', holdMs: 200 });
    hops.push({
      wireId: cache.wire.id,
      reverse: true,
      kind: 'redis',
      label: warm ? 'HIT AVL 12' : 'MISS',
      trace: `Redis cache → ${server.title}: ${warm ? 'hit, "AVL 12"' : 'miss, (nil): nothing stored yet'}`,
      work: warm ? undefined : 'will ask PostgreSQL',
      holdMs: warm ? 0 : 250
    });
    latency += 1;
    if (warm) {
      notes.push('Cache hit: Redis already had avail:B2, so PostgreSQL wasn’t asked at all.');
      return finish(200, 'OK', 'Availability loaded', notes.join(' '), { servedBy: server.id });
    }
    cacheMiss = true;
  }

  // 6. Find a way to the database: direct, through a pool, or to the right shard
  const routes = dbRoutes(server, nodes, wires);
  if (!routes.length) {
    const last = hops[hops.length - 1];
    if (!last.queue) last.work = 'no database to talk to';
    return finish(
      500,
      'Internal Server Error',
      '500 Internal Server Error',
      `${server.title} got the request but has no database wired to it, so there is nowhere to ${isRead ? 'read availability from' : 'save the booking'}. 500 means the server failed, not ${who}.`,
      { servedBy: server.id }
    );
  }

  let route = routes[0];
  let shardNote = '';
  let writeMs = 4;
  if (mechanics.sharding) {
    const shards = reachableShards(server, nodes, wires);
    if (shards.length) {
      const idx = USER_ID % shards.length;
      const target = shards[idx];
      route = routes.find((r) => r.db.id === target.id) ?? route;
      const rowsPer = totalRows(nodes) / shards.length;
      const slow = rowsPer > SLOW_SHARD_ROWS;
      writeMs = slow ? SLOW_WRITE_MS : 9;
      shardNote = `${USER_ID} % ${shards.length} = ${idx} → ${target.title}, which holds ${inrWords(rowsPer)} rows${
        slow ? ': too many for its index to fit in RAM, so the write read index pages from disk' : ''
      }.`;
    }
  }

  const sqlShort = isRead ? 'SELECT count(*)' : 'INSERT booking';
  const sqlFull = isRead ? "SELECT count(*) FROM berths WHERE coach = 'B2' AND status = 'free'" : `INSERT INTO bookings (user_id, berth) VALUES (${USER_ID}, 'B2-${berth}')`;
  const queryHops = (dbWork: string, dbHold: number, queue?: QueueSpot) =>
    route.wires.forEach((w, i) => {
      const from = byId.get(w.sourceNodeId)!;
      const to = byId.get(w.targetNodeId)!;
      const last = i === route.wires.length - 1;
      hops.push({
        wireId: w.id,
        reverse: false,
        kind: 'sql_query',
        label: sqlShort,
        trace: last ? `${from.title} → ${to.title}: ${sqlFull}` : `${from.title} → ${to.title}: borrows one of its open connections`,
        work: last ? dbWork : 'lending a connection',
        holdMs: last ? dbHold : 200,
        queue: last ? queue : undefined
      });
    });
  const answerHops = (label: string, trace: string, isError: boolean) =>
    [...route.wires].reverse().forEach((w, i) => {
      const from = byId.get(w.targetNodeId)!;
      const to = byId.get(w.sourceNodeId)!;
      hops.push({
        wireId: w.id,
        reverse: true,
        kind: 'sql_resp',
        label,
        trace: i === 0 ? `${from.title} → ${to.title}: ${trace}` : `${from.title} → ${to.title}: passes the answer back, connection returned`,
        isError,
        work: i === route.wires.length - 1 ? (isError ? 'query failed' : 'got the answer, building the response') : 'taking the connection back',
        holdMs: 150
      });
    });

  // 7. PostgreSQL's connection limit
  if (mechanics.connectionLimit) {
    const c = dbConnections(route.db, nodes, wires);
    if (c.total > c.max) {
      queryHops('refusing: no connections left', 500);
      answerHops('FATAL', 'FATAL: sorry, too many clients already', true);
      return finish(
        500,
        'Internal Server Error',
        '500: too many connections',
        `PostgreSQL allows ${c.max} connections. ${c.direct ? `Instances opening their own: ${c.direct}. ` : ''}${c.pooled ? `PgBouncer: ${c.pooled}. ` : ''}That’s ${c.total}, so connection ${c.max + 1} was refused with “FATAL: sorry, too many clients already”.`,
        { servedBy: server.id }
      );
    }
    if (route.pool) notes.push(`Borrowed one of PgBouncer’s ${route.pool.data.poolSize ?? 20} open connections for the query.`);
  }

  // 8. Join the database's line when reads are flooding it (Level 6)
  let dbQueue: QueueSpot | undefined;
  if (mechanics.readHeavy) {
    const qAhead = Math.round(flow.backlog[route.db.id] ?? 0);
    const qWait = waitAt(flow, route.db.id);
    const qRate = flow.capacity[route.db.id] ?? 800;
    if (qAhead > 0) dbQueue = { ahead: qAhead, rate: qRate, timesOut: wait + qWait >= TIMEOUT_S - 0.05 };
    if (wait + qWait >= TIMEOUT_S - 0.05) {
      queryHops('', 0, dbQueue);
      latency = TIMEOUT_S * 1000;
      return finish(
        504,
        'Gateway Timeout',
        '504 Gateway Timeout',
        `Every availability check runs SELECT count(*) on PostgreSQL: ${inr(flow.arriving[route.db.id] ?? 0)} a second. It finishes about ${inr(qRate)}, so ${inr(qAhead)} queries were already waiting in front of ${who}’s ${isRead ? 'check' : 'booking'}, and it timed out behind them.`,
        { servedBy: server.id }
      );
    }
    latency += qWait * 1000;
    if (qAhead > 0) notes.push(`The query waited behind ${inr(qAhead)} others at PostgreSQL.`);
  }

  // 9. The query itself
  queryHops(isRead ? 'counting free berths' : writeMs > 100 ? 'writing… index is on disk' : 'writing the row to disk', writeMs > 100 ? 2000 : 350, dbQueue);
  answerHops(isRead ? 'count = 12' : 'INSERT 0 1', isRead ? 'count = 12' : 'INSERT 0 1 (one row saved)', false);
  latency += isRead ? 12 : writeMs;
  notes.push(isRead ? `${server.title} counted the free berths in PostgreSQL.` : `${server.title} saved the booking in PostgreSQL.`);
  if (shardNote) notes.push(shardNote);

  let warmedCache: string | undefined;
  if (cacheMiss && cache) {
    hops.push({ wireId: cache.wire.id, reverse: false, kind: 'redis', label: 'SET avail:B2 EX 5', trace: `${server.title} → Redis cache: SET avail:B2 "AVL 12" EX 5 (keep the copy for 5 s)`, work: 'storing the copy', holdMs: 150 });
    warmedCache = cache.node.id;
    latency += 1;
    notes.push('Cache miss: counted once on PostgreSQL and stored the answer in Redis for 5 s (TTL). Check again for a hit.');
  }

  // 10. After the booking: the slow extras (Level 7)
  let email: SimResult['email'];
  let queuedOn: string | undefined;
  if (!isRead && mechanics.slowSideEffects) {
    const qw = outTo(server.id, 'queue')[0];
    if (qw) {
      hops.push({ wireId: qw.id, reverse: false, kind: 'job', label: 'add send-e-ticket', trace: `${server.title} → job queue: add “send e-ticket to user ${USER_ID}, berth ${berth}”`, work: 'job stored', holdMs: 200 });
      latency += 2;
      email = 'queued';
      queuedOn = byId.get(qw.targetNodeId)!.id;
      notes.push('Then it added “send e-ticket” to the job queue and answered straight away; a worker sends the PDF and SMS a moment later.');
    } else {
      const last = hops[hops.length - 1];
      last.work = 'making the PDF e-ticket (1.8 s), then SMS + email (1.4 s)…';
      last.holdMs = SIDE_EFFECT_MS;
      latency += SIDE_EFFECT_MS;
      email = 'sync';
      notes.push(`Then it made the PDF e-ticket (1.8 s) and sent the SMS and email (1.4 s) before answering. ${who} waited for all of it.`);
    }
  }

  return finish(200, 'OK', isRead ? 'Availability loaded' : `Berth ${berth} is yours`, notes.join(' '), { servedBy: server.id, warmedCache, queuedOn, email });
}

// ── live numbers drawn on the cards ─────────────────────────────────────────
export interface NodeMetrics {
  cpu?: number;
  rpsIn?: number;
  overloaded?: boolean;
  waiting?: number;
  waitS?: number;
  gaveUp?: number;
  nextBackend?: string;
  backends?: number;
  connections?: number;
  maxConnections?: number;
  queryLoad?: number;
  queryCapacity?: number;
  rows?: number;
  sessionsHeld?: string[];
}

export function deriveMetrics(nodes: CanvasNode[], wires: CanvasWire[], flow: FlowState, mechanics: LevelMechanics, rrCursor: number): Record<string, NodeMetrics> {
  const { byId, outWires, outTo } = graph(nodes, wires);
  const out: Record<string, NodeMetrics> = {};
  const { entry } = trafficTargets(nodes, wires);

  for (const n of nodes) {
    const m: NodeMetrics = {};
    const lambda = flow.arriving[n.id] ?? 0;
    const mu = flow.capacity[n.id];
    if (n.type === 'server') {
      const cap = mechanics.serverCapacityRps * instancesOf(n);
      m.rpsIn = Math.round(lambda);
      m.overloaded = lambda > cap || (flow.backlog[n.id] ?? 0) > 1;
      m.cpu = lambda <= 0 ? 0 : m.overloaded ? 100 : Math.max(2, Math.round((lambda / cap) * 90));
    }
    if (mu) {
      m.waiting = Math.round(flow.backlog[n.id] ?? 0);
      m.waitS = waitAt(flow, n.id);
      m.gaveUp = Math.round(flow.gaveUp[n.id] ?? 0);
    }
    if (n.type === 'balancer') {
      const bw = outTo(n.id, 'server');
      m.backends = bw.length;
      m.nextBackend = bw.length ? byId.get(bw[rrCursor % bw.length].targetNodeId)?.title : undefined;
      m.rpsIn = entry?.id === n.id ? Math.round(lambda) : 0;
    }
    if (n.type === 'database') {
      const c = dbConnections(n, nodes, wires);
      m.connections = c.total;
      m.maxConnections = c.max;
      if (mechanics.readHeavy) {
        m.queryLoad = Math.round(lambda);
        m.queryCapacity = (n.data.queryCapacity as number) ?? 800;
      }
      if (mechanics.sharding && n.data.shard) {
        const fleet = nodes.find((s) => s.type === 'server');
        const shards = fleet ? reachableShards(fleet, nodes, wires) : [];
        m.rows = shards.some((s) => s.id === n.id) ? Math.round(totalRows(nodes) / shards.length) : 0;
      } else {
        m.rows = n.data.rows as number | undefined;
      }
    }
    if (n.type === 'redis' && n.data.role === 'session') {
      const writers = nodes.filter(
        (s) => s.type === 'server' && ((s.data.localSessions as string[]) ?? []).includes(PERSONA.name) && outWires(s.id).some((w) => w.targetNodeId === n.id)
      );
      m.sessionsHeld = writers.length ? [`session:${SID} → ${PERSONA.name}`] : [];
    }
    out[n.id] = m;
  }
  return out;
}
