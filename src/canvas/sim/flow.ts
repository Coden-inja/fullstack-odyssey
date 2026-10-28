// The crowd, modelled as totals over time (a fluid queue model), not as
// thousands of individual requests. Every server — and the database when reads
// matter — is a waiting line:
//
//   arrivals λ (req/s) ──► [ backlog B ] ──► finishes at most μ = capacity (req/s)
//
//   B(t + dt) = clamp(B + (λ − μ)·dt, 0, μ·T)
//
// The cap μ·T is where the timeout bites: anyone further back than T seconds of
// work gives up, so at saturation λ − μ requests per second time out. One
// person's wait is W = B / μ (Little's Law: L = λW, read the other way round).

import { CanvasNode, CanvasWire, LevelMechanics } from '../types';
import { cacheFor, dbRoutes, graph, instancesOf, reachableShards, trafficTargets } from './graph';

export const TIMEOUT_S = 10; // the browser gives up after this many (simulated) seconds
export const TIME_SCALE = 5; // simulated seconds per real second: the "×5" on the clock

export interface FlowState {
  t: number; // simulated seconds since the level started
  backlog: Record<string, number>; // requests waiting in front of each node
  arriving: Record<string, number>; // λ per node, req/s
  capacity: Record<string, number>; // μ per node, req/s
  served: Record<string, number>; // completions per second per node
  gaveUp: Record<string, number>; // timeouts per second per node
  link: Record<string, number>; // req/s along each wire, for the moving dots
}

export const emptyFlow = (): FlowState => ({ t: 0, backlog: {}, arriving: {}, capacity: {}, served: {}, gaveUp: {}, link: {} });

const queueStep = (B: number, lambda: number, mu: number, dt: number) => {
  const max = mu * TIMEOUT_S;
  const next = Math.min(max, Math.max(0, B + (lambda - mu) * dt));
  const saturated = next >= max - 1e-6 && lambda > mu;
  const served = next > 0 || lambda > mu ? mu : lambda;
  return { B: next, served, gaveUp: saturated ? lambda - mu : 0 };
};

export function stepFlow(
  prev: FlowState,
  nodes: CanvasNode[],
  wires: CanvasWire[],
  rps: number,
  mech: LevelMechanics,
  dt: number // simulated seconds
): FlowState {
  const { byId, outWires } = graph(nodes, wires);
  const s: FlowState = { ...emptyFlow(), t: prev.t + dt };
  const { entry, backends, browserWire } = trafficTargets(nodes, wires);
  const inst = backends.reduce((a, n) => a + instancesOf(n), 0);
  const add = (rec: Record<string, number>, id: string, v: number) => (rec[id] = (rec[id] ?? 0) + v);

  if (browserWire) s.link[browserWire.id] = rps;

  // 1. servers
  for (const server of backends) {
    const lambda = inst ? (rps * instancesOf(server)) / inst : 0;
    const mu = mech.serverCapacityRps * instancesOf(server);
    const q = queueStep(prev.backlog[server.id] ?? 0, lambda, mu, dt);
    s.backlog[server.id] = q.B;
    s.arriving[server.id] = lambda;
    s.capacity[server.id] = mu;
    s.served[server.id] = q.served;
    s.gaveUp[server.id] = q.gaveUp;
    if (entry?.type === 'balancer') {
      const w = outWires(entry.id).find((x) => x.targetNodeId === server.id);
      if (w) s.link[w.id] = lambda;
    }
  }
  if (entry?.type === 'balancer') {
    s.arriving[entry.id] = rps;
    s.served[entry.id] = rps;
  }

  // 2. what each server sends onwards, per finished request
  const dbLoad: Record<string, number> = {};
  for (const server of backends) {
    const out = s.served[server.id];
    const cached = cacheFor(server, nodes, wires);
    const reads = mech.readHeavy ? (cached ? out / 1000 : out) : out; // with a cache, only misses reach the database
    for (const w of outWires(server.id)) {
      const t = byId.get(w.targetNodeId);
      if (!t) continue;
      if (t.type === 'redis') s.link[w.id] = out;
      if (t.type === 'queue') s.link[w.id] = out * 0.2;
    }
    if (mech.sharding) {
      const shards = reachableShards(server, nodes, wires);
      for (const sh of shards) {
        const w = outWires(server.id).find((x) => x.targetNodeId === sh.id);
        if (w) s.link[w.id] = out / shards.length;
        add(dbLoad, sh.id, out / shards.length);
      }
    } else {
      for (const r of dbRoutes(server, nodes, wires)) {
        r.wires.forEach((w) => add(s.link, w.id, reads));
        add(dbLoad, r.db.id, reads);
      }
    }
  }

  // 3. the database: a waiting line too, but only when reads are the lesson (Level 6)
  for (const db of nodes.filter((n) => n.type === 'database')) {
    const lambda = dbLoad[db.id] ?? 0;
    s.arriving[db.id] = lambda;
    if (mech.readHeavy) {
      const mu = (db.data.queryCapacity as number) ?? 800;
      const q = queueStep(prev.backlog[db.id] ?? 0, lambda, mu, dt);
      s.backlog[db.id] = q.B;
      s.capacity[db.id] = mu;
      s.served[db.id] = q.served;
      s.gaveUp[db.id] = q.gaveUp;
    } else {
      s.served[db.id] = lambda;
    }
  }
  return s;
}

// How long a request arriving now would wait at `nodeId`, in simulated seconds
export const waitAt = (f: FlowState, nodeId: string) => {
  const mu = f.capacity[nodeId];
  return mu ? (f.backlog[nodeId] ?? 0) / mu : 0;
};

// The crowd's totals, for the strip above the monitor
export function crowdTotals(f: FlowState, nodes: CanvasNode[], wires: CanvasWire[], rps: number) {
  const { backends } = trafficTargets(nodes, wires);
  const sum = (rec: Record<string, number>, ids: string[]) => ids.reduce((a, id) => a + (rec[id] ?? 0), 0);
  const ids = backends.map((b) => b.id);
  const dbs = nodes.filter((n) => n.type === 'database').map((n) => n.id);
  const waiting = sum(f.backlog, ids) + sum(f.backlog, dbs);
  const gaveUp = Math.max(sum(f.gaveUp, ids), 0) + sum(f.gaveUp, dbs);
  const reached = backends.length > 0;
  return {
    arriving: rps,
    waiting,
    gaveUp: reached ? Math.min(rps, gaveUp) : rps,
    booked: reached ? Math.max(0, Math.min(rps, sum(f.served, ids)) - sum(f.gaveUp, dbs)) : 0,
    wait: reached ? Math.max(...ids.map((id) => waitAt(f, id)), ...dbs.map((id) => waitAt(f, id)), 0) : 0
  };
}
