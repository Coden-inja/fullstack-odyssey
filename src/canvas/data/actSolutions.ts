import { CanvasNode, CanvasWire, NodeType } from '../types';

export interface SolutionStep {
  stepIndex: number;
  totalSteps: number;
  instruction: string;
  sourceCoords: { x: number; y: number };
  targetCoords?: { x: number; y: number };
  actionType: 'click' | 'drag_wire' | 'spawn_node';
  nodeTypeToSpawn?: NodeType;
  wireToConnect?: {
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
  };
}

export interface ActSolutionPlan {
  actIndex: number;
  title: string;
  explanation: string;
  citation: string;
  steps: SolutionStep[];
  // If auto-solved, target final state of nodes and wires
  solvedNodes?: CanvasNode[];
  solvedWires?: CanvasWire[];
}

export const ACT_SOLUTIONS: Record<number, ActSolutionPlan> = {
  // Act 0: Baseline
  0: {
    actIndex: 0,
    title: 'Baseline HTTP Client-Server Verification',
    explanation:
      'In a baseline architecture, the client communicates directly over a TCP socket to the monolith, which executes queries against the primary database.',
    citation: 'RFC 9110 (HTTP Semantics) § 3.4',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 1,
        instruction: 'Click "Buy Seat 14C" in the Client Browser to trace an HTTP packet from client to database.',
        sourceCoords: { x: 220, y: 380 },
        actionType: 'click'
      }
    ]
  },

  // Act 1: Concurrency Wall
  1: {
    actIndex: 1,
    title: 'Triggering Concurrency Saturation',
    explanation:
      'When incoming arrival rate exceeds single-server CPU execution capacity, OS socket queues overflow (SOMAXCONN), triggering Little’s Law exponential latency spikes.',
    citation: 'Little’s Law (John Little, 1961) — Operations Research',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 1,
        instruction: 'Click "Buy Seat 14C" to send requests under peak flash-sale concurrency. Observe Server 1 pin at 98% CPU.',
        sourceCoords: { x: 220, y: 380 },
        actionType: 'click'
      }
    ]
  },

  // Act 2: Load Balancing
  2: {
    actIndex: 2,
    title: 'Horizontal Scaling with Nginx Reverse Proxy',
    explanation:
      'Place an Nginx Load Balancer in front of Server 1 and Server 2. Rewire traffic so requests are distributed using Least Connections or Round Robin.',
    citation: 'Nginx Upstream Module (ngx_http_upstream_module)',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 3,
        instruction: 'Wire Browser output (out-req) to Load Balancer input (in-client).',
        sourceCoords: { x: 300, y: 300 },
        targetCoords: { x: 340, y: 220 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-browser',
          sourcePortId: 'out-req',
          targetNodeId: 'node-balancer',
          targetPortId: 'in-client'
        }
      },
      {
        stepIndex: 2,
        totalSteps: 3,
        instruction: 'Wire Load Balancer (out-s1) to Server 1 (in-http).',
        sourceCoords: { x: 500, y: 200 },
        targetCoords: { x: 600, y: 120 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-balancer',
          sourcePortId: 'out-s1',
          targetNodeId: 'node-server-1',
          targetPortId: 'in-http'
        }
      },
      {
        stepIndex: 3,
        totalSteps: 3,
        instruction: 'Wire Load Balancer (out-s2) to Server 2 (in-http) to balance traffic across both CPUs.',
        sourceCoords: { x: 500, y: 240 },
        targetCoords: { x: 600, y: 280 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-balancer',
          sourcePortId: 'out-s2',
          targetNodeId: 'node-server-2',
          targetPortId: 'in-http'
        }
      }
    ],
    solvedWires: [
      {
        id: 'wire-browser-lb',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-balancer',
        targetPortId: 'in-client',
        status: 'active'
      },
      {
        id: 'wire-lb-s1',
        sourceNodeId: 'node-balancer',
        sourcePortId: 'out-s1',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-lb-s2',
        sourceNodeId: 'node-balancer',
        sourcePortId: 'out-s2',
        targetNodeId: 'node-server-2',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-s1-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      },
      {
        id: 'wire-s2-db',
        sourceNodeId: 'node-server-2',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ]
  },

  // Act 3: Stateless Sessions
  3: {
    actIndex: 3,
    title: 'Centralized Redis Session Store',
    explanation:
      'Store sessions outside application heap memory in a shared Redis cache with TTL so Bob remains authenticated regardless of which server answers his request.',
    citation: 'DDIA (Martin Kleppmann) Chapter 1: Shared-Nothing Architecture',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 2,
        instruction: 'Wire Server 1 (out-redis) to Centralized Redis Store (in-session).',
        sourceCoords: { x: 590, y: 150 },
        targetCoords: { x: 640, y: 390 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-1',
          sourcePortId: 'out-redis',
          targetNodeId: 'node-redis',
          targetPortId: 'in-session'
        }
      },
      {
        stepIndex: 2,
        totalSteps: 2,
        instruction: 'Wire Server 2 (out-redis) to Centralized Redis Store (in-session).',
        sourceCoords: { x: 590, y: 280 },
        targetCoords: { x: 640, y: 390 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-2',
          sourcePortId: 'out-redis',
          targetNodeId: 'node-redis',
          targetPortId: 'in-session'
        }
      }
    ],
    solvedWires: [
      {
        id: 'wire-browser-lb',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-balancer',
        targetPortId: 'in-client',
        status: 'active'
      },
      {
        id: 'wire-lb-s1',
        sourceNodeId: 'node-balancer',
        sourcePortId: 'out-s1',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-lb-s2',
        sourceNodeId: 'node-balancer',
        sourcePortId: 'out-s2',
        targetNodeId: 'node-server-2',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-s1-redis',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-redis',
        targetNodeId: 'node-redis',
        targetPortId: 'in-session',
        status: 'active'
      },
      {
        id: 'wire-s2-redis',
        sourceNodeId: 'node-server-2',
        sourcePortId: 'out-redis',
        targetNodeId: 'node-redis',
        targetPortId: 'in-session',
        status: 'active'
      },
      {
        id: 'wire-s1-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      },
      {
        id: 'wire-s2-db',
        sourceNodeId: 'node-server-2',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ]
  },

  // Act 4: Connection Pooling
  4: {
    actIndex: 4,
    title: 'Database Connection Pool Multiplexing',
    explanation:
      'Multiplex application threads through a connection pool (PgBouncer or pool.query), capping database backend processes and cutting TCP handshake latency from 40ms to 19ms.',
    citation: 'Hussein Nasser (PostgreSQL Connection Pooling) & Postgres Ch. 20',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 2,
        instruction: 'Wire Server 1 to PostgreSQL via managed Connection Pool.',
        sourceCoords: { x: 570, y: 150 },
        targetCoords: { x: 800, y: 200 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-1',
          sourcePortId: 'out-db',
          targetNodeId: 'node-db-primary',
          targetPortId: 'in-query'
        }
      },
      {
        stepIndex: 2,
        totalSteps: 2,
        instruction: 'Wire Server 2 to PostgreSQL via managed Connection Pool to avoid socket exhaustion.',
        sourceCoords: { x: 570, y: 280 },
        targetCoords: { x: 800, y: 200 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-2',
          sourcePortId: 'out-db',
          targetNodeId: 'node-db-primary',
          targetPortId: 'in-query'
        }
      }
    ]
  },

  // Act 5: Cache Stampede
  5: {
    actIndex: 5,
    title: 'In-Memory Cache-Aside & XFetch Defense',
    explanation:
      'Place Redis Cache between servers and database. Serve 4,800 identical count queries in 1ms RAM latency, protecting disk I/O.',
    citation: 'Facebook Memcached Paper (NSDI 2013) & VLDB 2015 XFetch Algorithm',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 2,
        instruction: 'Wire Server 1 to Redis Cache (in-cache) for hot ticket availability reads.',
        sourceCoords: { x: 550, y: 140 },
        targetCoords: { x: 740, y: 100 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-1',
          sourcePortId: 'out-cache',
          targetNodeId: 'node-redis-cache',
          targetPortId: 'in-cache'
        }
      },
      {
        stepIndex: 2,
        totalSteps: 2,
        instruction: 'Wire Redis Cache to Primary DB to populate missed keys via Cache-Aside.',
        sourceCoords: { x: 880, y: 120 },
        targetCoords: { x: 920, y: 240 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-redis-cache',
          sourcePortId: 'out-miss',
          targetNodeId: 'node-db-primary',
          targetPortId: 'in-query'
        }
      }
    ]
  },

  // Act 6: Worker Queue
  6: {
    actIndex: 6,
    title: 'Asynchronous Background Jobs (BullMQ)',
    explanation:
      'Offload 3.2s invoice generation and receipt emailing into a BullMQ Redis queue. The HTTP client receives 202 Accepted in 18ms.',
    citation: 'Enterprise Integration Patterns (Hohpe) & BullMQ Specification',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 1,
        instruction: 'Wire Server 1 to BullMQ Worker Queue (in-job) to decouple blocking email/PDF tasks.',
        sourceCoords: { x: 550, y: 170 },
        targetCoords: { x: 720, y: 360 },
        actionType: 'drag_wire',
        wireToConnect: {
          sourceNodeId: 'node-server-1',
          sourcePortId: 'out-queue',
          targetNodeId: 'node-queue',
          targetPortId: 'in-job'
        }
      }
    ]
  },

  // Act 7: Sharding
  7: {
    actIndex: 7,
    title: 'Horizontal Database Sharding',
    explanation:
      'Partition 200M ticket rows across 3 independent database shards using hash keys, eliminating single-disk write limits.',
    citation: 'DDIA (Martin Kleppmann) Chapter 6: Partitioning & Vitess Architecture',
    steps: [
      {
        stepIndex: 1,
        totalSteps: 1,
        instruction: 'Click "Buy Seat 14C" to verify queries route to Shard 2 via hash partitioning.',
        sourceCoords: { x: 220, y: 380 },
        actionType: 'click'
      }
    ]
  }
};
