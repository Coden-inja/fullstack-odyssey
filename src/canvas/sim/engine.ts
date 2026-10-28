// Request simulation: walks the actual wires from Bob's browser and decides what
// happens under the level's rules. Pure functions — the workbench animates the
// returned hops strictly in order, one packet at a time.

import { CanvasNode, CanvasWire, ClientAction, LevelMechanics, PacketKind } from '../types';

export interface Hop {
  wireId: string;
  reverse: boolean; // travelling target → source along the wire (a reply)
  kind: PacketKind;
  label: string; // short: fits on the packet chip
  trace: string; // full sentence for the numbered trace list
  isError?: boolean;
  work?: string; // what the receiving node does before the next hop starts
  holdMs?: number; // how long that work visibly takes
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
  rps: number;
  mechanics: LevelMechanics;
  action: ClientAction;
  seat: string;
  rrCursor: number;
  warmCaches: string[];
}

export const BOB_USER_ID = 42;
export const BOB_SID = '8f3a';
const TIMEOUT_MS = 10_000;
const SIDE_EFFECT_MS = 3_200; // PDF 1.8 s + email 1.4 s
const SLOW_SHARD_ROWS = 100_000_000; // past this the index no longer fits in RAM
const SLOW_WRITE_MS = 2_400;

// ── graph helpers shared by the engine and the metrics ──────────────────────
export const graph = (nodes: CanvasNode[], wires: CanvasWire[]) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outWires = (id: string) => wires.filter((w) => w.sourceNodeId === id);
  const outTo = (id: string, type: CanvasNode['type']) =>
    outWires(id).filter((w) => byId.get(w.targetNodeId)?.type === type);
  return { byId, outWires, outTo };
};

export const instancesOf = (n: CanvasNode) => (n.data.instances as number) ?? 1;

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtRows = (n: number) => (n >= 1_000_000 ? `${Math.round(n / 1_000_000)} million` : fmt(n));

// Which servers receive Bob's traffic: everything behind the balancer, or the one server he's wired to
export function trafficTargets(nodes: CanvasNode[], wires: CanvasWire[]) {
  const { byId, outWires, outTo } = graph(nodes, wires);
  const browser = nodes.find((n) => n.type === 'browser');
  const bw = browser ? outWires(browser.id)[0] : undefined;
  const entry = bw ? byId.get(bw.targetNodeId) : undefined;
  if (!entry) return { entry: undefined, backends: [] as CanvasNode[], browserWire: bw };
  if (entry.type === 'balancer') {
    const backends = outTo(entry.id, 'server').map((w) => byId.get(w.targetNodeId)!);
    return { entry, backends, browserWire: bw };
  }
  return { entry, backends: entry.type === 'server' ? [entry] : [], browserWire: bw };
}

// Connections PostgreSQL sees: direct ones from every instance, plus each pool's fixed size
export function dbConnections(db: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) {
  const { outWires } = graph(nodes, wires);
  const wiredTo = (n: CanvasNode) => outWires(n.id).some((w) => w.targetNodeId === db.id);
  const direct = nodes
    .filter((n) => n.type === 'server' && wiredTo(n))
    .reduce((s, n) => s + instancesOf(n) * ((n.data.connsPerInstance as number) ?? 30), 0);
  const pooled = nodes
    .filter((n) => n.type === 'pool' && wiredTo(n))
    .reduce((s, p) => s + ((p.data.poolSize as number) ?? 20), 0);
  return { direct, pooled, total: direct + pooled, max: (db.data.maxConnections as number) ?? 100 };
}

// Shards a server can reach, in a stable order (A, B, C…)
export function reachableShards(server: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) {
  const { byId, outTo } = graph(nodes, wires);
  return outTo(server.id, 'database')
    .map((w) => byId.get(w.targetNodeId)!)
    .filter((d) => d.data.shard)
    .sort((a, b) => String(a.data.shard).localeCompare(String(b.data.shard)));
}

export const totalRows = (nodes: CanvasNode[]) =>
  nodes.filter((n) => n.type === 'database').reduce((s, n) => s + ((n.data.rows as number) ?? 0), 0);

// Does this server sit behind a cache for the seat-count read?
const cacheFor = (server: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) => {
  const { byId, outTo } = graph(nodes, wires);
  const w = outTo(server.id, 'redis').find((x) => byId.get(x.targetNodeId)?.data.role === 'cache');
  return w ? { wire: w, node: byId.get(w.targetNodeId)! } : undefined;
};

// ── the request ────────────────────────────────────────────────────────────
export function simulateRequest(input: SimInput): SimResult {
  const { nodes, wires, rps, mechanics, action, seat, rrCursor, warmCaches } = input;
  const { byId, outWires, outTo } = graph(nodes, wires);
  const isRead = action === 'browse';
  const httpLabel = isRead ? 'GET /api/seats' : 'POST /api/orders';

  const hops: Hop[] = [];
  const inbound: CanvasWire[] = []; // HTTP path in; replies walk it backwards
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

  const finish = (
    status: number,
    statusText: string,
    title: string,
    detail: string,
    extra: Partial<SimResult> = {}
  ): SimResult => {
    if (inbound.length) reply(status, statusText, status >= 400);
    return { hops, status, statusText, title, detail, latencyMs: latency, nextRrCursor: next, ...extra };
  };

  // 1. Is anything plugged into Bob's computer?
  const { entry, browserWire } = trafficTargets(nodes, wires);
  if (!browserWire || !entry) {
    return {
      hops,
      status: 0,
      statusText: 'No connection',
      title: 'Can’t reach the server',
      detail:
        'Nothing is plugged into Bob’s computer, so the request never left it. Drag a wire from the round jack on the right edge of the monitor.',
      latencyMs: 0,
      nextRrCursor: next
    };
  }
  hops.push({
    wireId: browserWire.id,
    reverse: false,
    kind: 'http_req',
    label: httpLabel,
    trace: `Bob’s browser → ${entry.title}: ${httpLabel}${isRead ? '' : ` (seat ${seat})`}`,
    work: entry.type === 'balancer' ? 'choosing a server' : 'reading the request',
    holdMs: 300
  });
  inbound.push(browserWire);

  // 2. Which server handles it?
  let server: CanvasNode;
  let backends: CanvasNode[];
  if (entry.type === 'balancer') {
    const bw = outTo(entry.id, 'server');
    if (!bw.length) {
      latency += 1;
      return finish(
        502,
        'Bad Gateway',
        '502 Bad Gateway',
        'The load balancer received the request but has no servers wired behind it to forward it to.'
      );
    }
    const pick = bw[rrCursor % bw.length];
    next = rrCursor + 1;
    backends = bw.map((w) => byId.get(w.targetNodeId)!);
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
    backends = [entry];
  } else {
    return finish(0, 'No server', 'No server on this wire', `${entry.title} doesn’t answer browser requests.`);
  }

  // 3. Can the instances keep up? (Level 2's lesson, true in every level)
  const cap = mechanics.serverCapacityRps;
  const instances = backends.reduce((s, n) => s + instancesOf(n), 0);
  const perInstance = rps / instances;
  if (perInstance > cap) {
    const last = hops[hops.length - 1];
    last.work = `${fmt(Math.round(perInstance - cap))} more requests arrive than finish, every second`;
    last.holdMs = 1800;
    latency = TIMEOUT_MS;
    const detail =
      instances === 1
        ? `${server.title} can finish about ${cap} requests per second, but ${fmt(rps)} are arriving, so ${fmt(rps - cap)} more pile up every second. Bob’s request waited at the back of the pile for 10 s and the browser gave up.`
        : `${instances} instances × ${cap} = ${fmt(instances * cap)} requests per second of capacity, but ${fmt(rps)} are arriving. Each instance gets about ${fmt(Math.round(perInstance))}, more than it can finish, so requests pile up until they time out.`;
    return finish(504, 'Gateway Timeout', '504 Gateway Timeout', detail, { servedBy: server.id });
  }
  latency += 3;

  const notes: string[] = [];
  if (entry.type === 'balancer') notes.push(`The load balancer sent this request to ${server.title}.`);

  // 4. Does this server know who Bob is?
  if (mechanics.sessions) {
    const storeWire = outTo(server.id, 'redis').find((w) => byId.get(w.targetNodeId)?.data.role === 'session');
    const loginServers = nodes.filter(
      (n) => n.type === 'server' && ((n.data.localSessions as string[]) ?? []).includes('Bob')
    );
    const local = ((server.data.localSessions as string[]) ?? []).includes('Bob');
    let known = local;
    if (storeWire) {
      const store = byId.get(storeWire.targetNodeId)!;
      known = loginServers.some((ls) => outWires(ls.id).some((w) => w.targetNodeId === store.id));
      hops.push({
        wireId: storeWire.id,
        reverse: false,
        kind: 'redis',
        label: `GET session:${BOB_SID}`,
        trace: `${server.title} → Redis: GET session:${BOB_SID} (whose cookie is this?)`,
        work: 'looking up the key',
        holdMs: 200
      });
      hops.push({
        wireId: storeWire.id,
        reverse: true,
        kind: 'redis',
        label: known ? '"Bob"' : '(nil)',
        trace: `Redis → ${server.title}: ${known ? '"Bob"' : '(nil): no such key'}`,
        isError: !known,
        work: known ? 'Bob is logged in' : 'unknown session',
        holdMs: 250
      });
      latency += 1;
    } else {
      hops[hops.length - 1].work = `looking up session ${BOB_SID} in its own memory`;
      hops[hops.length - 1].holdMs = 600;
    }
    if (!known) {
      const who = loginServers.map((n) => n.title).join(', ') || 'another server';
      const detail = storeWire
        ? `${server.title} asked Redis for session ${BOB_SID} and got nothing back. ${who} created that session but isn’t wired to Redis, so it still only exists in ${who}’s own memory.`
        : `${server.title} looked up session ${BOB_SID} in its own memory and found nothing. Bob logged in on ${who}, and only ${who} remembers him.`;
      return finish(401, 'Unauthorized', '401 Unauthorized', detail, { servedBy: server.id });
    }
    notes.push(storeWire ? `${server.title} found session ${BOB_SID} in Redis: it’s Bob.` : `${server.title} found Bob’s session in its own memory.`);
  }

  // 5. Reads may be answered by the cache without touching the database
  const cache = cacheFor(server, nodes, wires);
  let cacheMiss = false;
  if (isRead && cache) {
    const warm = warmCaches.includes(cache.node.id);
    hops.push({
      wireId: cache.wire.id,
      reverse: false,
      kind: 'redis',
      label: 'GET seats:free',
      trace: `${server.title} → Redis cache: GET seats:free`,
      work: 'looking up the key',
      holdMs: 200
    });
    hops.push({
      wireId: cache.wire.id,
      reverse: true,
      kind: 'redis',
      label: warm ? 'HIT 1,204' : 'MISS',
      trace: `Redis cache → ${server.title}: ${warm ? 'hit, "1204"' : 'miss, (nil): nothing stored yet'}`,
      work: warm ? undefined : 'will ask PostgreSQL',
      holdMs: warm ? 0 : 250
    });
    latency += 1;
    if (warm) {
      notes.push('Cache hit: Redis already had seats:free, so PostgreSQL wasn’t asked at all.');
      return finish(200, 'OK', 'Seat map loaded', notes.join(' '), { servedBy: server.id });
    }
    cacheMiss = true;
  }

  // 6. Find a way to the database: direct, through a pool, or to the right shard
  type Route = { wires: CanvasWire[]; db: CanvasNode; pool?: CanvasNode };
  const routes: Route[] = [];
  outWires(server.id).forEach((w) => {
    const t = byId.get(w.targetNodeId);
    if (t?.type === 'database') routes.push({ wires: [w], db: t });
    if (t?.type === 'pool')
      outTo(t.id, 'database').forEach((w2) => routes.push({ wires: [w, w2], db: byId.get(w2.targetNodeId)!, pool: t }));
  });
  if (!routes.length) {
    hops[hops.length - 1].work = 'no database to talk to';
    return finish(
      500,
      'Internal Server Error',
      '500 Internal Server Error',
      `${server.title} got the request but has no database wired to it, so there is nowhere to ${isRead ? 'read the seats from' : 'save the booking'}. 500 means the server failed, not Bob.`,
      { servedBy: server.id }
    );
  }

  let route = routes[0];
  let shardNote = '';
  let writeMs = 4;
  if (mechanics.sharding) {
    const shards = reachableShards(server, nodes, wires);
    if (shards.length) {
      const idx = BOB_USER_ID % shards.length;
      const target = shards[idx];
      route = routes.find((r) => r.db.id === target.id) ?? route;
      const rowsPer = totalRows(nodes) / shards.length;
      const slow = rowsPer > SLOW_SHARD_ROWS;
      writeMs = slow ? SLOW_WRITE_MS : 9;
      shardNote = `${BOB_USER_ID} % ${shards.length} = ${idx} → ${target.title}, which holds ${fmtRows(rowsPer)} rows${
        slow ? ': too many for its index to fit in RAM, so the write read index pages from disk' : ''
      }.`;
    }
  }

  const sqlShort = isRead ? 'SELECT count(*)' : 'INSERT booking';
  const sqlFull = isRead
    ? "SELECT count(*) FROM seats WHERE status = 'free'"
    : `INSERT INTO bookings (user_id, seat) VALUES (${BOB_USER_ID}, '${seat}')`;
  const queryHops = (dbWork: string, dbHold: number) =>
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
        holdMs: last ? dbHold : 200
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
        `PostgreSQL allows ${c.max} connections. ${c.direct ? `Instances opening their own: ${c.direct}. ` : ''}${
          c.pooled ? `PgBouncer: ${c.pooled}. ` : ''
        }That’s ${c.total}, so connection ${c.max + 1} was refused with “FATAL: sorry, too many clients already”.`,
        { servedBy: server.id }
      );
    }
    if (route.pool) notes.push(`Borrowed one of PgBouncer’s ${route.pool.data.poolSize ?? 20} open connections for the query.`);
  }

  // 8. Too many reads for the database (Level 6)
  if (mechanics.readHeavy) {
    const cap = (route.db.data.queryCapacity as number) ?? 800;
    const cachedEverywhere = backends.every((b) => cacheFor(b, nodes, wires));
    const load = cachedEverywhere ? Math.ceil(rps / 1000) : rps;
    if (load > cap) {
      queryHops(`${fmt(load)} queries/s arriving, finishes ${fmt(cap)}`, 1800);
      latency = TIMEOUT_MS;
      return finish(
        504,
        'Gateway Timeout',
        '504 Gateway Timeout',
        `Every page view runs SELECT count(*) on PostgreSQL: ${fmt(load)} times a second. It can finish about ${fmt(cap)}, so queries wait their turn and Bob’s ${isRead ? 'refresh' : 'booking'} timed out behind them.`,
        { servedBy: server.id }
      );
    }
  }

  // 9. The query itself
  queryHops(isRead ? 'counting free seats' : writeMs > 100 ? 'writing… index is on disk' : 'writing the row to disk', writeMs > 100 ? 2000 : 350);
  answerHops(isRead ? 'count = 1,204' : 'INSERT 0 1', isRead ? 'count = 1204' : 'INSERT 0 1 (one row saved)', false);
  latency += isRead ? 12 : writeMs;
  notes.push(isRead ? `${server.title} counted the free seats in PostgreSQL.` : `${server.title} saved the booking in PostgreSQL.`);
  if (shardNote) notes.push(shardNote);

  let warmedCache: string | undefined;
  if (cacheMiss && cache) {
    hops.push({
      wireId: cache.wire.id,
      reverse: false,
      kind: 'redis',
      label: 'SET seats:free EX 5',
      trace: `${server.title} → Redis cache: SET seats:free 1204 EX 5 (keep the copy for 5 s)`,
      work: 'storing the copy',
      holdMs: 150
    });
    warmedCache = cache.node.id;
    latency += 1;
    notes.push('Cache miss: counted once on PostgreSQL and stored the answer in Redis for 5 s (TTL). Refresh again for a hit.');
  }

  // 10. After the booking: the slow extras (Level 7)
  let email: SimResult['email'];
  let queuedOn: string | undefined;
  if (!isRead && mechanics.slowSideEffects) {
    const qw = outTo(server.id, 'queue')[0];
    if (qw) {
      hops.push({
        wireId: qw.id,
        reverse: false,
        kind: 'job',
        label: 'add send-ticket',
        trace: `${server.title} → job queue: add “send ticket to user ${BOB_USER_ID}, seat ${seat}”`,
        work: 'job stored',
        holdMs: 200
      });
      latency += 2;
      email = 'queued';
      queuedOn = byId.get(qw.targetNodeId)!.id;
      notes.push('Then it added “send ticket email” to the job queue and answered straight away; a worker sends the email a moment later.');
    } else {
      const last = hops[hops.length - 1];
      last.work = 'rendering PDF (1.8 s), then emailing (1.4 s)…';
      last.holdMs = SIDE_EFFECT_MS;
      latency += SIDE_EFFECT_MS;
      email = 'sync';
      notes.push('Then it rendered the PDF (1.8 s) and sent the email (1.4 s) before answering. Bob waited for all of it.');
    }
  }

  return finish(200, 'OK', isRead ? 'Seat map loaded' : `Seat ${seat} is yours`, notes.join(' '), {
    servedBy: server.id,
    warmedCache,
    queuedOn,
    email
  });
}

// ── live numbers drawn on the cards ─────────────────────────────────────────
export interface NodeMetrics {
  cpu?: number;
  rpsIn?: number;
  overloaded?: boolean;
  nextBackend?: string;
  backends?: number;
  connections?: number;
  maxConnections?: number;
  queryLoad?: number;
  queryCapacity?: number;
  rows?: number;
  sessionsHeld?: string[];
}

export function deriveMetrics(
  nodes: CanvasNode[],
  wires: CanvasWire[],
  rps: number,
  mechanics: LevelMechanics,
  rrCursor: number,
  tick: number
): Record<string, NodeMetrics> {
  const { byId, outWires, outTo } = graph(nodes, wires);
  const out: Record<string, NodeMetrics> = {};
  const { entry, backends } = trafficTargets(nodes, wires);
  const instances = backends.reduce((s, n) => s + instancesOf(n), 0) || 1;
  const perInstance = rps / instances;
  const cap = mechanics.serverCapacityRps;
  const wobble = (id: string) => ((tick + id.length * 7) % 5) - 2; // small deterministic jitter

  for (const n of nodes) {
    const m: NodeMetrics = {};
    if (n.type === 'server') {
      const live = backends.some((b) => b.id === n.id);
      m.rpsIn = live ? Math.round(perInstance * instancesOf(n)) : 0;
      m.overloaded = live && perInstance > cap;
      m.cpu = !live ? 0 : m.overloaded ? 100 : Math.max(2, Math.min(97, Math.round((perInstance / cap) * 88) + wobble(n.id)));
    }
    if (n.type === 'balancer') {
      const bw = outTo(n.id, 'server');
      m.backends = bw.length;
      m.nextBackend = bw.length ? byId.get(bw[rrCursor % bw.length].targetNodeId)?.title : undefined;
      m.rpsIn = entry?.id === n.id ? rps : 0;
    }
    if (n.type === 'database') {
      const c = dbConnections(n, nodes, wires);
      m.connections = c.total;
      m.maxConnections = c.max;
      if (mechanics.readHeavy) {
        const readers = nodes.filter((s) => s.type === 'server' && (outWires(s.id).some((w) => w.targetNodeId === n.id) || outTo(s.id, 'pool').some((pw) => outWires(pw.targetNodeId).some((w) => w.targetNodeId === n.id))));
        const cached = readers.length > 0 && readers.every((s) => cacheFor(s, nodes, wires));
        m.queryLoad = readers.length ? (cached ? Math.ceil(rps / 1000) : rps) : 0;
        m.queryCapacity = (n.data.queryCapacity as number) ?? 800;
      }
      if (mechanics.sharding && n.data.shard) {
        const fleet = nodes.find((s) => s.type === 'server');
        const shards = fleet ? reachableShards(fleet, nodes, wires) : [];
        const wired = shards.some((s) => s.id === n.id);
        m.rows = wired ? Math.round(totalRows(nodes) / shards.length) : 0;
      } else {
        m.rows = n.data.rows as number | undefined;
      }
    }
    if (n.type === 'redis' && n.data.role === 'session') {
      const writers = nodes.filter(
        (s) => s.type === 'server' && ((s.data.localSessions as string[]) ?? []).includes('Bob') && outWires(s.id).some((w) => w.targetNodeId === n.id)
      );
      m.sessionsHeld = writers.length ? [`session:${BOB_SID} → Bob`] : [];
    }
    out[n.id] = m;
  }
  return out;
}
