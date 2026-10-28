export type NodeType =
  | 'browser'
  | 'balancer'
  | 'server'
  | 'redis'
  | 'database'
  | 'queue';

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

export type PacketKind = 'http_req' | 'sql_query' | 'sql_resp' | 'http_resp';

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

export interface LevelDefinition {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  inOneLine?: string;
  storyNarrative: string;
  scriptQuote: string;
  historicalContext: string;
  officialReferences: Array<{
    name: string;
    topic: string;
    citation: string;
  }>;
  initialNodes: CanvasNode[];
  initialWires: CanvasWire[];
  targetObjective: string;
  requiredConnections: Array<{ fromType: NodeType; toType: NodeType }>;
  simulatedTrafficRps: number;
  quiz: QuizQuestion;
}

// Backward-compatible alias for existing imports
export type ActDefinition = LevelDefinition;
