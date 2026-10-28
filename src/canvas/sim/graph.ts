// Read-only questions about the wiring, shared by the request engine and the flow model.

import { CanvasNode, CanvasWire } from '../types';

export const graph = (nodes: CanvasNode[], wires: CanvasWire[]) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outWires = (id: string) => wires.filter((w) => w.sourceNodeId === id);
  const outTo = (id: string, type: CanvasNode['type']) => outWires(id).filter((w) => byId.get(w.targetNodeId)?.type === type);
  return { byId, outWires, outTo };
};

export const instancesOf = (n: CanvasNode) => (n.data.instances as number) ?? 1;

// Where the browser's traffic lands: every server behind the balancer, or the one server it's plugged into
export function trafficTargets(nodes: CanvasNode[], wires: CanvasWire[]) {
  const { byId, outWires, outTo } = graph(nodes, wires);
  const browser = nodes.find((n) => n.type === 'browser');
  const browserWire = browser ? outWires(browser.id)[0] : undefined;
  const entry = browserWire ? byId.get(browserWire.targetNodeId) : undefined;
  if (!entry) return { entry: undefined, backends: [] as CanvasNode[], browserWire };
  if (entry.type === 'balancer') {
    const backends = outTo(entry.id, 'server').map((w) => byId.get(w.targetNodeId)!);
    return { entry, backends, browserWire };
  }
  return { entry, backends: entry.type === 'server' ? [entry] : [], browserWire };
}

// Connections PostgreSQL sees: direct ones from every instance, plus each pool's fixed size
export function dbConnections(db: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) {
  const { outWires } = graph(nodes, wires);
  const wiredTo = (n: CanvasNode) => outWires(n.id).some((w) => w.targetNodeId === db.id);
  const direct = nodes
    .filter((n) => n.type === 'server' && wiredTo(n))
    .reduce((s, n) => s + instancesOf(n) * ((n.data.connsPerInstance as number) ?? 30), 0);
  const pooled = nodes.filter((n) => n.type === 'pool' && wiredTo(n)).reduce((s, p) => s + ((p.data.poolSize as number) ?? 20), 0);
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

export const cacheFor = (server: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) => {
  const { byId, outTo } = graph(nodes, wires);
  const w = outTo(server.id, 'redis').find((x) => byId.get(x.targetNodeId)?.data.role === 'cache');
  return w ? { wire: w, node: byId.get(w.targetNodeId)! } : undefined;
};

// Databases a server sends queries to, directly or through a pool
export function dbRoutes(server: CanvasNode, nodes: CanvasNode[], wires: CanvasWire[]) {
  const { byId, outWires, outTo } = graph(nodes, wires);
  const routes: { wires: CanvasWire[]; db: CanvasNode; pool?: CanvasNode }[] = [];
  outWires(server.id).forEach((w) => {
    const t = byId.get(w.targetNodeId);
    if (t?.type === 'database') routes.push({ wires: [w], db: t });
    if (t?.type === 'pool') outTo(t.id, 'database').forEach((w2) => routes.push({ wires: [w, w2], db: byId.get(w2.targetNodeId)!, pool: t }));
  });
  return routes;
}
