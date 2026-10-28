import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Scan,
  Server,
  Zap,
  Cable,
  ListTodo,
  Moon,
  Sun,
  X,
  AlertCircle,
  CheckCircle2,
  Circle,
  Info,
  Lightbulb,
  Wand2,
  ArrowRight,
  BookOpen,
  Sparkles,
  EyeOff,
  ChevronDown,
  ExternalLink,
  Check,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { CanvasNode, CanvasWire, ClientAction, LevelGoal, NodeType, SolutionStep, WirePacket } from './types';
import { CANVAS_CURRICULUM } from './data/curriculum';
import { CONCEPTS, conceptById, conceptsUpTo } from './data/concepts';
import { makeNode } from './data/nodeFactory';
import { Hop, SimResult, deriveMetrics, simulateRequest } from './sim/engine';
import { FlowState, TIME_SCALE, TIMEOUT_S, crowdTotals, emptyFlow, stepFlow } from './sim/flow';
import { BERTHS_TAKEN, PERSONA, TRIP, inr } from './data/story';
import { validateSystemWire } from './utils/wireValidation';
import { generateSource } from './utils/codegen';
import { lintCurriculum } from './utils/conceptLint';
import { NodeRenderer, QueueState } from './components/NodeRenderer';
import { AvatarState, BrowserMonitor, ClientState, CrowdView, initialClient } from './components/BrowserMonitor';
import { WireRenderer } from './components/WireRenderer';
import { NodeInspector } from './components/NodeInspector';
import { QuizModal } from './components/QuizModal';
import { GuidedHandHint, ScreenPoint } from './components/GuidedHandHint';
import { RequestTrace } from './components/RequestTrace';
import { LevelComplete } from './components/LevelComplete';
import { ConceptText } from './components/ConceptText';

// Dev-only: every string of level N is checked for words introduced after level N
if ((import.meta as any).env?.DEV) {
  for (const r of lintCurriculum(CANVAS_CURRICULUM)) {
    console.warn(`[concept-lint] Level ${r.level} uses “${r.match}” (introduced in Level ${r.introducedIn}): …${r.context}…`);
  }
  (window as any).__odysseyConcepts = CONCEPTS;
}

// How long one hop is on screen. Every hop is: packet travels the wire, then the
// receiving node shows what it's doing. 'step' additionally waits for "Next step".
const TRACE_RESERVE = 230; // px kept free under the nodes for the request-trace panel (see .trace in workbench.css)

type Speed = 'step' | 'slow' | 'normal';
const PACE: Record<Speed, { travel: number; minHold: number }> = {
  step: { travel: 1100, minHold: 700 },
  slow: { travel: 1500, minHold: 1100 },
  normal: { travel: 900, minHold: 500 }
};

interface Run {
  id: number;
  action: ClientAction;
  berth: string;
  rps: number;
  hops: Hop[];
  idx: number; // hop on screen now
  segStart: number; // when that hop started travelling
  waiting: boolean; // step mode: finished this hop, waiting for "Next step"
  startedAt: number;
  result: SimResult;
  netId: number;
}

interface Outcome {
  action: ClientAction;
  status: number;
  latencyMs: number;
  servedBy?: string;
  rps: number;
}

type Toast = { type: 'error' | 'success' | 'info'; title: string; message?: string } | null;

const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode: progress just isn't remembered */
    }
  }
};

// Hardware the player may add, unlocked by the level that teaches it
const DOCK: { type: NodeType; label: string; icon: React.ReactNode; from: number }[] = [
  { type: 'server', label: 'Server', icon: <Server size={13} />, from: 3 },
  { type: 'redis', label: 'Redis', icon: <Zap size={13} />, from: 4 },
  { type: 'pool', label: 'PgBouncer', icon: <Cable size={13} />, from: 5 },
  { type: 'queue', label: 'Job queue', icon: <ListTodo size={13} />, from: 7 }
];

let runCounter = 0;
let netCounter = 0;

export const CanvasWorkbench: React.FC = () => {
  const [actIndex, setActIndex] = useState<number>(() =>
    Math.min(CANVAS_CURRICULUM.length - 1, Math.max(0, store.get('odyssey_level', 0)))
  );
  const level = CANVAS_CURRICULUM[actIndex];
  const mech = level.mechanics;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => store.get('odyssey_theme', 'light'));
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 60 });
  const [nodes, setNodes] = useState<CanvasNode[]>(level.initialNodes);
  const [wires, setWires] = useState<CanvasWire[]>(level.initialWires);
  const [rps, setRps] = useState(level.simulatedTrafficRps);
  const [pendingWire, setPendingWire] = useState<{
    sourceNodeId: string;
    sourcePortId: string;
    isOutput: boolean;
    currentMousePos: { x: number; y: number };
  } | null>(null);
  const [codeNodeId, setCodeNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [rr, setRr] = useState(0);
  const [warmCaches, setWarmCaches] = useState<string[]>([]);
  const [client, setClient] = useState<ClientState>(initialClient);
  const [run, setRun] = useState<Run | null>(null);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const [queue, setQueue] = useState<QueueState>({ depth: 0, sent: 0, working: false });
  const [passed, setPassed] = useState<number[]>(() => store.get('odyssey_passed', []));
  const [quizPassed, setQuizPassed] = useState<number[]>(() => store.get('odyssey_quiz', []));
  const [celebrate, setCelebrate] = useState(false); // the recap modal: only ever opened by the player
  const [cleared, setCleared] = useState(0); // >0: show the in-canvas burst + ribbon (value = key)
  const [hintMode, setHintMode] = useState<'hint' | 'autosolve' | null>(null);
  const [speed, setSpeed] = useState<Speed>(() => store.get('odyssey_speed', 'slow'));
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [justConnected, setJustConnected] = useState<string | null>(null);
  const [flashGoals, setFlashGoals] = useState<number[]>([]);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [flow, setFlow] = useState<FlowState>(emptyFlow);
  const [crowd, setCrowd] = useState<CrowdView>({ avatars: [], arriving: 0, waiting: 0, booked: 0, gaveUp: 0 });
  const [fitNonce, setFitNonce] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // ── level lifecycle ──────────────────────────────────────────────────────
  const wasComplete = useRef(false);
  const prevGoals = useRef<boolean[]>([]);

  const loadLevel = useCallback((idx: number) => {
    const L = CANVAS_CURRICULUM[idx];
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setNodes(L.initialNodes);
    setWires(L.initialWires);
    setRps(L.simulatedTrafficRps);
    setOutcomes([]);
    setRr(0);
    setWarmCaches([]);
    setClient(initialClient());
    setRun(null);
    setLastRun(null);
    setQueue({ depth: 0, sent: 0, working: false });
    setCelebrate(false);
    setCleared(0);
    setHintMode(null);
    setCodeNodeId(null);
    setPendingWire(null);
    setToast(null);
    setOpenConcept(null);
    wasComplete.current = false;
    prevGoals.current = [];
    flowRef.current = emptyFlow();
    avatarsRef.current = [];
    setFlow(flowRef.current);
    setFitNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    loadLevel(actIndex);
    store.set('odyssey_level', actIndex);
  }, [actIndex, loadLevel]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── the crowd: a fluid model stepped every 100 ms (×TIME_SCALE simulated) ──
  const flowRef = useRef<FlowState>(emptyFlow());
  const avatarsRef = useRef<{ s: AvatarState; until: number; pending?: AvatarState }[]>([]);
  const live = useRef({ nodes, wires, rps, mech, rr, warmCaches });
  live.current = { nodes, wires, rps, mech, rr, warmCaches };

  useEffect(() => {
    const TICK_S = 0.1;
    const t = setInterval(() => {
      const L = live.current;
      const next = stepFlow(flowRef.current, L.nodes, L.wires, L.rps, L.mech, TICK_S * TIME_SCALE);
      flowRef.current = next;
      setFlow(next);

      // Faces: each one is a share of the traffic, living through what a new arrival would get right now
      const totals = crowdTotals(next, L.nodes, L.wires, L.rps);
      const probe = simulateRequest({ nodes: L.nodes, wires: L.wires, flow: next, mechanics: L.mech, action: 'buy', berth: '1', rrCursor: L.rr, warmCaches: L.warmCaches });
      const hardFail = probe.status === 0 || probe.status === 500 || probe.status === 502;
      const want = L.rps <= 1 ? 0 : Math.min(36, Math.ceil(L.rps / 15));
      const av = avatarsRef.current;
      while (av.length < want) av.push({ s: 'idle', until: next.t + Math.random() * 2 });
      av.length = want;
      for (const a of av) {
        if (next.t < a.until) continue;
        if (a.s === 'idle') {
          if (hardFail) {
            a.s = 'error';
            a.until = next.t + 3;
          } else {
            a.s = 'waiting';
            a.pending = totals.wait >= TIMEOUT_S - 0.05 ? 'gaveup' : 'booked';
            a.until = next.t + Math.max(0.6, Math.min(totals.wait, TIMEOUT_S));
          }
        } else if (a.s === 'waiting') {
          a.s = a.pending ?? 'booked';
          a.until = next.t + 3;
        } else {
          a.s = 'idle';
          a.until = next.t + 0.5 + Math.random() * 2.5;
        }
      }
      setCrowd({
        avatars: av.map((a) => a.s),
        arriving: totals.arriving,
        waiting: totals.waiting,
        booked: hardFail ? 0 : totals.booked,
        gaveUp: hardFail ? L.rps : totals.gaveUp
      });
    }, TICK_S * 1000);
    return () => clearInterval(t);
  }, []);

  // ── measured port positions (wire endpoints) ────────────────────────────
  const [portPositions, setPortPositions] = useState<Record<string, { x: number; y: number }>>({});
  useLayoutEffect(() => {
    const plane = planeRef.current;
    if (!plane || run) return; // nothing moves while a request is animating
    const planeRect = plane.getBoundingClientRect();
    const next: Record<string, { x: number; y: number }> = {};
    plane.querySelectorAll<HTMLElement>('[data-port-id]').forEach((el) => {
      const r = el.getBoundingClientRect();
      next[`${el.dataset.nodeId}:${el.dataset.portDir}:${el.dataset.portId}`] = {
        x: Math.round((r.left + r.width / 2 - planeRect.left) / zoom),
        y: Math.round((r.top + r.height / 2 - planeRect.top) / zoom)
      };
    });
    setPortPositions((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  });

  // ── fit every node into the visible canvas ──────────────────────────────
  useLayoutEffect(() => {
    const vp = canvasRef.current;
    const plane = planeRef.current;
    if (!vp || !plane || !fitNonce) return;
    const vr = vp.getBoundingClientRect();
    const boxes = [...plane.querySelectorAll<HTMLElement>('.canvas-node-wrapper')].map((el) => el.getBoundingClientRect());
    if (!boxes.length) return;
    const toCanvas = (x: number, y: number) => ({ x: (x - vr.left - pan.x) / zoom, y: (y - vr.top - pan.y) / zoom });
    const tl = boxes.map((b) => toCanvas(b.left, b.top));
    const br = boxes.map((b) => toCanvas(b.right, b.bottom));
    const minX = Math.min(...tl.map((p) => p.x)) - 30; // room for the left ports
    const minY = Math.min(...tl.map((p) => p.y)) - 40; // room for activity bubbles
    const maxX = Math.max(...br.map((p) => p.x)) + 30;
    const maxY = Math.max(...br.map((p) => p.y));
    // bottom: always keep the request-trace strip clear so it never covers a node
    const pad = { l: 24, r: 24, t: 64, b: TRACE_RESERVE };
    const availW = vr.width - pad.l - pad.r;
    const availH = vr.height - pad.t - pad.b;
    const z = Math.max(0.45, Math.min(1, availW / (maxX - minX), availH / (maxY - minY)));
    setZoom(z);
    setPan({
      x: pad.l + (availW - (maxX - minX) * z) / 2 - minX * z,
      y: pad.t + (availH - (maxY - minY) * z) / 2 - minY * z
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitNonce]);

  useEffect(() => {
    let t: number | undefined;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(() => setFitNonce((n) => n + 1), 150);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const metrics = useMemo(() => deriveMetrics(nodes, wires, flow, mech, rr), [nodes, wires, flow, mech, rr]);

  // ── one request, played strictly in order ───────────────────────────────
  const startRequest = (action: ClientAction) => {
    if (run) return;
    setHintMode((m) => (m === 'hint' ? null : m));
    const result = simulateRequest({ nodes, wires, flow: flowRef.current, mechanics: mech, action, berth: client.berth, rrCursor: rr, warmCaches });
    const t0 = performance.now();
    const netId = ++netCounter;
    setRr(result.nextRrCursor);
    setClient((c) => ({
      ...c,
      sending: { action, startedAt: t0 },
      network: [
        ...c.network,
        { id: netId, method: action === 'buy' ? 'POST' : 'GET', path: action === 'buy' ? '/api/bookings' : '/api/availability', status: null, ms: null }
      ].slice(-6)
    }));
    setNow(t0);
    setRun({ id: ++runCounter, action, berth: client.berth, rps, hops: result.hops, idx: 0, segStart: t0, waiting: false, startedAt: t0, result, netId });
  };

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const loop = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  const finishRun = (r: Run) => {
    const res = r.result;
    setRun(null);
    setLastRun(r);
    setOutcomes((o) => [...o, { action: r.action, status: res.status, latencyMs: res.latencyMs, servedBy: res.servedBy, rps: r.rps }]);
    const bookedOk = r.action === 'buy' && res.status === 200;
    setClient((c) => ({
      ...c,
      sending: null,
      last: { action: r.action, status: res.status, statusText: res.statusText, title: res.title, detail: res.detail, latencyMs: res.latencyMs },
      network: c.network.map((n) => (n.id === r.netId ? { ...n, status: res.status, ms: res.status === 0 ? null : res.latencyMs } : n)),
      booked: bookedOk ? [...c.booked, r.berth] : c.booked,
      available: bookedOk ? Math.max(0, c.available - 1) : c.available,
      berth: bookedOk ? nextFreeBerth([...c.booked, r.berth]) : c.berth,
      messages: res.email === 'sync' ? [...c.messages, { id: r.id, text: eTicketSms(r) }] : c.messages
    }));
    if (res.warmedCache) {
      const id = res.warmedCache;
      setWarmCaches((w) => [...new Set([...w, id])]);
      later(() => setWarmCaches((w) => w.filter((x) => x !== id)), 5000); // TTL 5 s
    }
    if (res.queuedOn) {
      setQueue((q) => ({ ...q, depth: q.depth + 1 }));
      later(() => setQueue((q) => ({ ...q, working: true })), 900);
      later(() => {
        setQueue((q) => ({ depth: Math.max(0, q.depth - 1), sent: q.sent + 1, working: false }));
        setClient((c) => ({ ...c, messages: [...c.messages, { id: r.id, text: `${eTicketSms(r)} (sent by the worker)` }] }));
      }, 900 + 3200);
    }
  };

  // auto-solve never sits waiting for a click that only a human would make
  const pace = PACE[speed === 'step' && hintMode === 'autosolve' ? 'slow' : speed];
  const holdFor = (h: Hop) => {
    const work = Math.max(h.holdMs ?? 0, pace.minHold);
    if (!h.queue) return work;
    const waitS = Math.min(h.queue.ahead / h.queue.rate, TIMEOUT_S);
    return Math.max(pace.minHold, (waitS * 1000) / TIME_SCALE) + (h.queue.timesOut ? 0 : work);
  };

  useEffect(() => {
    if (!run) return;
    if (!run.hops.length) {
      if (now - run.startedAt >= 450) finishRun(run);
      return;
    }
    if (run.waiting) return;
    if (now - run.segStart < pace.travel + holdFor(run.hops[run.idx])) return;
    if (run.idx === run.hops.length - 1) finishRun(run);
    else if (speed === 'step' && hintMode !== 'autosolve') setRun({ ...run, waiting: true });
    else setRun({ ...run, idx: run.idx + 1, segStart: now });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, run]);

  const nextStep = useCallback(() => {
    setRun((r) => (r && r.waiting ? { ...r, idx: r.idx + 1, segStart: performance.now(), waiting: false } : r));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && run?.waiting) {
        e.preventDefault();
        nextStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, nextStep]);

  // what's on screen right now: at most one packet, or one node "working"
  const activeIdx = run && run.hops.length ? run.idx : -1;
  const packets: WirePacket[] = [];
  let activity: { nodeId: string; text: string } | null = null;
  let activeWireId: string | null = null;
  if (run && activeIdx >= 0) {
    const hop = run.hops[activeIdx];
    const elapsed = now - run.segStart;
    const wire = wires.find((w) => w.id === hop.wireId);
    activeWireId = hop.wireId;
    if (elapsed < pace.travel && !run.waiting) {
      packets.push({
        id: `p${run.id}-${activeIdx}`,
        wireId: hop.wireId,
        sourceNodeId: '',
        targetNodeId: '',
        progress: (elapsed / pace.travel) * 100,
        kind: hop.kind,
        method: '',
        endpoint: '',
        label: hop.label,
        payload: {},
        latencyMs: 0,
        isReturn: hop.reverse,
        isError: hop.isError
      });
    } else if (wire) {
      const dest = hop.reverse ? wire.sourceNodeId : wire.targetNodeId;
      const heldS = ((elapsed - pace.travel) / 1000) * TIME_SCALE; // simulated seconds at this node
      let text = hop.work;
      if (hop.queue) {
        const waitS = Math.min(hop.queue.ahead / hop.queue.rate, TIMEOUT_S);
        if (heldS < waitS) text = `${PERSONA_NAME} is #${inr(Math.max(1, Math.ceil(hop.queue.ahead - hop.queue.rate * heldS)))} in line · ${heldS.toFixed(1)} s`;
        else text = hop.queue.timesOut ? `gave up after ${TIMEOUT_S} s in line` : hop.work ?? 'reading the request';
      }
      if (text) activity = { nodeId: dest, text };
    }
  }

  // ── goals ───────────────────────────────────────────────────────────────
  const typeOf = (id: string) => nodes.find((n) => n.id === id)?.type;
  const goalDone = (g: LevelGoal) => {
    switch (g.kind) {
      case 'wire':
        return wires.some((w) => w.sourceNodeId === g.from && w.targetNodeId === g.to);
      case 'noWire':
        return !wires.some((w) => typeOf(w.sourceNodeId) === g.fromType && typeOf(w.targetNodeId) === g.toType);
      case 'traffic':
        return rps >= g.minRps;
      case 'outcome':
        return outcomes.some(
          (o) =>
            o.action === g.action &&
            o.status === g.status &&
            (g.maxLatencyMs === undefined || o.latencyMs <= g.maxLatencyMs) &&
            (g.minRps === undefined || o.rps >= g.minRps) &&
            (!g.servedBy || o.servedBy === g.servedBy)
        );
    }
  };
  const goalStates = level.goals.map(goalDone);
  const doneCount = goalStates.filter(Boolean).length;
  const isComplete = doneCount === level.goals.length;

  const goalKey = goalStates.join(',');
  useEffect(() => {
    const newly = goalStates.map((d, i) => (d && prevGoals.current.length && !prevGoals.current[i] ? i : -1)).filter((i) => i >= 0);
    prevGoals.current = goalStates;
    if (newly.length) {
      setFlashGoals(newly);
      later(() => setFlashGoals([]), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalKey]);

  useEffect(() => {
    if (isComplete && !wasComplete.current && !run) {
      wasComplete.current = true;
      setHintMode(null);
      setPassed((p) => {
        const next = [...new Set([...p, actIndex])];
        store.set('odyssey_passed', next);
        return next;
      });
      // no modal here: let the player read the 200 OK and the trace they just earned
      setCleared(Date.now());
    }
    if (!isComplete) wasComplete.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, run]);

  // ── wiring ──────────────────────────────────────────────────────────────
  const toCanvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  };

  const flashWire = (id: string) => {
    setJustConnected(id);
    later(() => setJustConnected((x) => (x === id ? null : x)), 1300);
  };

  const connect = (sourceId: string, targetId: string) => {
    const src = nodes.find((n) => n.id === sourceId);
    const tgt = nodes.find((n) => n.id === targetId);
    if (!src || !tgt || src.id === tgt.id) return; // released on the same card: just a click
    const v = validateSystemWire(src, '', tgt, '');
    if (!v.valid) {
      setToast({ type: 'error', title: 'Can’t connect those', message: v.warning });
      return;
    }
    if (wires.some((w) => w.sourceNodeId === src.id && w.targetNodeId === tgt.id)) {
      setToast({ type: 'info', title: 'Already connected', message: `${src.title} → ${tgt.title} is already wired.` });
      return;
    }
    let next = wires;
    let note = '';
    if (src.type === 'browser') {
      const old = wires.find((w) => w.sourceNodeId === src.id);
      if (old) {
        next = wires.filter((w) => w !== old);
        note = ` ${PERSONA.name}’s computer has one network jack, so the cable came out of ${nodes.find((n) => n.id === old.targetNodeId)?.title}.`;
      }
    }
    const wire: CanvasWire = {
      id: `wire-${src.id}-${tgt.id}`,
      sourceNodeId: src.id,
      sourcePortId: src.ports.outputs[0] ?? 'out',
      targetNodeId: tgt.id,
      targetPortId: tgt.ports.inputs[0] ?? 'in',
      status: 'active'
    };
    setWires([...next, wire]);
    flashWire(wire.id);
    setToast({ type: 'success', title: `${src.title} → ${tgt.title}`, message: `Connected over ${v.protocol}.${note}` });
  };

  const disconnect = (wireId: string) => {
    const w = wires.find((x) => x.id === wireId);
    if (!w) return;
    setWires((prev) => prev.filter((x) => x.id !== wireId));
    setToast({
      type: 'info',
      title: 'Disconnected',
      message: `${nodes.find((n) => n.id === w.sourceNodeId)?.title} → ${nodes.find((n) => n.id === w.targetNodeId)?.title}`
    });
  };

  const handleStartWire = (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => {
    setPendingWire({ sourceNodeId: nodeId, sourcePortId: portId, isOutput, currentMousePos: toCanvasPoint(e.clientX, e.clientY) });
  };

  const handleEndWire = (targetNodeId: string) => {
    if (!pendingWire) return;
    const from = pendingWire.isOutput ? pendingWire.sourceNodeId : targetNodeId;
    const to = pendingWire.isOutput ? targetNodeId : pendingWire.sourceNodeId;
    setPendingWire(null);
    connect(from, to);
  };

  // ── pan / drag ──────────────────────────────────────────────────────────
  const panning = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef<{ id: string; mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panning.current) {
      setPan({ x: e.clientX - panning.current.x, y: e.clientY - panning.current.y });
      return;
    }
    const d = dragging.current;
    if (d) {
      const x = Math.round((d.nodeX + (e.clientX - d.mouseX) / zoom) / 10) * 10;
      const y = Math.round((d.nodeY + (e.clientY - d.mouseY) / zoom) / 10) * 10;
      setNodes((prev) => prev.map((n) => (n.id === d.id ? { ...n, position: { x, y } } : n)));
      return;
    }
    if (pendingWire) {
      const p = toCanvasPoint(e.clientX, e.clientY);
      setPendingWire((w) => (w ? { ...w, currentMousePos: p } : null));
    }
  };

  const handleMouseUp = () => {
    panning.current = null;
    dragging.current = null;
    if (pendingWire) setPendingWire(null); // released on empty canvas: cancel quietly
  };

  const zoomAround = (factor: number, cx?: number, cy?: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = cx ?? rect.width / 2;
    const py = cy ?? rect.height / 2;
    const z = Math.max(0.4, Math.min(1.6, zoom * factor));
    setPan({ x: px - ((px - pan.x) / zoom) * z, y: py - ((py - pan.y) / zoom) * z });
    setZoom(z);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setCodeNodeId(null);
      setHintMode(null);
      setPendingWire(null);
      setIsQuizOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── dock ────────────────────────────────────────────────────────────────
  const addNode = (type: NodeType) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const c = toCanvasPoint(rect.left + rect.width * 0.55, rect.top + rect.height * 0.35);
    const count = nodes.filter((n) => n.type === type).length + 1;
    const titles: Record<NodeType, string> = {
      browser: 'Browser',
      balancer: 'Load balancer',
      server: `Server ${count}`,
      redis: actIndex >= 5 ? 'Redis cache' : 'Redis sessions',
      database: `PostgreSQL ${count}`,
      queue: 'Job queue',
      pool: 'PgBouncer'
    };
    const data: Record<string, unknown> =
      type === 'redis' ? { role: actIndex >= 5 ? 'cache' : 'session' } : type === 'server' && mech.sessions ? { localSessions: [] } : {};
    const id = `node-${type}-${Date.now().toString(36)}`;
    setNodes((prev) => [...prev, makeNode(id, type, titles[type], Math.round(c.x), Math.round(c.y), data)]);
    setToast({ type: 'info', title: `Added ${titles[type]}`, message: 'Drag it anywhere, then wire it up.' });
  };

  // ── hints ───────────────────────────────────────────────────────────────
  const stepDone = (s: SolutionStep): boolean => {
    switch (s.kind) {
      case 'wire':
        return wires.some((w) => w.sourceNodeId === s.from && w.targetNodeId === s.to);
      case 'unwire':
        return !wires.some((w) => w.sourceNodeId === s.from && w.targetNodeId === s.to);
      case 'traffic': {
        const g = level.goals.find((x) => x.kind === 'traffic');
        return rps >= (g && g.kind === 'traffic' ? g.minRps : s.rps);
      }
      case 'click':
        return level.goals.filter((g) => g.kind === 'outcome' && g.action === s.action).every(goalDone);
    }
  };

  const locate = (s: SolutionStep): { from: ScreenPoint; to?: ScreenPoint } | null => {
    const vp = canvasRef.current;
    if (!vp) return null;
    const vr = vp.getBoundingClientRect();
    const port = (nodeId: string, dir: 'in' | 'out') => {
      const key = Object.keys(portPositions).find((k) => k.startsWith(`${nodeId}:${dir}:`));
      const p = key ? portPositions[key] : null;
      return p ? { x: p.x * zoom + pan.x, y: p.y * zoom + pan.y } : null;
    };
    const el = (sel: string) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2 - vr.left, y: r.top + r.height / 2 - vr.top } : null;
    };
    if (s.kind === 'wire') {
      const a = port(s.from, 'out');
      const b = port(s.to, 'in');
      return a && b ? { from: a, to: b } : null;
    }
    if (s.kind === 'unwire') {
      const a = port(s.from, 'out');
      const b = port(s.to, 'in');
      return a && b ? { from: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } } : null;
    }
    if (s.kind === 'traffic') {
      const p = el('.dock-slider');
      return p ? { from: { x: p.x - 40, y: p.y }, to: { x: p.x + 30, y: p.y } } : null;
    }
    const p = el(s.action === 'buy' ? '.bm-cta' : '.bm-refresh');
    return p ? { from: p } : null;
  };

  const applyStepImpl = (s: SolutionStep) => {
    if (s.kind === 'wire') connect(s.from, s.to);
    else if (s.kind === 'unwire') {
      const w = wires.find((x) => x.sourceNodeId === s.from && x.targetNodeId === s.to);
      if (w) disconnect(w.id);
    } else if (s.kind === 'traffic') setRps(s.rps);
    else startRequest(s.action);
  };
  // stable identity so the auto-solve timer isn't reset by every animation frame
  const applyRef = useRef(applyStepImpl);
  applyRef.current = applyStepImpl;
  const applyStep = useCallback((s: SolutionStep) => applyRef.current(s), []);
  const closeHint = useCallback(() => setHintMode(null), []);

  // ── derived bits for render ─────────────────────────────────────────────
  const codeNode = nodes.find((n) => n.id === codeNodeId) ?? null;
  const codeSource = codeNode ? generateSource(codeNode, nodes, wires, level) : null;
  const sliderMax = Math.max(600, Math.ceil((level.simulatedTrafficRps * 1.5) / 100) * 100);
  const traceRun = run ?? lastRun;
  const dotScale = niceScale(Math.max(0, ...Object.values(flow.link)) / 8);
  const outcomeLine = !run && lastRun ? `→ ${PERSONA.name} sees: ${lastRun.result.status === 0 ? 'no connection' : `${lastRun.result.status} ${lastRun.result.statusText}`}` : undefined;
  const allSoFar = conceptsUpTo(level.levelNumber);
  const fact = level.facts[0];

  return (
    <div
      className="wb"
      data-theme={theme}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="wb-banner">
        Build the backend of a Tatkal booking site, watch it break at 10:00 AM, then fix it. Grounded in <em>allahabadi.dev</em> &amp; <em>backendengineer.in</em>
      </div>

      <header className="wb-nav">
        <a className="wb-brand wb-home" href="/" title="All games">
          <ArrowLeft size={16} />
          <Compass size={18} />
          <span>All games</span>
        </a>

        <nav className="wb-levels" aria-label="Levels">
          {CANVAS_CURRICULUM.map((l, i) => (
            <button
              key={l.id}
              className={`wb-level ${i === actIndex ? 'is-current' : ''} ${passed.includes(i) ? 'is-passed' : ''}`}
              onClick={() => setActIndex(i)}
              title={`Level ${i + 1}: ${l.title}`}
            >
              {passed.includes(i) && i !== actIndex ? <Check size={12} /> : i + 1}
            </button>
          ))}
        </nav>

        <div className="wb-nav-end">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              setTheme((t) => {
                const n = t === 'light' ? 'dark' : 'light';
                store.set('odyssey_theme', n);
                return n;
              })
            }
            title="Switch light / dark"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => loadLevel(actIndex)} title="Start this level over">
            <RotateCcw size={14} /> Restart level
          </button>
        </div>
      </header>

      <div className="wb-body">
        {/* ── left: what to do and why ─────────────────────────────── */}
        <aside className="wb-side">
          <div className="side-eyebrow">
            Level {level.levelNumber} of {CANVAS_CURRICULUM.length}
            {quizPassed.includes(actIndex) && <span className="chip chip-ok"><Check size={11} /> quiz</span>}
          </div>
          <h1 className="side-title">{level.title}</h1>
          <p className="side-subtitle">{level.subtitle}</p>

          <div className="side-oneline">
            <ConceptText text={level.inOneLine} level={level.levelNumber} newIds={level.introduces} />
          </div>

          <section className={`side-goals ${isComplete ? 'is-complete' : ''}`}>
            <div className="side-section-head">
              <span>Your goals</span>
              <span className="side-progress">
                {doneCount}/{level.goals.length}
              </span>
            </div>
            <div className="goal-bar">
              <span style={{ width: `${(doneCount / level.goals.length) * 100}%` }} />
            </div>
            <ol className="goal-list">
              {level.goals.map((g, i) => (
                <li key={i} className={`goal ${goalStates[i] ? 'is-done' : ''} ${flashGoals.includes(i) ? 'is-flash' : ''}`}>
                  {goalStates[i] ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  <span>{g.label}</span>
                </li>
              ))}
            </ol>
            {isComplete ? (
              <button className="btn btn-primary btn-block" onClick={() => setCelebrate(true)}>
                <Sparkles size={14} /> Level cleared
                {actIndex < CANVAS_CURRICULUM.length - 1 && (
                  <>
                    {' '}
                    · next <ArrowRight size={14} />
                  </>
                )}
              </button>
            ) : (
              <div className="goal-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setHintMode((m) => (m === 'hint' ? null : 'hint'))}>
                  <Lightbulb size={13} /> {hintMode === 'hint' ? 'Hide hint' : 'Show me how'}
                </button>
                <button className="btn btn-quiet btn-sm" onClick={() => setHintMode('autosolve')}>
                  <Wand2 size={13} /> Solve it for me
                </button>
              </div>
            )}
          </section>

          <section className="side-story">
            <div className="side-section-head">
              <span>What’s going on</span>
            </div>
            <p>
              <ConceptText text={level.storyNarrative} level={level.levelNumber} newIds={level.introduces} />
            </p>
            {level.hiddenNote && (
              <p className="side-hidden">
                <EyeOff size={12} /> {level.hiddenNote}
              </p>
            )}
          </section>

          <section className="side-words">
            <div className="side-section-head">
              <span>New words</span>
              <span className="side-progress">{level.introduces.length}</span>
            </div>
            <div className="chips">
              {level.introduces.map((id) => {
                const c = conceptById(id)!;
                return (
                  <button key={id} className={`chip ${openConcept === id ? 'is-open' : ''}`} onClick={() => setOpenConcept((o) => (o === id ? null : id))}>
                    {c.term}
                  </button>
                );
              })}
            </div>
            {openConcept && <p className="word-def">{conceptById(openConcept)?.definition}</p>}
          </section>

          <section className="side-fact">
            <Sparkles size={13} />
            <p>{fact}</p>
          </section>

          <section className="side-check">
            <button className="btn btn-ghost btn-block" onClick={() => setIsQuizOpen(true)}>
              <BookOpen size={14} /> Check yourself: one question
            </button>
          </section>

          <section className="side-sources">
            <div className="side-section-head">
              <span>Sources</span>
            </div>
            <ul>
              {level.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      <b>{s.name}</b> · {s.title} <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span>
                      <b>{s.name}</b> · {s.title}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="side-glossary">
            <button className="side-section-head as-button" onClick={() => setGlossaryOpen((o) => !o)}>
              <span>All words so far</span>
              <span className="side-progress">
                {allSoFar.length} <ChevronDown size={12} className={glossaryOpen ? 'flip' : ''} />
              </span>
            </button>
            {glossaryOpen && (
              <dl>
                {allSoFar.map((c) => (
                  <div key={c.id}>
                    <dt>
                      {c.term} <span className="gl-level">L{c.level}</span>
                    </dt>
                    <dd>{c.definition}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </aside>

        {/* ── right: the system ──────────────────────────────────── */}
        <main
          className={`wb-canvas ${pendingWire ? 'is-wiring' : ''}`}
          ref={canvasRef}
          onMouseDown={(e) => {
            const t = e.target as Element;
            if (t === canvasRef.current || t === planeRef.current || t.tagName === 'svg') {
              panning.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            }
          }}
          onWheel={(e) => {
            // panels scroll their own content; only the canvas itself zooms
            if ((e.target as Element).closest('.trace, .inspector, .hint-card, .dock, .toast, .cleared-ribbon')) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            zoomAround(e.deltaY < 0 ? 1.08 : 1 / 1.08, e.clientX - rect.left, e.clientY - rect.top);
          }}
        >
          <div className="canvas-transform-plane" ref={planeRef} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <WireRenderer
              wires={wires}
              nodes={nodes}
              packets={packets}
              pendingWire={pendingWire}
              onDeleteWire={disconnect}
              portPositions={portPositions}
              justConnectedId={justConnected}
              activeWireId={activeWireId}
              flows={level.trafficControl ? flow.link : undefined}
              dotScale={dotScale}
            />
            {nodes.map((node) => (
              <div
                key={node.id}
                className="canvas-node-wrapper"
                style={{ left: node.position.x, top: node.position.y }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  dragging.current = { id: node.id, mouseX: e.clientX, mouseY: e.clientY, nodeX: node.position.x, nodeY: node.position.y };
                }}
              >
                {node.type === 'browser' ? (
                  <BrowserMonitor
                    node={node}
                    levelNumber={level.levelNumber}
                    mechanics={mech}
                    client={client}
                    crowd={level.trafficControl ? crowd : undefined}
                    now={now}
                    busyLabel={speed === 'step' && hintMode !== 'autosolve' && run ? `Step ${activeIdx + 1} of ${run.hops.length}: see the trace` : undefined}
                    isPendingWireActive={!!pendingWire}
                    onAction={startRequest}
                    onSelectBerth={(berth) => setClient((c) => ({ ...c, berth }))}
                    onStartWire={handleStartWire}
                    onEndWire={handleEndWire}
                    onOpenCode={setCodeNodeId}
                  />
                ) : (
                  <NodeRenderer
                    node={node}
                    levelNumber={level.levelNumber}
                    mechanics={mech}
                    metrics={metrics[node.id]}
                    activity={activity?.nodeId === node.id ? activity.text : undefined}
                    cacheWarm={warmCaches.includes(node.id)}
                    queue={node.type === 'queue' ? queue : undefined}
                    isPendingWireActive={!!pendingWire}
                    onStartWire={handleStartWire}
                    onEndWire={handleEndWire}
                    onOpenCode={setCodeNodeId}
                  />
                )}
              </div>
            ))}
            <WireRenderer wires={wires} nodes={nodes} packets={packets} pendingWire={null} portPositions={portPositions} layer="packets" />
          </div>

          <div className="dock" onMouseDown={(e) => e.stopPropagation()}>
            {level.trafficControl && (
              <div className="dock-group" title={`Simulated time runs ${TIME_SCALE}× faster than real time. Each moving dot on a wire is about ${inr(dotScale)} requests per second.`}>
                <Clock size={13} />
                <span className="dock-value">{clockText(flow.t)}</span>
                <span className="dock-label">×{TIME_SCALE}</span>
                <span className="dock-dot" /> <span className="dock-legend">= {inr(dotScale)} req/s</span>
              </div>
            )}
            <div className="dock-group" title="How fast a request plays out on the wires">
              <span className="dock-label">Speed</span>
              {(['step', 'slow', 'normal'] as Speed[]).map((sp) => (
                <button
                  key={sp}
                  className={`seg-btn ${speed === sp ? 'is-on' : ''}`}
                  onClick={() => {
                    setSpeed(sp);
                    store.set('odyssey_speed', sp);
                  }}
                >
                  {sp === 'step' ? 'Step' : sp === 'slow' ? 'Slow' : 'Normal'}
                </button>
              ))}
            </div>
            {level.trafficControl && (
              <label className="dock-group" title="How many requests per second arrive at the site">
                <span className="dock-label">Traffic</span>
                <input
                  type="range"
                  className="dock-slider"
                  min={10}
                  max={sliderMax}
                  step={10}
                  value={rps}
                  onChange={(e) => setRps(parseInt(e.target.value, 10))}
                />
                <span className="dock-value">{rps.toLocaleString('en-US')} req/s</span>
              </label>
            )}
            {DOCK.some((d) => level.levelNumber >= d.from) && (
              <div className="dock-group">
                <span className="dock-label">Add</span>
                {DOCK.filter((d) => level.levelNumber >= d.from).map((d) => (
                  <button key={d.type} className="btn btn-ghost btn-sm" onClick={() => addNode(d.type)} title={`Add a ${d.label}`}>
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>
            )}
            <div className="dock-group">
              <button className="icon-btn" onClick={() => zoomAround(1 / 1.15)} title="Zoom out">
                <ZoomOut size={14} />
              </button>
              <span className="dock-zoom">{Math.round(zoom * 100)}%</span>
              <button className="icon-btn" onClick={() => zoomAround(1.15)} title="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button className="icon-btn" onClick={() => setFitNonce((n) => n + 1)} title="Fit everything on screen">
                <Scan size={14} />
              </button>
            </div>
          </div>

          {toast && (
            <div className={`toast toast-${toast.type}`} onMouseDown={(e) => e.stopPropagation()}>
              {toast.type === 'error' ? <AlertCircle size={16} /> : toast.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
              <div>
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-msg">{toast.message}</div>}
              </div>
              <button className="icon-btn" onClick={() => setToast(null)} title="Dismiss">
                <X size={13} />
              </button>
            </div>
          )}

          {cleared > 0 && (
            <>
              <div className="lc-burst is-inline" key={cleared} aria-hidden>
                {Array.from({ length: 28 }, (_, i) => (
                  <i
                    key={i}
                    className={`lc-bit hue-${i % 4}`}
                    style={{ '--a': `${(360 / 28) * i}deg`, '--d': `${110 + (i % 5) * 30}px`, animationDelay: `${(i % 6) * 25}ms` } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="cleared-ribbon" onMouseDown={(e) => e.stopPropagation()}>
                <CheckCircle2 size={16} />
                <span>
                  <b>Level {level.levelNumber} cleared.</b> Take your time with the result and the trace.
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => setCelebrate(true)}>
                  What I learned <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}

          {traceRun && (
            <RequestTrace
              hops={traceRun.hops}
              activeIndex={run ? activeIdx : -1}
              running={!!run}
              outcome={outcomeLine}
              waiting={!!run?.waiting}
              onNext={nextStep}
            />
          )}

          {hintMode && (
            <GuidedHandHint
              steps={level.solution}
              mode={hintMode}
              isDone={stepDone}
              locate={locate}
              busy={!!run}
              levelComplete={isComplete}
              onApplyStep={applyStep}
              onClose={closeHint}
            />
          )}

          <NodeInspector node={codeNode} source={codeSource} onClose={() => setCodeNodeId(null)} />
        </main>
      </div>

      {celebrate && (
        <LevelComplete
          level={level}
          isLast={actIndex === CANVAS_CURRICULUM.length - 1}
          onNext={() => setActIndex((i) => Math.min(CANVAS_CURRICULUM.length - 1, i + 1))}
          onStay={() => setCelebrate(false)}
        />
      )}

      <QuizModal
        quiz={level.quiz}
        actTitle={level.title}
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onPassedQuiz={() =>
          setQuizPassed((q) => {
            const next = [...new Set([...q, actIndex])];
            store.set('odyssey_quiz', next);
            return next;
          })
        }
      />
    </div>
  );
};

const PERSONA_NAME = PERSONA.name;
const nextFreeBerth = (booked: string[]) =>
  Array.from({ length: 16 }, (_, i) => String(i + 1)).find((b) => !BERTHS_TAKEN.has(b) && !booked.includes(b)) ?? '16';
const eTicketSms = (r: { id: number; berth: string }) => `SMS: PNR 84${String(2000 + r.id)}61 · ${TRIP.coach}/${r.berth} confirmed`;

// 1, 2, 5, 10, 20, 50… so the dot legend is a readable number
const niceScale = (x: number) => {
  if (x <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= x) ?? 10 * p;
};

// simulated time of day: every level opens just before Tatkal at 10:00 AM
const clockText = (t: number) => {
  const total = 9 * 3600 + 59 * 60 + 40 + Math.floor(t);
  const hh = Math.floor(total / 3600) % 24;
  const mm = Math.floor(total / 60) % 60;
  const ss = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
