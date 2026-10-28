import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  CanvasNode,
  CanvasWire,
  WirePacket,
  NodeType,
  ActDefinition
} from './types';
import { CANVAS_CURRICULUM } from './data/curriculum';
import { NodeRenderer } from './components/NodeRenderer';
import { WireRenderer } from './components/WireRenderer';
import { NodeInspector } from './components/NodeInspector';
import { QuizModal } from './components/QuizModal';
import { GuidedHandHint } from './components/GuidedHandHint';
import { ClientWorkstation } from './components/ClientWorkstation';
import { ACT_SOLUTIONS, SolutionStep } from './data/actSolutions';
import { validateSystemWire } from './utils/wireValidation';
import {
  Compass,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Layers,
  BookOpen,
  Award,
  Zap,
  Server,
  Shield,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Wand2,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
  X
} from 'lucide-react';

export const CanvasWorkbench: React.FC = () => {
  // Current active act
  const [actIndex, setActIndex] = useState<number>(0);
  const currentAct = CANVAS_CURRICULUM[actIndex];

  // Appearance theme: default 'light' (Ink & Brass editorial) with 'dark' option
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('odyssey_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setTheme((curr) => {
      const next = curr === 'light' ? 'dark' : 'light';
      localStorage.setItem('odyssey_theme', next);
      return next;
    });
  };

  // Canvas pan & zoom state (natural view of workstation and backend nodes)
  const [zoom, setZoom] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 70, y: 35 });
  const isPanning = useRef<boolean>(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Nodes & Wires
  const [nodes, setNodes] = useState<CanvasNode[]>(currentAct.initialNodes);
  const [wires, setWires] = useState<CanvasWire[]>(currentAct.initialWires);

  // Dragging a node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  // Screen-space mouse + canvas-space node position at drag start; delta is divided by zoom
  const dragOrigin = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0
  });

  // Dragging a wire
  const [pendingWire, setPendingWire] = useState<{
    sourceNodeId: string;
    sourcePortId: string;
    isOutput: boolean;
    currentMousePos: { x: number; y: number };
  } | null>(null);

  // In-flight packets
  const [packets, setPackets] = useState<WirePacket[]>([]);

  // Selected node for inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Traffic slider
  const [trafficRps, setTrafficRps] = useState<number>(currentAct.simulatedTrafficRps);

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [passedActs, setPassedActs] = useState<Set<number>>(new Set());

  // Guided Hand Hint & Auto-Solve State
  const [hintMode, setHintMode] = useState<'hint' | 'autosolve' | null>(null);

  // Systems Architecture Alert Toast State
  const [systemAlert, setSystemAlert] = useState<{
    type: 'error' | 'success';
    title: string;
    message: string;
    citation?: string;
  } | null>(null);

  // Auto-dismiss alert after 4.5s
  useEffect(() => {
    if (!systemAlert) return;
    const timer = setTimeout(() => {
      setSystemAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [systemAlert]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  // Wire endpoints come from where the port sockets actually render, not a guessed card size.
  // Runs after every commit; the equality check keeps it from re-rendering when nothing moved.
  const [portPositions, setPortPositions] = useState<Record<string, { x: number; y: number }>>({});
  useLayoutEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;
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

  // Reset topology when Act changes
  useEffect(() => {
    setNodes(currentAct.initialNodes);
    setWires(currentAct.initialWires);
    setTrafficRps(currentAct.simulatedTrafficRps);
    setSelectedNodeId(null);
    setHintMode(null);
  }, [actIndex]);

  // Simulation loop: Update CPU, metrics, and packet flow every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Move active packets
      setPackets((prev) =>
        prev
          .map((pkt) => ({ ...pkt, progress: pkt.progress + 20 }))
          .filter((pkt) => pkt.progress <= 110)
      );

      // 2. Calculate load distribution across wired servers
      const serverNodes = nodes.filter((n) => n.type === 'server');
      const wiredServers = serverNodes.filter((srv) =>
        wires.some((w) => w.targetNodeId === srv.id || w.sourceNodeId === srv.id)
      );

      const serverCount = Math.max(1, wiredServers.length);
      const isOverloaded = serverCount === 1 && trafficRps > 150;

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.type === 'server') {
            const isWired = wiredServers.some((ws) => ws.id === n.id);
            if (!isWired) {
              return { ...n, data: { ...n.data, cpuUsage: 0, activeSockets: 0 } };
            }
            const cpu = isOverloaded
              ? Math.min(100, 92 + Math.floor(Math.random() * 8))
              : Math.max(8, Math.round((trafficRps / (serverCount * 120)) * 65));
            return {
              ...n,
              data: {
                ...n.data,
                cpuUsage: cpu,
                activeSockets: Math.round((trafficRps / serverCount) * 0.3)
              }
            };
          }
          return n;
        })
      );
    }, 250);

    return () => clearInterval(interval);
  }, [trafficRps, wires, nodes]);

  // Handle Client Buy Button Click with Multi-Hop Pipeline
  const handleClientAction = (action: 'buy' | 'browse' | 'login') => {
    // Check if browser has an outgoing wire
    const browserWire = wires.find((w) => w.sourceNodeId === 'node-browser');
    if (!browserWire) {
      alert('The Workstation is not wired to anything! Drag a wire from Browser OUT to a Server or Balancer.');
      return;
    }

    const browserNode = nodes.find((n) => n.id === 'node-browser');
    if (!browserNode) return;
    const seat = browserNode.data.seatSelected || '14C';
    const user = browserNode.data.activeTab || 'Bob';

    // 1. Put browser in sending state
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'node-browser'
          ? { ...n, data: { ...n.data, status: 'sending' } }
          : n
      )
    );

    // Is the system overloaded? (Level 2 single server with traffic > 300)
    const isOverloaded = actIndex === 1 || (trafficRps > 300 && nodes.filter((n) => n.type === 'server').length === 1);

    // Hop 1: HTTP Request from Workstation to Server / Balancer
    const pkt1: WirePacket = {
      id: 'pkt_req_' + Date.now(),
      wireId: browserWire.id,
      sourceNodeId: browserWire.sourceNodeId,
      targetNodeId: browserWire.targetNodeId,
      progress: 0,
      kind: 'http_req',
      method: 'POST',
      endpoint: '/api/orders',
      label: `POST /api/orders [Seat ${seat}]`,
      payload: { seat, user },
      latencyMs: isOverloaded ? 24500 : 28
    };

    setPackets((prev) => [...prev, pkt1]);

    // When Hop 1 reaches Server (after 600ms)
    setTimeout(() => {
      // If overloaded, Server fails with 504 Gateway Timeout!
      if (isOverloaded) {
        // Return 504 Timeout Packet
        const pktTimeout: WirePacket = {
          id: 'pkt_timeout_' + Date.now(),
          wireId: browserWire.id,
          sourceNodeId: browserWire.targetNodeId,
          targetNodeId: browserWire.sourceNodeId,
          progress: 0,
          kind: 'http_resp',
          method: '504',
          endpoint: 'TIMEOUT',
          label: 'HTTP 504 Gateway Timeout (CPU at 98%)',
          payload: { error: 'Gateway Timeout' },
          latencyMs: 24500,
          isReturn: true
        };
        setPackets((prev) => [...prev, pktTimeout]);

        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === 'node-browser'
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: 'error',
                      lastLatencyMs: 24500,
                      lastErrorMessage: 'Server CPU at 98%. Queue overflowed under peak ticket drop load.'
                    }
                  }
                : n
            )
          );
        }, 600);
        return;
      }

      // Find wire from Server to DB (or Redis)
      const targetServerId = browserWire.targetNodeId === 'node-balancer' ? 'node-server-1' : browserWire.targetNodeId;
      const dbWire = wires.find(
        (w) =>
          (w.sourceNodeId === targetServerId && w.targetNodeId === 'node-db-primary') ||
          (w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-db-primary')
      );

      if (dbWire) {
        // Hop 2: SQL Query from Server to Database
        const pkt2: WirePacket = {
          id: 'pkt_sql_' + Date.now(),
          wireId: dbWire.id,
          sourceNodeId: dbWire.sourceNodeId,
          targetNodeId: dbWire.targetNodeId,
          progress: 0,
          kind: 'sql_query',
          method: 'SQL',
          endpoint: 'INSERT',
          label: `SQL: INSERT INTO bookings ('${seat}', '${user}')`,
          payload: { seat, user },
          latencyMs: 6
        };
        setPackets((prev) => [...prev, pkt2]);

        // When Hop 2 reaches Database (after 600ms):
        setTimeout(() => {
          // Increment DB row count
          setNodes((prev) =>
            prev.map((n) =>
              n.id === 'node-db-primary'
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      rowCount: (n.data.rowCount || 12480) + 1,
                      activeConnections: Math.min(100, (n.data.activeConnections || 6) + 1)
                    }
                  }
                : n
            )
          );

          // Hop 3: SQL Response from Database to Server
          const pkt3: WirePacket = {
            id: 'pkt_sql_res_' + Date.now(),
            wireId: dbWire.id,
            sourceNodeId: dbWire.targetNodeId,
            targetNodeId: dbWire.sourceNodeId,
            progress: 0,
            kind: 'sql_resp',
            method: 'RES',
            endpoint: 'COMMIT',
            label: `SQL OK: 1 row affected (WAL write, 4.2ms)`,
            payload: { bookingId: 9842 },
            latencyMs: 4,
            isReturn: true
          };
          setPackets((prev) => [...prev, pkt3]);

          // When Hop 3 reaches Server (after 600ms):
          setTimeout(() => {
            // Hop 4: HTTP 200 OK Response from Server to Workstation
            const pkt4: WirePacket = {
              id: 'pkt_http_res_' + Date.now(),
              wireId: browserWire.id,
              sourceNodeId: browserWire.targetNodeId,
              targetNodeId: browserWire.sourceNodeId,
              progress: 0,
              kind: 'http_resp',
              method: '200',
              endpoint: 'OK',
              label: `HTTP 200 OK: { ticketId: "TKT-9842", seat: "${seat}" }`,
              payload: { ticketId: 'TKT-9842', seat },
              latencyMs: 28,
              isReturn: true
            };
            setPackets((prev) => [...prev, pkt4]);

            // When Hop 4 reaches Workstation (after 600ms):
            setTimeout(() => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === 'node-browser'
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          status: 'confirmed',
                          lastLatencyMs: 28,
                          lastTicketId: 'TKT-' + Math.floor(1000 + Math.random() * 9000)
                        }
                      }
                    : n
                )
              );
            }, 600);
          }, 600);
        }, 600);
      } else {
        // Direct response if no DB wire
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === 'node-browser'
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: 'confirmed',
                      lastLatencyMs: 28,
                      lastTicketId: 'TKT-9842'
                    }
                  }
                : n
            )
          );
        }, 600);
      }
    }, 600);
  };

  // Node Dragging Handlers
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning canvas
    if (isPanning.current) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
      return;
    }

    // 2. Dragging node
    if (draggingNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? {
                ...n,
                position: {
                  x: Math.round((dragOrigin.current.nodeX + (e.clientX - dragOrigin.current.mouseX) / zoom) / 10) * 10,
                  y: Math.round((dragOrigin.current.nodeY + (e.clientY - dragOrigin.current.mouseY) / zoom) / 10) * 10
                }
              }
            : n
        )
      );
      return;
    }

    // 3. Dragging wire
    if (pendingWire && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;
      setPendingWire((prev) =>
        prev ? { ...prev, currentMousePos: { x: mouseCanvasX, y: mouseCanvasY } } : null
      );
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    setDraggingNodeId(null);
    if (pendingWire) {
      setPendingWire(null);
    }
  };

  // Start wire drag from a port
  const handleStartWire = (
    nodeId: string,
    portId: string,
    isOutput: boolean,
    e: React.MouseEvent
  ) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

    setPendingWire({
      sourceNodeId: nodeId,
      sourcePortId: portId,
      isOutput,
      currentMousePos: { x: mouseCanvasX, y: mouseCanvasY }
    });
  };

  // Dynamic Level Objective Status & Checklist
  const levelStatus = (() => {
    switch (actIndex) {
      case 0: {
        const hasBrowserToServer = wires.some(
          (w) => w.sourceNodeId === 'node-browser' && w.targetNodeId === 'node-server-1'
        );
        const hasServerToDb = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-db-primary'
        );
        const isConfirmed = nodes.find((n) => n.id === 'node-browser')?.data.status === 'confirmed';
        return {
          steps: [
            { label: 'Connect Client Workstation to Server 1', done: hasBrowserToServer },
            { label: 'Connect Server 1 to PostgreSQL DB', done: hasServerToDb },
            { label: 'Click "Reserve Seat 14C" on Workstation (200 OK)', done: !!isConfirmed }
          ],
          isComplete: hasBrowserToServer && hasServerToDb && !!isConfirmed
        };
      }
      case 1: {
        const browserErr = nodes.find((n) => n.id === 'node-browser')?.data.status === 'error';
        return {
          steps: [
            { label: 'Increase Traffic Rush to 300+ req/s (10:00 AM Surge)', done: trafficRps >= 300 },
            { label: 'Click "Reserve Seat 14C" to observe CPU saturation & 504 Timeout', done: !!browserErr }
          ],
          isComplete: trafficRps >= 300 && !!browserErr
        };
      }
      case 2: {
        const hasBrowserToLb = wires.some(
          (w) => w.sourceNodeId === 'node-browser' && w.targetNodeId === 'node-balancer'
        );
        const hasLbToS1 = wires.some(
          (w) => w.sourceNodeId === 'node-balancer' && w.targetNodeId === 'node-server-1'
        );
        const hasLbToS2 = wires.some(
          (w) => w.sourceNodeId === 'node-balancer' && w.targetNodeId === 'node-server-2'
        );
        return {
          steps: [
            { label: 'Connect Workstation to Nginx Load Balancer', done: hasBrowserToLb },
            { label: 'Connect Load Balancer to Server 1 (Instance A)', done: hasLbToS1 },
            { label: 'Connect Load Balancer to Server 2 (Instance B)', done: hasLbToS2 }
          ],
          isComplete: hasBrowserToLb && hasLbToS1 && hasLbToS2
        };
      }
      case 3: {
        const hasS1ToRedis = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-redis'
        );
        const hasS2ToRedis = wires.some(
          (w) => w.sourceNodeId === 'node-server-2' && w.targetNodeId === 'node-redis'
        );
        return {
          steps: [
            { label: 'Connect Server 1 to Central Redis Session Store', done: hasS1ToRedis },
            { label: 'Connect Server 2 to Central Redis Session Store', done: hasS2ToRedis }
          ],
          isComplete: hasS1ToRedis && hasS2ToRedis
        };
      }
      case 4: {
        const hasServerToDb = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-db-primary'
        );
        return {
          steps: [
            { label: 'Verify Server Cluster multiplexed onto PostgreSQL DB', done: hasServerToDb }
          ],
          isComplete: hasServerToDb
        };
      }
      case 5: {
        const hasServerToCache = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-redis-cache'
        );
        const hasCacheToDb = wires.some(
          (w) => w.sourceNodeId === 'node-redis-cache' && w.targetNodeId === 'node-db-primary'
        );
        return {
          steps: [
            { label: 'Route App Server queries to Redis In-Memory Cache', done: hasServerToCache },
            { label: 'Wire Redis Cache Miss fallback to PostgreSQL DB', done: hasCacheToDb }
          ],
          isComplete: hasServerToCache && hasCacheToDb
        };
      }
      case 6: {
        const hasServerToQueue = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-queue'
        );
        const hasServerToDb = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-db-primary'
        );
        return {
          steps: [
            { label: 'Offload PDF/Email jobs to BullMQ Worker Queue', done: hasServerToQueue },
            { label: 'Keep synchronous ticket booking write to PostgreSQL DB', done: hasServerToDb }
          ],
          isComplete: hasServerToQueue && hasServerToDb
        };
      }
      case 7: {
        const hasServerToShard = wires.some(
          (w) => w.sourceNodeId === 'node-server-1' && w.targetNodeId === 'node-db-primary'
        );
        return {
          steps: [
            { label: 'Connect App Router to Sharded Database Cluster (hash % 3)', done: hasServerToShard }
          ],
          isComplete: hasServerToShard
        };
      }
      default:
        return { steps: [], isComplete: false };
    }
  })();

  // Mark level as passed when complete
  useEffect(() => {
    if (levelStatus.isComplete && !passedActs.has(actIndex)) {
      setPassedActs((prev) => new Set([...prev, actIndex]));
    }
  }, [levelStatus.isComplete, actIndex, passedActs]);

  // Connect Wire on Port Drop or Click (Bidirectional & Tolerant)
  const handleEndWire = (targetNodeId: string, targetPortId: string) => {
    if (!pendingWire) return;

    let sourceNode = nodes.find((n) => n.id === pendingWire.sourceNodeId);
    let targetNode = nodes.find((n) => n.id === targetNodeId);

    if (!sourceNode || !targetNode) {
      setPendingWire(null);
      return;
    }

    let sourcePort = pendingWire.sourcePortId;
    let targetPort = targetPortId || targetNode.ports.inputs[0] || 'in-main';

    // Bidirectional support: if user dragged from an input port to an output port, invert
    if (!pendingWire.isOutput) {
      const tempNode = sourceNode;
      sourceNode = targetNode;
      targetNode = tempNode;

      sourcePort = targetPortId || sourceNode.ports.outputs[0] || 'out-main';
      targetPort = pendingWire.sourcePortId || targetNode.ports.inputs[0] || 'in-main';
    } else {
      if (!targetPort || targetPort === 'in-main') {
        targetPort = targetNode.ports.inputs[0] || 'in-main';
      }
    }

    // Run architectural validation
    const validation = validateSystemWire(
      sourceNode,
      sourcePort,
      targetNode,
      targetPort
    );

    if (!validation.valid) {
      setSystemAlert({
        type: 'error',
        title: 'Architectural Exception Blocked',
        message: validation.warning || 'Invalid connection attempted.',
        citation: validation.rfcCitation
      });
      setPendingWire(null);
      return;
    }

    // Check if wire already exists
    const exists = wires.some(
      (w) =>
        w.sourceNodeId === sourceNode.id &&
        w.targetNodeId === targetNode.id
    );

    if (exists) {
      setSystemAlert({
        type: 'error',
        title: 'Already Connected',
        message: `[${sourceNode.title}] is already wired to [${targetNode.title}].`
      });
      setPendingWire(null);
      return;
    }

    const newWire: CanvasWire = {
      id: `wire-${sourceNode.id}-${targetNode.id}-${Date.now().toString().slice(-4)}`,
      sourceNodeId: sourceNode.id,
      sourcePortId: sourcePort,
      targetNodeId: targetNode.id,
      targetPortId: targetPort,
      status: 'active'
    };

    setWires((prev) => [...prev, newWire]);
    setSystemAlert({
      type: 'success',
      title: 'Connection Established',
      message: `Linked [${sourceNode.title}] to [${targetNode.title}] via ${validation.protocol}.`
    });

    setPendingWire(null);
  };

  // Delete Wire
  const handleDeleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    setSystemAlert({
      type: 'success',
      title: 'Connection Severed',
      message: 'Wire removed from architecture topology.'
    });
  };

  // Add Component to Canvas
  const handleAddComponent = (type: NodeType) => {
    const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
    const titles: Record<NodeType, string> = {
      browser: 'New Client Browser',
      balancer: 'Nginx Load Balancer',
      server: `Server ${nodes.filter((n) => n.type === 'server').length + 1}`,
      redis: 'Redis In-Memory Store',
      database: 'PostgreSQL Read Replica',
      queue: 'BullMQ Worker Queue'
    };

    const newNode: CanvasNode = {
      id: newId,
      type,
      title: titles[type],
      position: { x: 300 + Math.random() * 200, y: 150 + Math.random() * 150 },
      ports: {
        inputs: type === 'browser' ? ['in-resp'] : ['in-main'],
        outputs: type === 'database' ? ['out-data'] : ['out-main']
      },
      data: {
        cpuUsage: 10,
        activeSockets: 2,
        maxSockets: 128,
        algorithm: 'least-connections',
        activeConnections: 4,
        maxConnections: 100
      }
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  // Guided Hand Hint Handlers
  const handleToggleHint = () => {
    setHintMode((prev) => (prev === 'hint' ? null : 'hint'));
  };

  const handleTriggerAutoSolve = () => {
    setHintMode('autosolve');
  };

  const handleApplyStep = (step: SolutionStep) => {
    if (step.wireToConnect) {
      const wire = step.wireToConnect;
      setWires((prev) => {
        const exists = prev.some(
          (w) =>
            w.sourceNodeId === wire.sourceNodeId &&
            w.targetNodeId === wire.targetNodeId &&
            w.sourcePortId === wire.sourcePortId &&
            w.targetPortId === wire.targetPortId
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            id: `wire-${wire.sourceNodeId}-${wire.targetNodeId}-${Date.now().toString().slice(-4)}`,
            sourceNodeId: wire.sourceNodeId,
            sourcePortId: wire.sourcePortId,
            targetNodeId: wire.targetNodeId,
            targetPortId: wire.targetPortId,
            status: 'active'
          }
        ];
      });
    }

    if (step.actionType === 'click') {
      handleClientAction('buy');
    }
  };

  const handleApplyFullSolution = (solvedNodes?: CanvasNode[], solvedWires?: CanvasWire[]) => {
    if (solvedWires) {
      setWires(solvedWires);
    }
    if (solvedNodes) {
      setNodes(solvedNodes);
    }
    // Also trigger traffic to prove it works
    setTimeout(() => {
      handleClientAction('buy');
    }, 400);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div
      className="canvas-page-root"
      data-theme={theme}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Editorial Announcement Banner (Directly from Frontend Master / Image 2) */}
      <div className="fm-editorial-banner">
        <p className="fm-banner-msg">
          <span className="banner-badge">100x ARCHITECT</span>
          <span>Distributed Systems, Real Outages &amp; Temporal Coupling. Grounded in <em>allahabadi.dev</em> &amp; <em>backendengineer.in</em></span>
        </p>
      </div>

      {/* Top Navbar */}
      <header className="canvas-navbar">
        <div className="nav-brand">
          <Compass size={20} className="brand-compass" />
          <div className="brand-titles">
            <span className="brand-h1">Fullstack Odyssey</span>
            <span className="brand-h2">INTERACTIVE SYSTEMS &middot; ARCHITECTURE ENGINE</span>
          </div>
        </div>

        {/* Level Stepper */}
        <div className="act-stepper">
          <button
            className="act-nav-arrow"
            disabled={actIndex === 0}
            onClick={() => setActIndex((i) => Math.max(0, i - 1))}
            title="Previous Level"
          >
            <ChevronLeft size={16} />
          </button>

          {CANVAS_CURRICULUM.map((level, i) => {
            const isCurrent = i === actIndex;
            const isPassed = passedActs.has(i);
            return (
              <button
                key={level.id}
                className={`act-pill ${isCurrent ? 'active' : isPassed ? 'passed' : ''}`}
                onClick={() => setActIndex(i)}
                title={level.title}
              >
                <span className="act-num">Level {i + 1}</span>
              </button>
            );
          })}

          <button
            className="act-nav-arrow"
            disabled={actIndex === CANVAS_CURRICULUM.length - 1}
            onClick={() => setActIndex((i) => Math.min(CANVAS_CURRICULUM.length - 1, i + 1))}
            title="Next Level"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Global Controls */}
        <div className="nav-end-controls">
          <button
            className="theme-switch-btn"
            onClick={toggleTheme}
            title={`Toggle Theme (Current: ${theme})`}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span className="theme-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button
            className="quiz-checkpoint-btn"
            onClick={() => setIsQuizOpen(true)}
            title="Take the architectural trade-off checkpoint quiz"
          >
            <BookOpen size={13} />
            <span>Checkpoint Quiz</span>
          </button>

          <button
            className="canvas-reset-btn"
            onClick={() => {
              setNodes(currentAct.initialNodes);
              setWires(currentAct.initialWires);
              setTrafficRps(currentAct.simulatedTrafficRps);
            }}
            title="Reset Level Topology"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Systems Architecture Alert Toast */}
      {systemAlert && (
        <div className={`system-alert-toast ${systemAlert.type}`}>
          {systemAlert.type === 'error' ? (
            <AlertCircle size={18} className="alert-toast-icon" />
          ) : (
            <CheckCircle2 size={18} className="alert-toast-icon" />
          )}
          <div className="alert-toast-content">
            <span className="alert-toast-title">{systemAlert.title}</span>
            <span className="alert-toast-msg">{systemAlert.message}</span>
            {systemAlert.citation && (
              <span className="alert-toast-citation">Grounding: {systemAlert.citation}</span>
            )}
          </div>
          <button
            className="alert-toast-close"
            onClick={() => setSystemAlert(null)}
            title="Dismiss Alert"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Canvas Toolbar Dock */}
      <div className="canvas-dock">
        <div className="dock-group components-group">
          <span className="dock-label">ADD HARDWARE NODE:</span>
          <button className="dock-btn" onClick={() => handleAddComponent('server')}>
            <Server size={13} /> + Server
          </button>
          <button className="dock-btn" onClick={() => handleAddComponent('balancer')}>
            <Shield size={13} /> + Load Balancer
          </button>
          <button className="dock-btn" onClick={() => handleAddComponent('redis')}>
            <Zap size={13} /> + Redis Store
          </button>
          <button className="dock-btn" onClick={() => handleAddComponent('database')}>
            <Layers size={13} /> + Database
          </button>
        </div>

        <div className="dock-group traffic-group">
          <span className="dock-label">
            <Sliders size={12} /> TRAFFIC RUSH:
          </span>
          <input
            type="range"
            min="10"
            max="600"
            step="10"
            value={trafficRps}
            onChange={(e) => setTrafficRps(parseInt(e.target.value, 10))}
            className="dock-slider"
          />
          <span className={`dock-rps-val ${trafficRps > 300 ? 'high' : ''}`}>
            {trafficRps} req/s
          </span>
        </div>

        <div className="dock-group zoom-group">
          <button
            className="dock-btn-icon"
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            title="Zoom In"
          >
            <Maximize2 size={13} />
          </button>
          <button
            className="dock-btn-icon"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            title="Zoom Out"
          >
            <Minimize2 size={13} />
          </button>
          <span className="zoom-val">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Infinite Canvas Viewport */}
      <main
        className="canvas-viewport"
        ref={canvasRef}
        onMouseDown={(e) => {
          // Pan when clicking background
          if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
            isPanning.current = true;
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            setSelectedNodeId(null);
          }
        }}
      >
        <div
          className="canvas-transform-plane"
          ref={planeRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* SVG Wires Layer */}
          <WireRenderer
            wires={wires}
            nodes={nodes}
            packets={packets}
            pendingWire={pendingWire}
            onDeleteWire={handleDeleteWire}
            portPositions={portPositions}
          />

          {/* Canvas Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className="canvas-node-wrapper"
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`
              }}
              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            >
              <NodeRenderer
                node={node}
                isSelected={node.id === selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onStartWire={handleStartWire}
                onEndWire={handleEndWire}
                isPendingWireActive={!!pendingWire}
                onSendClientRequest={handleClientAction}
                onClientSelectSeat={(seat) => {
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === 'node-browser'
                        ? { ...n, data: { ...n.data, seatSelected: seat } }
                        : n
                    )
                  );
                }}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Floating Canvas Objective & Level Progression Card */}
      <aside className="canvas-objective-card">
        <div className="obj-card-header">
          <div className="obj-header-left">
            <span className="obj-act-pill">LEVEL {currentAct.levelNumber} OF 8</span>
            <span className="obj-target-title">{currentAct.subtitle}</span>
          </div>
          {levelStatus.isComplete && (
            <span className="obj-complete-badge">
              <CheckCircle2 size={12} /> LEVEL CLEAR
            </span>
          )}
        </div>

        <div className="obj-checklist">
          {levelStatus.steps.map((st, idx) => (
            <div key={idx} className={`checklist-item ${st.done ? 'step-done' : 'step-pending'}`}>
              <div className="step-check-icon">
                {st.done ? (
                  <CheckCircle2 size={13} className="text-mint" />
                ) : (
                  <Circle size={13} className="text-muted" />
                )}
              </div>
              <span className="step-text">{st.label}</span>
            </div>
          ))}
        </div>

        {levelStatus.isComplete ? (
          <button
            className="advance-level-btn glow"
            onClick={() => {
              if (actIndex < CANVAS_CURRICULUM.length - 1) {
                setActIndex((i) => i + 1);
              }
            }}
          >
            <span>Proceed to Level {currentAct.levelNumber + 1}</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <div className="obj-hint-row">
            <Sparkles size={11} className="hint-icon" />
            <span className="hint-text">{currentAct.targetObjective}</span>
          </div>
        )}
      </aside>

      {/* Editorial System Design Narrative (Directly from Frontend Master / Image 2) */}
      <footer className="canvas-story-editorial">
        {/* Giant decorative watermark number */}
        <div className="editorial-watermark-num">
          {currentAct.levelNumber < 10 ? `0${currentAct.levelNumber}` : currentAct.levelNumber}
        </div>

        <div className="editorial-content-stack">
          {/* Eyebrow Pill */}
          <div className="editorial-eyebrow-row">
            <span className="editorial-eyebrow-chip">
              <span className="dot" /> PATTERN 0{currentAct.levelNumber} &middot; {currentAct.subtitle.toUpperCase()}
            </span>
            <div className="editorial-meta-chips">
              <span className="meta-chip">Level <strong>{currentAct.levelNumber === 1 ? 'Start here' : `Level ${currentAct.levelNumber}`}</strong></span>
              <span className="meta-chip">~ <strong>10 min</strong> solve</span>
              <span className="meta-chip">Prerequisites <strong>None</strong></span>
            </div>
          </div>

          {/* Big Bricolage Grotesque Heading */}
          <h2 className="editorial-headline">
            {currentAct.title.replace(/^Level \d+: /, '').split('(')[0].trim()}: <span className="headline-grad">{currentAct.subtitle}</span>
          </h2>

          {/* Callout Card: "IN ONE LINE" */}
          <div className="editorial-tldr-card">
            <span className="tldr-label">IN ONE LINE</span>
            <p className="tldr-text">
              {currentAct.inOneLine || currentAct.scriptQuote || currentAct.storyNarrative}
            </p>
          </div>

          {/* Core Architectural Narrative in Source Serif */}
          <p className="editorial-prose">{currentAct.storyNarrative}</p>
        </div>

        {/* Mission Objective & Actions */}
        <div className="editorial-side-panel">
          <div className="editorial-mission-box">
            <span className="mission-label">MISSION OBJECTIVE</span>
            <span className="mission-desc">{currentAct.targetObjective}</span>
          </div>

          <div className="editorial-actions-row">
            <button
              className={`editorial-action-btn hint-btn ${hintMode === 'hint' ? 'active' : ''}`}
              onClick={handleToggleHint}
              title="Show animated hand hint"
            >
              <Lightbulb size={13} />
              <span>Hint</span>
            </button>

            <button
              className="editorial-action-btn solve-btn"
              onClick={handleTriggerAutoSolve}
              title="Auto-solve topology"
            >
              <Wand2 size={13} />
              <span>Auto-Solve</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Guided Hand Hint & Auto-Solve Overlay */}
      {hintMode !== null && ACT_SOLUTIONS[actIndex] && (
        <GuidedHandHint
          plan={ACT_SOLUTIONS[actIndex]}
          mode={hintMode}
          zoom={zoom}
          pan={pan}
          onClose={() => setHintMode(null)}
          onApplyStep={handleApplyStep}
          onApplyFullSolution={handleApplyFullSolution}
        />
      )}

      {/* Slide-Out Node Inspector Drawer */}
      <NodeInspector
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onUpdateNodeData={(nodeId, updates) => {
          setNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
          );
        }}
      />

      {/* Architectural Checkpoint Quiz Modal */}
      <QuizModal
        quiz={currentAct.quiz}
        actTitle={currentAct.title}
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onPassedQuiz={() => {
          setPassedActs((prev) => new Set([...prev, actIndex]));
          if (actIndex < CANVAS_CURRICULUM.length - 1) {
            setActIndex((i) => i + 1);
          }
        }}
      />
    </div>
  );
};
