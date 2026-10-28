import { LevelDefinition } from '../types';

export const CANVAS_CURRICULUM: LevelDefinition[] = [
  // LEVEL 1
  {
    id: 'level-1-starting-system',
    levelNumber: 1,
    title: 'Level 1: The Starting System (One Server & One DB)',
    subtitle: '1 Browser → 1 Physical Server → 1 Database',
    inOneLine:
      'One program asks another program a question over a TCP socket and halts completely until it receives an answer.',
    scriptQuote:
      'This is your starting architecture: one workstation, one monolith server running your app, and one PostgreSQL database. For modest traffic, this is rock solid. But in synchronous communication, the client and server are temporally coupled: both must be alive at the exact same instant.',
    storyNarrative:
      'A server is not a magical black box—it is a process listening on a port. When code calls server.listen(3000), the OS kernel registers the socket to route incoming TCP frames. In the Request-Response model, the client workstation opens a connection, sends an HTTP POST to reserve Seat 14C, and blocks waiting for bytes. Server 1 parses the payload, executes a SQL transaction on PostgreSQL, and returns 200 OK. If the server restarts right now, the client hangs indefinitely until socket timeout.',
    historicalContext: 'Craigslist, Basecamp, and early StackOverflow served millions on a single robust machine with clean request-response semantics.',
    officialReferences: [
      {
        name: 'backendengineer.in',
        topic: 'What is a Server, Really?',
        citation: 'Process, Port, Socket & Request-Response Fundamentals'
      },
      {
        name: 'allahabadi.dev',
        topic: 'Request-Response Pattern Explained From Zero',
        citation: 'Temporal Coupling & Synchronous Communication Costs'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 390, y: 130 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: {
          activeTab: 'Bob',
          seatSelected: '14C',
          price: 85,
          status: 'idle',
          lastLatencyMs: 28
        }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'Server 1 (Monolith)',
        position: { x: 830, y: 130 },
        ports: { inputs: ['in-http'], outputs: ['out-db', 'out-client'] },
        data: {
          instanceName: 'Server 1',
          cpuUsage: 12,
          memoryHeapMb: 240,
          activeSockets: 4,
          maxSockets: 128,
          localSessions: { 'sess_bob_981a': 'Bob' }
        }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB (Primary)',
        position: { x: 1180, y: 130 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: {
          role: 'primary',
          activeConnections: 6,
          maxConnections: 100,
          rowCount: 12480,
          queryTimeMs: 4
        }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-server-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ],
    targetObjective:
      'Click "Confirm & Reserve Seat 14C" on the workstation to trace the complete lifecycle: Browser POST -> Server 1 -> PostgreSQL DB -> WAL write -> 200 OK.',
    requiredConnections: [
      { fromType: 'browser', toType: 'server' },
      { fromType: 'server', toType: 'database' }
    ],
    simulatedTrafficRps: 10,
    quiz: {
      question: 'What does "temporal coupling" mean in the classic Request-Response pattern?',
      options: [
        'The request payload must contain an ISO-8601 UTC timestamp',
        'Both the client and the server must be actively running at the exact same instant, or the exchange completely fails',
        'The database must run on the exact same server as the application code',
        'Requests can only be submitted once per hour'
      ],
      correctIndex: 1,
      explanation:
        'In synchronous Request-Response, the client waits and cannot proceed without the answer. If the server is restarting or down at the instant of the request, nothing happens. A message queue removes this temporal coupling.',
      referenceSource: {
        title: 'allahabadi.dev / Backend System Design',
        chapterOrSection: 'Pattern 01: Request-Response (Temporal Coupling)'
      }
    }
  },

  // LEVEL 2
  {
    id: 'level-2-concurrency-wall',
    levelNumber: 2,
    title: 'Level 2: The 10:00 AM Ticket Drop (The Concurrency Wall)',
    subtitle: 'Traffic Surge & CPU Saturation',
    inOneLine:
      'When request arrival rate exceeds server worker capacity, requests don’t just wait politely—they hold threads hostage until the whole fleet times out.',
    scriptQuote:
      'At 10:00 AM sharp, thousands of fans hit the Tokyo Dome ticket drop simultaneously. Server 1 only has 128 worker slots. When requests arrive faster than the server can process them, queues back up until incoming connections fail with 504 Gateway Timeout.',
    storyNarrative:
      'At 10:00:00 AM, tickets for Tokyo Dome Live 2026 go on sale. 5,000 concert fans hit "Reserve Seat" in the same few seconds. Server 1 has a finite thread pool (128 worker slots). Because each checkout takes 250ms to query PostgreSQL and process payments, the server can only handle ~500 requests per second. With arrival traffic spiking past 650+ req/s, the operating system socket backlog (SOMAXCONN) completely overflows. Requests get held hostage in memory, queuing delay explodes toward infinity (Little’s Law), and every new fan sees 504 Gateway Timeout. A slow dependency is worse than a dead one: slow holds worker threads hostage until the entire server suffocates.',
    historicalContext: 'Little’s Law ($L = \\lambda W$): when arrival rate exceeds service capacity, queue depth grows asymptotically toward infinity.',
    officialReferences: [
      {
        name: 'allahabadi.dev',
        topic: 'Why Slow is Worse Than Dead',
        citation: 'Cascading Failures & Worker Pool Starvation'
      },
      {
        name: 'backendengineer.in',
        topic: 'Latency vs Throughput: The Tradeoff Nobody Names',
        citation: 'The Concurrency Curve & Why 60% Capacity is Safer Than 100%'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 390, y: 130 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: {
          activeTab: 'Bob',
          seatSelected: '14C',
          price: 85,
          status: 'idle',
          lastLatencyMs: 24500
        }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'Server 1 (Overloaded)',
        position: { x: 830, y: 130 },
        ports: { inputs: ['in-http'], outputs: ['out-db', 'out-client'] },
        data: {
          instanceName: 'Server 1',
          cpuUsage: 98,
          memoryHeapMb: 940,
          activeSockets: 128,
          maxSockets: 128,
          localSessions: { 'sess_bob_981a': 'Bob' }
        }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB',
        position: { x: 1180, y: 130 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: {
          role: 'primary',
          activeConnections: 18,
          maxConnections: 100,
          rowCount: 12480,
          queryTimeMs: 140
        }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'congested'
      },
      {
        id: 'wire-server-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ],
    targetObjective:
      'Attempt to reserve a seat during the 10:00 AM ticket drop. Watch Server 1 hit 98% CPU and return 504 Gateway Timeout.',
    requiredConnections: [
      { fromType: 'browser', toType: 'server' },
      { fromType: 'server', toType: 'database' }
    ],
    simulatedTrafficRps: 650,
    quiz: {
      question: 'What happens when incoming traffic rate exceeds a single server’s compute capacity?',
      options: [
        'The CPU automatically triples its clock speed',
        'The OS socket queue fills up, causing packet drops and 504 Gateway Timeouts',
        'The database permanently converts all tables to read-only',
        'Incoming HTTP packets are compressed into single bits'
      ],
      correctIndex: 1,
      explanation:
        'When requests arrive faster than CPU execution time, OS socket buffers fill up, queuing delay spikes exponentially, and requests drop or time out.',
      referenceSource: {
        title: 'Designing Data-Intensive Applications (DDIA)',
        chapterOrSection: 'Chapter 1: Reliability & Load'
      }
    }
  },

  // LEVEL 3
  {
    id: 'level-3-load-balancing',
    levelNumber: 3,
    title: 'Level 3: Horizontal Scaling & The Load Balancer',
    subtitle: 'Running Multiple Copies of Your App',
    inOneLine:
      'Instead of buying an impossibly large machine, place a reverse proxy in front to spread incoming traffic across identical stateless servers.',
    scriptQuote:
      'Instead of making one box stronger, you run several ordinary servers and split the people between them. These are three identical copies of your app running at the same time. But the moment you have more than one server, a request comes in: which server does it go to?',
    storyNarrative:
      'Instead of buying a monster machine (vertical scaling), horizontal scaling runs multiple ordinary servers and splits the load. Why does this work? Statelessness! The server forgets you the instant it replies. Because it remembers nothing, any server can answer any request. An Nginx reverse proxy sits in front, distributing traffic using Least Connections so no worker pool drowns. But the moment a server tries to remember state in its local memory, the illusion shatters.',
    historicalContext: 'Production reverse proxies (Nginx, Envoy, HAProxy) route traffic across stateless worker pools.',
    officialReferences: [
      {
        name: 'backendengineer.in',
        topic: 'Statelessness & Why It Matters',
        citation: 'Phase 0 Fundamentals — Why Forgetting is Why the Web Scales'
      },
      {
        name: 'allahabadi.dev',
        topic: 'Horizontal Scaling & Load Balancing',
        citation: 'Pattern 27 & 28 — The Stateless Fleet'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 390, y: 130 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 32 }
      },
      {
        id: 'node-balancer',
        type: 'balancer',
        title: 'Nginx Load Balancer',
        position: { x: 800, y: 130 },
        ports: { inputs: ['in-client'], outputs: ['out-s1', 'out-s2'] },
        data: { algorithm: 'least-connections', activeConns: 80 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'Server 1 (Instance A)',
        position: { x: 1080, y: 50 },
        ports: { inputs: ['in-http'], outputs: ['out-db'] },
        data: { cpuUsage: 34, activeSockets: 18, maxSockets: 128 }
      },
      {
        id: 'node-server-2',
        type: 'server',
        title: 'Server 2 (Instance B)',
        position: { x: 1080, y: 230 },
        ports: { inputs: ['in-http'], outputs: ['out-db'] },
        data: { cpuUsage: 32, activeSockets: 16, maxSockets: 128 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB',
        position: { x: 1380, y: 130 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { activeConnections: 12, maxConnections: 100, rowCount: 12480, queryTimeMs: 6 }
      }
    ],
    initialWires: [
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
    ],
    targetObjective:
      'Send traffic through the Nginx Load Balancer. Verify CPU drops to ~33% across both instances simultaneously.',
    requiredConnections: [
      { fromType: 'browser', toType: 'balancer' },
      { fromType: 'balancer', toType: 'server' }
    ],
    simulatedTrafficRps: 180,
    quiz: {
      question: 'Why does statelessness enable horizontal scaling across multiple servers?',
      options: [
        'Because stateless servers do not require an operating system',
        'Because if a server remembers nothing about past requests, any identical server can answer any incoming request',
        'Because statelessness disables HTTP error codes',
        'Because statelessness doubles the physical network speed'
      ],
      correctIndex: 1,
      explanation:
        'Statelessness means the server holds zero conversational memory between requests. This allows a load balancer to spread traffic across a hundred servers without caring which machine served the previous click.',
      referenceSource: {
        title: 'backendengineer.in / Fundamentals',
        chapterOrSection: 'Statelessness and Why it Matters'
      }
    }
  },

  // LEVEL 4
  {
    id: 'level-4-stateless-sessions',
    levelNumber: 4,
    title: 'Level 4: The Broken Login (Stateless Sessions & Redis)',
    subtitle: 'Where Did My Session Go?',
    inOneLine:
      'If servers store user sessions in local RAM, routing the next request to another server treats the user like a complete stranger.',
    scriptQuote:
      'Bob logs in. His request lands on Server 1. Server 1 saves his login session in memory. Bob clicks "Buy Ticket". The load balancer sends this second request to Server 2. Server 2 looks in its memory, doesn’t find Bob, and throws 401 Unauthorized. Bob was just logged in a second ago! The solution: stop keeping session memory on individual servers.',
    storyNarrative:
      'Bob logs in on Server 1, and Server 1 saves his session in local process RAM. When Bob clicks "Confirm Seat", the load balancer routes him to Server 2. Server 2 checks its own RAM, finds nothing, and throws 401 Unauthorized! In distributed systems, local server RAM is a silo. The solution: move session tokens out of process memory into an ultra-fast in-memory Redis cluster. Now any server can verify Bob in 1 millisecond.',
    historicalContext: 'Twelve-Factor App rule VI: Execute the app as one or more stateless processes.',
    officialReferences: [
      {
        name: 'backendengineer.in',
        topic: 'Statelessness & Session Management',
        citation: 'Centralized Cache vs In-Memory Sticky Session Traps'
      },
      {
        name: 'allahabadi.dev',
        topic: 'Cache-Aside & Stateless Architecture',
        citation: 'Pattern 14 — Externalizing Ephemeral State'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 50, y: 160 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 35 }
      },
      {
        id: 'node-balancer',
        type: 'balancer',
        title: 'Load Balancer',
        position: { x: 310, y: 160 },
        ports: { inputs: ['in-client'], outputs: ['out-s1', 'out-s2'] },
        data: { algorithm: 'round-robin', activeConns: 60 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'Server 1',
        position: { x: 550, y: 80 },
        ports: { inputs: ['in-http'], outputs: ['out-db', 'out-redis'] },
        data: { cpuUsage: 22, localSessions: { 'sess_bob_981a': 'Bob' } }
      },
      {
        id: 'node-server-2',
        type: 'server',
        title: 'Server 2',
        position: { x: 550, y: 250 },
        ports: { inputs: ['in-http'], outputs: ['out-db', 'out-redis'] },
        data: { cpuUsage: 24, localSessions: {} }
      },
      {
        id: 'node-redis',
        type: 'redis',
        title: 'Redis Session Store',
        position: { x: 800, y: 320 },
        ports: { inputs: ['in-session'], outputs: ['out-ack'] },
        data: { cachedKeys: 1420, cacheHitRate: 99.4, memoryMb: 18 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB',
        position: { x: 860, y: 110 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { activeConnections: 8, maxConnections: 100 }
      }
    ],
    initialWires: [
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
    ],
    targetObjective:
      'Connect both Server 1 and Server 2 to the Centralized Redis Store so Bob remains authenticated regardless of which server answers his request.',
    requiredConnections: [
      { fromType: 'server', toType: 'redis' }
    ],
    simulatedTrafficRps: 80,
    quiz: {
      question: 'What is the danger of storing user session IDs directly in a server’s local RAM?',
      options: [
        'The server runs out of disk storage immediately',
        'If the user’s next request hits a different server copy, they appear logged out (401)',
        'The database drops all primary keys',
        'The browser refuses to accept any CSS styles'
      ],
      correctIndex: 1,
      explanation:
        'In multi-instance horizontal architectures, servers must be stateless. If state is stored locally, any request routed to another instance fails authentication.',
      referenceSource: {
        title: 'The Twelve-Factor App',
        chapterOrSection: 'Factor VI: Processes (Execute the app as stateless processes)'
      }
    }
  },

  // LEVEL 5
  {
    id: 'level-5-database-choke',
    levelNumber: 5,
    title: 'Level 5: The Database Choke (Connection Pooling)',
    subtitle: 'Too Many Sockets in Postgres',
    inOneLine:
      'A database connection is not free—each direct socket costs a separate OS process, 10MB of RAM, and heavy TLS handshakes.',
    scriptQuote:
      'You scaled your servers to 10 instances. Traffic is handled, CPU is cool. But now every server opens 50 connections to PostgreSQL. That’s 500 connections. PostgreSQL forks an OS process for every single socket, eating 10MB each. The database memory explodes and queries crawl to a halt.',
    storyNarrative:
      'Connecting to a database is just another request-response exchange over TCP. But unlike Node.js which handles 50,000 sockets on one thread, PostgreSQL forks a separate POSIX OS process for every socket (eating 10MB RAM each). Establishing a new connection takes 40ms of TCP/TLS handshakes and backend forks. 500 direct sockets cause 5GB of memory thrashing. Connection pooling maintains a warm pool of open sockets, cutting latency to 19ms and shielding the database from socket exhaustion.',
    historicalContext: 'Hussein Nasser benchmark: Direct TLS connection takes 40ms; connection pooling reuses established sockets in 19ms.',
    officialReferences: [
      {
        name: 'backendengineer.in',
        topic: 'Process, Port, Socket & Connection Pooling',
        citation: 'Why Direct Database Sockets Exhaust Server Memory'
      },
      {
        name: 'PostgreSQL Manual Chapter 20',
        topic: 'Resource Consumption & Connections',
        citation: 'Section 20.3: max_connections and shared_buffers'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 50, y: 160 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 40 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'Server Cluster (10x)',
        position: { x: 420, y: 160 },
        ports: { inputs: ['in-http'], outputs: ['out-db'] },
        data: { instanceName: '10 Instances', activeSockets: 180, maxSockets: 200 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB (Crashed)',
        position: { x: 800, y: 160 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { activeConnections: 100, maxConnections: 100, queryTimeMs: 480 }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-server-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'congested'
      }
    ],
    targetObjective:
      'Configure connection pooling (pool.query) to multiplex 180 client sockets onto 20 persistent PostgreSQL processes.',
    requiredConnections: [
      { fromType: 'server', toType: 'database' }
    ],
    simulatedTrafficRps: 240,
    quiz: {
      question: 'Why does PostgreSQL degrade when opening hundreds of direct client connections?',
      options: [
        'PostgreSQL forks a dedicated POSIX operating system process for each connection, causing RAM exhaustion and CPU context switching',
        'PostgreSQL requires manual approval for every socket connection from an administrator',
        'PostgreSQL only supports 1 connection per database',
        'Direct connections invert the endianness of integers'
      ],
      correctIndex: 0,
      explanation:
        'Unlike event-driven servers, PostgreSQL uses a process-based model. Each backend process takes 5–10MB of RAM. High connection counts thrash the CPU in context switches.',
      referenceSource: {
        title: 'PostgreSQL Documentation',
        chapterOrSection: 'Chapter 20: Server Configuration — max_connections'
      }
    }
  },

  // LEVEL 6
  {
    id: 'level-6-cache-stampede',
    levelNumber: 6,
    title: 'Level 6: The Cache Stampede (Redis Cache-Aside)',
    subtitle: '4,800 Identical Queries Crushing Disk',
    inOneLine:
      'The fastest database query is the one you never execute—serve hot reads directly from memory to save your disk from melting.',
    scriptQuote:
      '4,800 users refresh the page to see how many tickets are left. Your servers execute the exact same heavy SQL query: SELECT count(*) FROM tickets WHERE status=\'available\'. Why ask the database 4,800 times for a number that only changes when someone buys? Put Redis in front of the database.',
    storyNarrative:
      'Cache-Aside: check the cache first, and go to the database only if it misses. Reading from Redis RAM takes 1ms; reading from disk takes 14ms. But beware the classic production trap: Cache Stampede (Thundering Herd). When a popular cached key expires, ten thousand concurrent requests miss at the exact same millisecond and hammer the primary database simultaneously. Probabilistic early expiration (XFetch) and single-flight mutexes stop the stampede.',
    historicalContext: 'Facebook NSDI 2013 paper: Memcached leases reduced peak DB query rate from 17,000 QPS to 1,300 QPS.',
    officialReferences: [
      {
        name: 'allahabadi.dev',
        topic: 'Cache-Aside & Cache Stampede Prevention',
        citation: 'Patterns 14 & 18 — How One Expired Key Takes Down a Database'
      },
      {
        name: 'backendengineer.in',
        topic: 'LRU Caches & Hash Maps in Context',
        citation: 'Phase 3 Algorithms — In-Memory Eviction Mechanics'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 50, y: 160 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 12 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'App Server',
        position: { x: 420, y: 160 },
        ports: { inputs: ['in-http'], outputs: ['out-cache', 'out-db'] },
        data: { cpuUsage: 28, activeSockets: 14 }
      },
      {
        id: 'node-redis-cache',
        type: 'redis',
        title: 'Redis Cache (RAM)',
        position: { x: 740, y: 80 },
        ports: { inputs: ['in-cache'], outputs: ['out-miss'] },
        data: { cachedKeys: 420, cacheHitRate: 96.2, memoryMb: 12 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB',
        position: { x: 780, y: 260 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { activeConnections: 12, maxConnections: 100, queryTimeMs: 14 }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-server-cache',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-cache',
        targetNodeId: 'node-redis-cache',
        targetPortId: 'in-cache',
        status: 'active'
      },
      {
        id: 'wire-cache-db',
        sourceNodeId: 'node-redis-cache',
        sourcePortId: 'out-miss',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ],
    targetObjective:
      'Route hot seat-availability queries to Redis Cache. Observe response latency drop from 14ms disk I/O to 1ms in-memory RAM.',
    requiredConnections: [
      { fromType: 'server', toType: 'redis' },
      { fromType: 'redis', toType: 'database' }
    ],
    simulatedTrafficRps: 450,
    quiz: {
      question: 'What is a Cache Stampede (or Thundering Herd)?',
      options: [
        'A bug that deletes all cache memory simultaneously',
        'When a popular cached key expires, and thousands of concurrent requests all hit the primary database at once to recompute it',
        'A memory leak caused by unclosed Redis connections',
        'When CSS files fail to load from CDN'
      ],
      correctIndex: 1,
      explanation:
        'When a hot key expires under load, every concurrent request experiences a cache miss simultaneously and hammers the database. XFetch and single-flight mutexes solve this.',
      referenceSource: {
        title: 'Optimal Probabilistic Cache Stampede Prevention',
        chapterOrSection: 'VLDB 2015 (Vattani et al.) — The XFetch Algorithm'
      }
    }
  },

  // LEVEL 7
  {
    id: 'level-7-slow-checkout-queues',
    levelNumber: 7,
    title: 'Level 7: The Slow Checkout (Asynchronous Worker Queues)',
    subtitle: 'Why Is Checkout Taking 3.2 Seconds?',
    inOneLine:
      'Never make a user wait for work that can happen in the background—acknowledge the checkout immediately and let worker queues handle the heavy lifting.',
    scriptQuote:
      'When the user clicks "Pay", you charge their card, generate a 5-page PDF invoice, send a transactional confirmation email, and log telemetry. The user is staring at a loading spinner for 3.2 seconds. Move slow jobs out of the HTTP request loop into a background queue.',
    storyNarrative:
      'Apply the golden test: "If sending this email or rendering this PDF fails, should the user\'s ticket purchase fail?" Obviously not! So the user should never wait for it. In synchronous Request-Response, waiting is not free—it pins a server worker and socket for 3.2 seconds. Keep only the critical path synchronous (write booking to DB), return 202 Accepted in 18ms, and push PDF and email work to a BullMQ Redis queue where background workers chew through them.',
    historicalContext: 'Enterprise Integration Patterns: Message Queue decoupling between fast synchronous API layers and slow asynchronous worker consumers.',
    officialReferences: [
      {
        name: 'allahabadi.dev',
        topic: 'The Golden Test for Synchronous vs Asynchronous',
        citation: 'Message Queues vs Request-Response: Stop Asking the User to Wait'
      },
      {
        name: 'backendengineer.in',
        topic: 'Synchronous vs Asynchronous Before Touching Code',
        citation: 'Phase 0 Fundamentals — Event Loop & Job Queue Mechanics'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 50, y: 160 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 3200 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'App Server',
        position: { x: 420, y: 160 },
        ports: { inputs: ['in-http'], outputs: ['out-queue', 'out-db'] },
        data: { cpuUsage: 45 }
      },
      {
        id: 'node-queue',
        type: 'queue',
        title: 'BullMQ Job Queue',
        position: { x: 740, y: 280 },
        ports: { inputs: ['in-job'], outputs: ['out-worker'] },
        data: { depth: 4, workersActive: 3 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'PostgreSQL DB',
        position: { x: 740, y: 80 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { activeConnections: 10, maxConnections: 100 }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-server-queue',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-queue',
        targetNodeId: 'node-queue',
        targetPortId: 'in-job',
        status: 'active'
      },
      {
        id: 'wire-server-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ],
    targetObjective:
      'Offload the 3.2s invoice generation and receipt email to BullMQ. The client receives 202 Accepted in under 20ms.',
    requiredConnections: [
      { fromType: 'server', toType: 'queue' }
    ],
    simulatedTrafficRps: 120,
    quiz: {
      question: 'What is the "Golden Rule" for deciding if work belongs in an asynchronous queue?',
      options: [
        'Queue any task that uses more than 10 lines of JavaScript',
        'Ask: "If this call fails, should the user\'s action fail?" If no, it should never be synchronous',
        'Always make every single function call asynchronous including arithmetic',
        'Only queue database SELECT queries'
      ],
      correctIndex: 1,
      explanation:
        'If a secondary action like an email or audit log fails, the purchase itself is still valid. Forcing the user to wait synchronously ties their success to unrelated dependencies.',
      referenceSource: {
        title: 'allahabadi.dev / Patterns',
        chapterOrSection: 'When to Walk Away from Request-Response'
      }
    }
  },

  // LEVEL 8
  {
    id: 'level-8-database-sharding',
    levelNumber: 8,
    title: 'Level 8: The Sharding Wall (Database Partitioning)',
    subtitle: 'The 200 Million Row Barrier',
    inOneLine:
      'When a single database engine runs out of write IOPS, split the table across independent database shards using a deterministic partition key.',
    scriptQuote:
      'Your tickets table reaches 200 million rows. B+ Tree indexes no longer fit in RAM. Every write causes disk thrashing. Read replicas helped read queries, but replicas don’t help writes. You must shard: split the table across multiple physical databases.',
    storyNarrative:
      'When table size exceeds single-node storage and memory index capacity, horizontal sharding splits rows across multiple database instances using shard keys. Why does consistent hashing matter here? Naive modulo hashing (key % N) rehashes 80% of all data when adding one new server! Consistent hashing maps servers and keys onto a circular ring, ensuring adding a shard only migrates 1/(N+1) keys without reshuffling the entire system.',
    historicalContext: 'Vitess (YouTube) and Citus (PostgreSQL) scale relational databases to petabytes via automated vnode sharding.',
    officialReferences: [
      {
        name: 'backendengineer.in',
        topic: 'Consistent Hashing: Why Adding a Server Shouldn\'t Reshuffle Everything',
        citation: 'Phase 3 Algorithms in Context — Circular Hash Rings & Vnodes'
      },
      {
        name: 'allahabadi.dev',
        topic: 'Database Sharding & Partitioning',
        citation: 'Pattern 09 & 10 — Dividing State Under Scale'
      }
    ],
    initialNodes: [
      {
        id: 'node-browser',
        type: 'browser',
        title: 'Client Workstation',
        position: { x: 50, y: 160 },
        ports: { inputs: ['in-resp'], outputs: ['out-req'] },
        data: { activeTab: 'Bob', seatSelected: '14C', price: 85, status: 'idle', lastLatencyMs: 18 }
      },
      {
        id: 'node-server-1',
        type: 'server',
        title: 'App Router / Coordinator',
        position: { x: 420, y: 160 },
        ports: { inputs: ['in-http'], outputs: ['out-db'] },
        data: { cpuUsage: 35 }
      },
      {
        id: 'node-db-primary',
        type: 'database',
        title: 'Sharded Cluster (3 Partitions)',
        position: { x: 800, y: 160 },
        ports: { inputs: ['in-query'], outputs: ['out-data'] },
        data: { isSharded: true, rowCount: 204000000, activeConnections: 24, maxConnections: 300, queryTimeMs: 8 }
      }
    ],
    initialWires: [
      {
        id: 'wire-browser-server',
        sourceNodeId: 'node-browser',
        sourcePortId: 'out-req',
        targetNodeId: 'node-server-1',
        targetPortId: 'in-http',
        status: 'active'
      },
      {
        id: 'wire-server-db',
        sourceNodeId: 'node-server-1',
        sourcePortId: 'out-db',
        targetNodeId: 'node-db-primary',
        targetPortId: 'in-query',
        status: 'active'
      }
    ],
    targetObjective:
      'Execute a ticket purchase across the sharded database cluster. Observe query routing to Partition 2 via hash(user_id) % 3.',
    requiredConnections: [
      { fromType: 'server', toType: 'database' }
    ],
    simulatedTrafficRps: 500,
    quiz: {
      question: 'What is the major architectural penalty of database sharding?',
      options: [
        'You can never store strings in the database again',
        'Cross-shard queries require scatter-gather operations and multi-phase commits (2PC), significantly increasing latency and complexity',
        'All database queries are automatically converted to UDP',
        'Sharding requires every user to have a static IP'
      ],
      correctIndex: 1,
      explanation:
        'When queries cannot be satisfied by a single shard key, the coordinator must scatter queries to all shards and gather the results, bounded by tail latency.',
      referenceSource: {
        title: 'DDIA (Martin Kleppmann)',
        chapterOrSection: 'Chapter 6: Partitioning and Secondary Indexes'
      }
    }
  }
];

