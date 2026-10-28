export type NodeType =
  | 'browser'
  | 'balancer'
  | 'server'
  | 'redis'
  | 'database'
  | 'queue'
  | 'pool';

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  title: string;
  position: CanvasPosition;
  ports: {
    inputs: string[];
    outputs: string[];
  };
  data: Record<string, any>;
}

export interface CanvasWire {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  status: 'active' | 'stalled' | 'congested';
}

export type PacketKind = 'http_req' | 'sql_query' | 'sql_resp' | 'http_resp' | 'redis' | 'job';

export interface WirePacket {
  id: string;
  wireId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0 to 100%
  kind?: PacketKind;
  method: string;
  endpoint: string;
  label: string;
  payload: Record<string, any>;
  latencyMs: number;
  isReturn?: boolean;
  isError?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  referenceSource: {
    title: string;
    chapterOrSection: string;
    url?: string;
  };
}

// What the browser can ask for: book a seat (write) or reload the seat map (read)
export type ClientAction = 'buy' | 'browse';

// Rules the simulation switches on per level. Outcomes are computed from the
// wiring under these rules — never from the level index.
export interface LevelMechanics {
  serverCapacityRps: number; // requests/second one server instance can finish
  sessions?: boolean; // servers must recognise Bob's session cookie
  connectionLimit?: boolean; // PostgreSQL refuses past max_connections
  readHeavy?: boolean; // every page view runs the seat-count query
  slowSideEffects?: boolean; // PDF + email happen inside the booking request
  sharding?: boolean; // write time depends on rows per database
}

// Infrastructure that is still running in the story but not drawn, so the
// canvas only shows what this level is about. Code generation still includes it.
export type HiddenInfra = 'sessions' | 'pool' | 'cache' | 'queue';

export type LevelGoal =
  | { kind: 'wire'; from: string; to: string; label: string }
  | { kind: 'noWire'; fromType: NodeType; toType: NodeType; label: string }
  | { kind: 'traffic'; minRps: number; label: string }
  | {
      kind: 'outcome';
      action: ClientAction;
      status: number;
      maxLatencyMs?: number;
      minRps?: number; // the outcome only counts under this much traffic (no lowering the slider to cheat)
      servedBy?: string;
      label: string;
    };

export type SolutionStep =
  | { kind: 'wire'; from: string; to: string; text: string }
  | { kind: 'unwire'; from: string; to: string; text: string }
  | { kind: 'traffic'; rps: number; text: string }
  | { kind: 'click'; action: ClientAction; text: string };

export interface SourceRef {
  name: string;
  title: string;
  url?: string;
}

export interface LevelDefinition {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  inOneLine: string;
  storyNarrative: string;
  introduces: string[]; // concept ids from data/concepts.ts
  hiddenInfra?: HiddenInfra[];
  hiddenNote?: string;
  initialNodes: CanvasNode[];
  initialWires: CanvasWire[];
  simulatedTrafficRps: number;
  trafficControl: boolean; // show the requests-per-second slider
  mechanics: LevelMechanics;
  goals: LevelGoal[];
  solution: SolutionStep[];
  sources: SourceRef[];
  facts: string[]; // true one-liners from computing history, shown between lessons
  quiz: QuizQuestion;
}

// Backward-compatible alias for existing imports
export type ActDefinition = LevelDefinition;
