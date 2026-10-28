import { LevelDefinition } from '../types';
import { browserNode, makeNode, makeWire } from './nodeFactory';

// Every level opens with its problem live and the fix unwired: you see it fail,
// then you build the repair. Text only uses concepts from data/concepts.ts that
// this level or an earlier one introduced (checked by utils/conceptLint.ts).

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const CAP = 250;

export const CANVAS_CURRICULUM: LevelDefinition[] = [
  // ─────────────────────────────────────────────── LEVEL 1
  {
    id: 'level-1-starting-system',
    levelNumber: 1,
    title: 'The Starting System',
    subtitle: 'One browser, one server, one database',
    inOneLine:
      'A server is just a program waiting on a port. Bob’s browser sends it a request and then waits, doing nothing else, until the response comes back.',
    storyNarrative:
      'Bob wants seat 14C at Tokyo Dome. His browser is the client: it opens a connection to Server 1 on port 3000 and sends an HTTP request, POST /api/orders. Server 1 isn’t a special machine. It’s a program that called listen(3000) and loops forever waiting for bytes. It can’t keep bookings in its own memory (restart it and that memory is gone), so it sends SQL to a database, PostgreSQL, which writes the row to disk. The answers travel back the way they came: database to server, server to browser, ending in status code 200 OK. Every hop adds latency, and Bob’s browser waits for all of it. Nothing is plugged in yet: press Reserve first and see what happens, then wire it up.',
    introduces: ['client', 'server', 'port', 'connection', 'http', 'request', 'response', 'database', 'sql', 'status-code', 'latency'],
    initialNodes: [
      browserNode(),
      makeNode('node-server-1', 'server', 'Server 1', 460, 150),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 760, 150, { rows: 12480 })
    ],
    initialWires: [],
    simulatedTrafficRps: 1,
    trafficControl: false,
    mechanics: { serverCapacityRps: CAP },
    goals: [
      { kind: 'wire', from: 'node-browser', to: 'node-server-1', label: 'Plug Bob’s computer into Server 1' },
      { kind: 'wire', from: 'node-server-1', to: 'node-db-primary', label: 'Connect Server 1 to the database' },
      { kind: 'outcome', action: 'buy', status: 200, label: 'Reserve a seat and get 200 OK back' }
    ],
    solution: [
      { kind: 'wire', from: 'node-browser', to: 'node-server-1', text: 'Drag from the round jack on the monitor’s right edge and drop on Server 1.' },
      { kind: 'wire', from: 'node-server-1', to: 'node-db-primary', text: 'Drag from Server 1’s right dot and drop on PostgreSQL.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve on Bob’s screen and follow the request hop by hop.' }
    ],
    sources: [
      { name: 'backendengineer.in', title: 'What is a Server, Really?', url: 'https://www.backendengineer.in/topics/what-is-a-server' },
      { name: 'allahabadi.dev', title: 'Request-Response pattern', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'The first message sent over ARPANET, on 29 October 1969, was “LO”. The receiving computer crashed before the rest of “LOGIN” arrived.',
      'The first web server was Tim Berners-Lee’s NeXT computer at CERN. A handwritten label on it read: “This machine is a server. DO NOT POWER IT DOWN!!”',
      'SQL began at IBM in the 1970s as SEQUEL, and was renamed because the name was already someone else’s trademark.'
    ],
    quiz: {
      question: 'Bob presses Reserve while Server 1’s process is restarting. What happens?',
      options: [
        'The request waits inside Server 1 until the process comes back',
        'Nothing is listening on port 3000, so the connection is refused and Bob gets an error',
        'PostgreSQL answers Bob directly instead',
        'The browser saves the booking itself and sends it later'
      ],
      correctIndex: 1,
      explanation:
        'A server is a running process. While it restarts, no program is listening on port 3000, so the operating system refuses the connection straight away. Request-response only works if client and server are both up at the same moment; otherwise the client has to try again.',
      referenceSource: { title: 'allahabadi.dev', chapterOrSection: 'Request-Response pattern' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 2
  {
    id: 'level-2-ticket-drop',
    levelNumber: 2,
    title: 'The 10:00 AM Ticket Drop',
    subtitle: 'More requests than one server can finish',
    inOneLine:
      'A server can only finish so many requests per second. When more arrive than it can finish, they pile up, and everyone waits, not just the extra ones.',
    storyNarrative:
      'At 10:00:00 the tickets go on sale and thousands of fans press Reserve within seconds. Each booking keeps Server 1’s CPU busy for a few milliseconds, so it can finish about 250 requests per second: that is its capacity. Below 250, requests finish as fast as they arrive. Above it the server is overloaded: every second more requests arrive than finish, and the extra ones pile up in memory. Little’s Law says the number of requests inside a system equals the arrival rate times how long each one stays. Push arrivals past capacity and the pile, and so the wait, grows every second. Bob’s request joins the back of the pile until his browser gives up: 504 Gateway Timeout. Nothing crashed. Server 1 is busy every millisecond, just never with Bob. There is no fix in this level: break it on purpose and watch how it fails.',
    introduces: ['rps', 'capacity', 'cpu', 'overload', 'timeout', 'littles-law'],
    initialNodes: [
      browserNode(),
      makeNode('node-server-1', 'server', 'Server 1', 460, 150),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 760, 150, { rows: 12481 })
    ],
    initialWires: [makeWire('node-browser', 'node-server-1'), makeWire('node-server-1', 'node-db-primary')],
    simulatedTrafficRps: 40,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP },
    goals: [
      { kind: 'traffic', minRps: 400, label: 'Drag traffic to the 10:00 AM rush: 400+ requests per second' },
      { kind: 'outcome', action: 'buy', status: 504, label: 'Reserve during the rush and see what Bob gets' }
    ],
    solution: [
      { kind: 'traffic', rps: 450, text: 'Drag the traffic slider above 400 requests per second and watch Server 1’s CPU.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve and watch the request wait at Server 1.' }
    ],
    sources: [
      { name: 'backendengineer.in', title: 'Latency vs Throughput: The Tradeoff Nobody Names', url: 'https://www.backendengineer.in/topics/latency-vs-throughput' },
      { name: 'allahabadi.dev', title: 'Why slow is worse than dead', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' }
    ],
    facts: [
      'Little’s Law was proved by John Little in 1961. It holds for almost anything that things enter and leave: shops, highways, servers.',
      'The first version of HTTP (0.9, 1991) had exactly one method, GET, and no status codes at all.'
    ],
    quiz: {
      question: 'Server 1 finishes 250 requests per second and 400 arrive every second. After 10 seconds, about how many are waiting?',
      options: [
        'None: it catches up eventually',
        'About 1,500: 150 more pile up every second and none of them leave early',
        'About 400',
        'About 250'
      ],
      correctIndex: 1,
      explanation:
        '400 arrive and 250 finish each second, so 150 are added to the pile every second: 1,500 after 10 seconds. By Little’s Law the wait grows with the pile, which is why every new request, Bob’s included, ends in a timeout instead of only “the extra 150”.',
      referenceSource: { title: 'backendengineer.in', chapterOrSection: 'Latency vs Throughput' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 3
  {
    id: 'level-3-second-copy',
    levelNumber: 3,
    title: 'Run a Second Copy',
    subtitle: 'Horizontal scaling and the load balancer',
    inOneLine:
      'You can’t buy a CPU twice as fast, but you can run a second copy of the same program and send half the requests to each.',
    storyNarrative:
      'Making Server 1 bigger is vertical scaling: it works until you reach the biggest machine money can buy. Horizontal scaling runs another instance of the exact same program on a second machine. Server 2 is already running, but Bob’s browser can only connect to one address, so a load balancer (Nginx, in most real setups) sits in front. It accepts every request and forwards each one to an instance. Round-robin is the simplest rule: first request to Server 1, next to Server 2, then back to Server 1. Traffic is still at the 10:00 AM rush, 450 requests per second, and right now all of it goes to Server 1, so Reserve times out. Split across two instances it’s 225 each, under the 250 capacity. Server 2 needs its own connection to the database too.',
    introduces: ['vertical-scaling', 'horizontal-scaling', 'instance', 'load-balancer', 'round-robin'],
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-server-1', 'server', 'Server 1', 710, 40),
      makeNode('node-server-2', 'server', 'Server 2', 710, 300),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 980, 170, { rows: 12481 })
    ],
    initialWires: [makeWire('node-browser', 'node-server-1'), makeWire('node-server-1', 'node-db-primary')],
    simulatedTrafficRps: 450,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP },
    goals: [
      { kind: 'wire', from: 'node-browser', to: 'node-balancer', label: 'Move Bob’s cable to the load balancer' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-1', label: 'Load balancer → Server 1' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-2', label: 'Load balancer → Server 2' },
      { kind: 'wire', from: 'node-server-2', to: 'node-db-primary', label: 'Server 2 → PostgreSQL' },
      { kind: 'outcome', action: 'buy', status: 200, minRps: 400, label: 'Reserve during the rush (400+ requests per second) and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-browser', to: 'node-balancer', text: 'Drag from the monitor’s jack to the load balancer. The old cable comes out by itself: one jack, one cable.' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-1', text: 'Drag from the load balancer’s right dot to Server 1.' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-2', text: 'Drag from the load balancer’s right dot to Server 2.' },
      { kind: 'wire', from: 'node-server-2', to: 'node-db-primary', text: 'Drag from Server 2’s right dot to PostgreSQL.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve: the rush is still on, and now it holds.' }
    ],
    sources: [
      { name: 'ByteByteGo', title: 'Top 6 Load Balancing Algorithms Every Developer Should Know', url: yt('dBmxNsS3BGE') },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'Nginx was written by Igor Sysoev to handle 10,000 simultaneous connections on one machine, a challenge named “the C10k problem” in 1999.',
      'For about a year info.cern.ch was the only web server in the world. The first one in America, at SLAC in California, went up in December 1991.'
    ],
    quiz: {
      question:
        'Two instances, each with a capacity of 250 requests per second, sit behind a round-robin load balancer. What’s the most traffic they can take before requests pile up?',
      options: ['250 requests per second', '500 requests per second', '1,000 requests per second', 'No limit: the load balancer absorbs the rest'],
      correctIndex: 1,
      explanation:
        'Round-robin gives each instance half the requests, so each reaches its 250 limit when 500 arrive in total. Past that you’re back in Level 2, just with two piles. The load balancer only forwards requests; it doesn’t do the work.',
      referenceSource: { title: 'ByteByteGo', chapterOrSection: 'Top 6 Load Balancing Algorithms Every Developer Should Know' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 4
  {
    id: 'level-4-broken-login',
    levelNumber: 4,
    title: 'The Broken Login',
    subtitle: 'Where did Bob’s session go?',
    inOneLine: 'If a server keeps who-you-are in its own memory, the next request that lands on a different instance meets a stranger.',
    storyNarrative:
      'Bob logged in a minute ago and that request happened to land on Server 1. Server 1 created a session, 8f3a → Bob, kept it in its own process memory, and gave the browser a cookie holding sid=8f3a. The browser sends that cookie with every request. Press Reserve twice: round-robin sends the first to Server 1, which knows Bob, and the second to Server 2, which looks up 8f3a in its own memory, finds nothing and answers 401 Unauthorized. Server 1 is stateful: it holds something the other instance doesn’t. The fix is to make both instances stateless. Move sessions out of process memory into Redis, a separate in-memory key-value store that every instance connects to. Then any instance can look up 8f3a in under a millisecond.',
    introduces: ['session', 'cookie', '401', 'stateless', 'redis'],
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-server-1', 'server', 'Server 1', 710, 40, { localSessions: ['Bob'] }),
      makeNode('node-server-2', 'server', 'Server 2', 710, 300, { localSessions: [] }),
      makeNode('node-redis', 'redis', 'Redis sessions', 980, 300, { role: 'session' }),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 980, 40, { rows: 12482 })
    ],
    initialWires: [
      makeWire('node-browser', 'node-balancer'),
      makeWire('node-balancer', 'node-server-1'),
      makeWire('node-balancer', 'node-server-2'),
      makeWire('node-server-1', 'node-db-primary'),
      makeWire('node-server-2', 'node-db-primary')
    ],
    simulatedTrafficRps: 200,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, sessions: true },
    goals: [
      { kind: 'wire', from: 'node-server-1', to: 'node-redis', label: 'Server 1 → Redis' },
      { kind: 'wire', from: 'node-server-2', to: 'node-redis', label: 'Server 2 → Redis' },
      { kind: 'outcome', action: 'buy', status: 200, servedBy: 'node-server-2', label: 'Get a 200 OK answered by Server 2' }
    ],
    solution: [
      { kind: 'wire', from: 'node-server-1', to: 'node-redis', text: 'Drag from Server 1’s right dot to Redis, so the session it created is stored there.' },
      { kind: 'wire', from: 'node-server-2', to: 'node-redis', text: 'Drag from Server 2’s right dot to Redis, so it can look sessions up there.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve twice: round-robin sends one of them to Server 2.' }
    ],
    sources: [
      { name: 'The Twelve-Factor App', title: 'VI. Processes: execute the app as one or more stateless processes', url: 'https://12factor.net/processes' },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'Cookies were invented in 1994 by Lou Montulli at Netscape, so an online shopping cart could remember what you’d put in it.',
      'Redis was written by Salvatore Sanfilippo in 2009 to make his own real-time web analytics product fast enough.'
    ],
    quiz: {
      question: 'Instead of Redis, you configure the load balancer to always send Bob to Server 1. What breaks?',
      options: [
        'Nothing: this is just as good',
        'When Server 1 restarts, every session in its memory is gone and those users are logged out',
        'Server 2 receives all the traffic',
        'The browser stops sending cookies'
      ],
      correctIndex: 1,
      explanation:
        'Pinning each user to one instance (often called sticky sessions) hides the problem but keeps the servers stateful. Restart or remove Server 1 and everyone it remembered is a stranger again. With sessions in Redis, any instance can disappear and nobody is logged out.',
      referenceSource: { title: 'The Twelve-Factor App', chapterOrSection: 'VI. Processes' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 5
  {
    id: 'level-5-too-many-connections',
    levelNumber: 5,
    title: 'Too Many Connections',
    subtitle: 'Four instances, one PostgreSQL',
    inOneLine:
      'PostgreSQL runs a whole process for every connection, so it caps them, and a handful of instances each opening their own blow straight through the cap.',
    storyNarrative:
      'Traffic kept growing, so you now run 4 instances behind the load balancer. From here on they’re drawn as one box: the fleet. Each instance opens 30 connections to PostgreSQL so it can run 30 queries at once: 4 × 30 = 120. PostgreSQL works differently from your server. It starts a separate operating-system process for every connection, 5–10 MB of memory each, so it enforces a connection limit: max_connections = 100. Connection 101 is refused with “FATAL: sorry, too many clients already”, and Bob’s booking fails with 500. A connection pool such as PgBouncer sits between the fleet and the database. It keeps 20 real connections open and lets every instance borrow one for the few milliseconds a query takes, then hand it back. Opening a brand-new connection costs around 40 ms of back-and-forth before the first query; borrowing an open one skips that.',
    introduces: ['fleet', 'connection-limit', 'connection-pool'],
    hiddenInfra: ['sessions'],
    hiddenNote: 'The Redis session store from Level 4 is still running. It’s hidden here so the database problem is easier to see.',
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-fleet', 'server', 'App fleet', 710, 170, { instances: 4, connsPerInstance: 30 }),
      makeNode('node-pool', 'pool', 'PgBouncer', 980, 330, { poolSize: 20 }),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 1250, 170, { rows: 1_204_480, maxConnections: 100 })
    ],
    initialWires: [
      makeWire('node-browser', 'node-balancer'),
      makeWire('node-balancer', 'node-fleet'),
      makeWire('node-fleet', 'node-db-primary')
    ],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-pool', label: 'App fleet → PgBouncer' },
      { kind: 'wire', from: 'node-pool', to: 'node-db-primary', label: 'PgBouncer → PostgreSQL' },
      { kind: 'noWire', fromType: 'server', toType: 'database', label: 'Cut the fleet’s direct wire to PostgreSQL' },
      { kind: 'outcome', action: 'buy', status: 200, label: 'Reserve and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-pool', text: 'Drag from the fleet’s right dot to PgBouncer.' },
      { kind: 'wire', from: 'node-pool', to: 'node-db-primary', text: 'Drag from PgBouncer’s right dot to PostgreSQL.' },
      { kind: 'unwire', from: 'node-fleet', to: 'node-db-primary', text: 'Hover the direct fleet → PostgreSQL wire and click the ✕ in its middle.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve: the query now borrows one of PgBouncer’s connections.' }
    ],
    sources: [
      { name: 'Hussein Nasser', title: 'Connection Pooling in PostgreSQL with NodeJS (Performance Numbers)', url: yt('GTeCtIoV2Tw') },
      { name: 'Arjay McCandless', title: 'What is Connection Pooling?', url: yt('qIS5lNj1b5w') },
      { name: 'PostgreSQL docs', title: 'Connections and Authentication: max_connections', url: 'https://www.postgresql.org/docs/current/runtime-config-connection.html' }
    ],
    facts: [
      'PostgreSQL grew out of POSTGRES, a research project Michael Stonebraker started at UC Berkeley in 1986.',
      'PgBouncer was written at Skype around 2007, back when Skype’s backend ran on PostgreSQL.'
    ],
    quiz: {
      question: 'PgBouncer keeps 20 connections open. What does it actually save?',
      options: [
        'It merges 20 queries into one before sending them',
        'It skips opening a new connection per query and keeps PostgreSQL under its connection limit',
        'It stores query results in memory so PostgreSQL is asked less often',
        'It makes PostgreSQL read the disk faster'
      ],
      correctIndex: 1,
      explanation:
        'A common belief is that pooling batches queries. It doesn’t: each query still runs on its own. What it removes is the cost of opening connections (about 40 ms each in Hussein Nasser’s Node.js benchmark, against about 19 ms with a pool) and the hundreds of PostgreSQL processes that direct connections would create.',
      referenceSource: { title: 'Hussein Nasser', chapterOrSection: 'Connection Pooling in PostgreSQL with NodeJS (Performance Numbers)' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 6
  {
    id: 'level-6-read-flood',
    levelNumber: 6,
    title: 'Everyone Hits Refresh',
    subtitle: 'The same question, 3,000 times a second',
    inOneLine:
      'When the same expensive answer is asked for thousands of times a second and only changes when someone books, work it out once and keep a copy in memory.',
    storyNarrative:
      'Every fan keeps refreshing the seat map. Each refresh runs SELECT count(*) FROM seats WHERE status = ‘free’, a query that walks every seat row. That’s 3,000 identical queries a second, and PostgreSQL can finish about 800. PgBouncer protects the connection limit, not the database’s CPU: queries wait their turn, and refreshes and bookings alike time out. The system is read-heavy: thousands of reads for every write. A cache fixes it. This Redis is used differently from the session store: the server first asks it for seats:free. If the copy is there (a hit), it answers in about 1 ms and PostgreSQL is never asked. If not (a miss), it runs the count once, stores the answer with a TTL of 5 seconds, and returns it. PostgreSQL now runs the count about once every 5 seconds. What breaks next: when that copy expires, every request misses at the same moment and they all hit the database together. That is a cache stampede.',
    introduces: ['read-heavy', 'cache', 'ttl', 'cache-stampede'],
    hiddenInfra: ['sessions'],
    hiddenNote: 'The Redis session store is still running, hidden.',
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-fleet', 'server', 'App fleet', 710, 170, { instances: 14, connsPerInstance: 30 }),
      makeNode('node-cache', 'redis', 'Redis cache', 980, 10, { role: 'cache' }),
      makeNode('node-pool', 'pool', 'PgBouncer', 980, 330, { poolSize: 20 }),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 1250, 330, { rows: 1_904_220, maxConnections: 100, queryCapacity: 800 })
    ],
    initialWires: [
      makeWire('node-browser', 'node-balancer'),
      makeWire('node-balancer', 'node-fleet'),
      makeWire('node-fleet', 'node-pool'),
      makeWire('node-pool', 'node-db-primary')
    ],
    simulatedTrafficRps: 3000,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true, readHeavy: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-cache', label: 'App fleet → Redis cache' },
      { kind: 'outcome', action: 'browse', status: 200, minRps: 2000, label: 'Refresh the seat map during the flood and get 200 OK' },
      { kind: 'outcome', action: 'buy', status: 200, minRps: 2000, label: 'Reserve a seat during the flood and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-cache', text: 'Drag from the fleet’s right dot to the Redis cache.' },
      { kind: 'click', action: 'browse', text: 'Press ↻ next to “Free seats” on Bob’s screen. The first time is a miss; press it again for a hit.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve: PostgreSQL has room for bookings again.' }
    ],
    sources: [
      { name: 'Hello Interview', title: '4 Ways to Fix Cache Stampede', url: yt('MPFkGLZGe9M') },
      { name: 'Yash Mantri', title: 'Cache Stampede and How to Prevent It', url: yt('WGiHw5Ioi1g') }
    ],
    facts: [
      'Memcached, the cache much of the early web leaned on, was written by Brad Fitzpatrick in 2003 for LiveJournal.',
      'Facebook’s 2013 paper “Scaling Memcache at Facebook” describes leases: only one request may recompute an expired copy while the rest wait for it.'
    ],
    quiz: {
      question: 'The free-seat count is cached with a 5-second TTL. A fan books seat 14C. What can other fans see for up to 5 seconds?',
      options: [
        'The new count, immediately',
        'The old count: the cached copy only changes when its TTL runs out',
        'An error page',
        'Nothing until PostgreSQL restarts'
      ],
      correctIndex: 1,
      explanation:
        'A cache trades freshness for speed. A free-seat counter up to 5 seconds old is fine; the booking itself still goes straight to PostgreSQL, so two fans can never get the same seat. Choosing a TTL is choosing how stale an answer you can live with.',
      referenceSource: { title: 'Hello Interview', chapterOrSection: '4 Ways to Fix Cache Stampede' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 7
  {
    id: 'level-7-slow-checkout',
    levelNumber: 7,
    title: 'The Slow Checkout',
    subtitle: 'Why does booking take 3.2 seconds?',
    inOneLine: 'Ask of every step: if this fails, should the booking fail? If not, the user shouldn’t be waiting for it.',
    storyNarrative:
      'After saving the booking, the server renders a PDF ticket (1.8 s) and sends a confirmation email through an email provider (1.4 s). All of it is synchronous: one step, wait, the next step, wait, and only then the response. Bob stares at a spinner for 3.2 seconds while an instance sits blocked. Apply the test: if the email fails, should Bob lose his seat? No. Then he shouldn’t wait for it. Make it asynchronous: save the booking (the part that must succeed), add a job “send ticket to user 42, seat 14C” to a job queue (BullMQ, which keeps jobs in Redis), and respond straight away. A separate worker process takes jobs off the queue and does the slow part a moment later. If the email provider is down, the job waits and is retried; the booking is already safe.',
    introduces: ['synchronous', 'asynchronous', 'job-queue', 'worker'],
    hiddenInfra: ['sessions', 'cache'],
    hiddenNote: 'The session store and the seat-count cache are still running, hidden.',
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-fleet', 'server', 'App fleet', 710, 170, { instances: 4, connsPerInstance: 30 }),
      makeNode('node-pool', 'pool', 'PgBouncer', 980, 60, { poolSize: 20 }),
      makeNode('node-queue', 'queue', 'Job queue', 980, 340),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 1250, 60, { rows: 2_310_904, maxConnections: 100 })
    ],
    initialWires: [
      makeWire('node-browser', 'node-balancer'),
      makeWire('node-balancer', 'node-fleet'),
      makeWire('node-fleet', 'node-pool'),
      makeWire('node-pool', 'node-db-primary')
    ],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true, slowSideEffects: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-queue', label: 'App fleet → job queue' },
      { kind: 'outcome', action: 'buy', status: 200, maxLatencyMs: 500, label: 'Reserve and get 200 OK in under 500 ms' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-queue', text: 'Drag from the fleet’s right dot to the job queue.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve: the answer comes back right away, and the email lands a moment later.' }
    ],
    sources: [
      { name: 'allahabadi.dev', title: 'Request-Response: the test that actually works', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' },
      { name: 'ByteByteGo', title: 'Kafka Basics & Message Queue Architecture', url: yt('Bc6oyURRIxQ') }
    ],
    facts: [
      'Ray Tomlinson sent the first network email in 1971 and picked “@” to separate the user from the machine. Email has always been store-and-forward: nobody waits for delivery.',
      'IBM shipped MQSeries in 1993. Banks used queues like it so a system that went down could catch up later without losing a single transfer.'
    ],
    quiz: {
      question: 'Which step must stay synchronous inside the booking request?',
      options: [
        'Sending the confirmation email',
        'Rendering the PDF ticket',
        'Writing the booking row to PostgreSQL',
        'Recording that Bob pressed Reserve, for analytics'
      ],
      correctIndex: 2,
      explanation:
        'Use the test: if this fails, should the booking fail? Only for the database write: if it fails, Bob has no seat and must be told now. The email, the PDF and the analytics can fail and be retried later without changing whether Bob has a seat, so they go on the queue.',
      referenceSource: { title: 'allahabadi.dev', chapterOrSection: 'Request-Response: the test that actually works' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 8
  {
    id: 'level-8-sharding-wall',
    levelNumber: 8,
    title: 'The Sharding Wall',
    subtitle: '210 million rows on one disk',
    inOneLine:
      'When one database holds too many rows to search quickly, split the rows across several databases and let each row’s key decide which one holds it.',
    storyNarrative:
      'Three tours later the bookings table holds 210 million rows. To find rows by user_id quickly, PostgreSQL keeps an index, a sorted B-tree, and an index is only fast while it fits in RAM. At 210 million rows it doesn’t, so every booking reads index pages from disk and takes about 2.4 seconds. A bigger machine buys time (vertical scaling again, with the same ceiling). Sharding splits the table across three independent PostgreSQL databases, each holding a slice of the rows. The shard key decides where a row lives: shard = user_id % 3. Bob is user 42, and 42 % 3 = 0, so his bookings always live on Shard A. Each shard’s index is a third of the size and fits in RAM again. The cost: a question that isn’t about one user_id (“who booked seat 14C?”) has to be asked of every shard and the answers merged.',
    introduces: ['index', 'shard', 'shard-key', 'consistent-hashing'],
    hiddenInfra: ['sessions', 'cache', 'queue', 'pool'],
    hiddenNote: 'The session store, cache, job queue and PgBouncer are still running, hidden. Each shard has its own PgBouncer.',
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-fleet', 'server', 'App fleet', 710, 170, { instances: 4 }),
      makeNode('node-shard-a', 'database', 'Shard A', 980, -20, { shard: 'A', rows: 210_000_000 }),
      makeNode('node-shard-b', 'database', 'Shard B', 980, 190, { shard: 'B', rows: 0 }),
      makeNode('node-shard-c', 'database', 'Shard C', 980, 400, { shard: 'C', rows: 0 })
    ],
    initialWires: [
      makeWire('node-browser', 'node-balancer'),
      makeWire('node-balancer', 'node-fleet'),
      makeWire('node-fleet', 'node-shard-a')
    ],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, sharding: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-b', label: 'App fleet → Shard B' },
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-c', label: 'App fleet → Shard C' },
      { kind: 'outcome', action: 'buy', status: 200, maxLatencyMs: 200, label: 'Reserve and get 200 OK in under 200 ms' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-b', text: 'Drag from the fleet’s right dot to Shard B. With two shards each still holds 105 million rows.' },
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-c', text: 'Drag from the fleet’s right dot to Shard C: 70 million rows each.' },
      { kind: 'click', action: 'buy', text: 'Press Reserve and watch 42 % 3 pick Shard A.' }
    ],
    sources: [
      { name: 'Gaurav Sen', title: 'What is DATABASE SHARDING?', url: yt('5faMjKuB9bc') },
      { name: 'ByteByteGo', title: 'Consistent Hashing | Algorithms You Should Know #1', url: yt('UF9Iqmg94tk') }
    ],
    facts: [
      'The B-tree was invented by Rudolf Bayer and Edward McCreight at Boeing’s research labs in 1970. Nobody agrees what the B stands for.',
      'The word “shard” is often traced to Ultima Online (1997), whose separate game worlds were explained as shards of a shattered gem.',
      'Consistent hashing was published at MIT in 1997 by David Karger and colleagues, and became the foundation of Akamai.'
    ],
    quiz: {
      question: 'You add a 4th shard and change the rule to user_id % 4. What happens to Bob (user 42)?',
      options: [
        'Nothing changes for Bob',
        '42 % 4 = 2, so his bookings are now looked for on Shard C, where they don’t exist until rows are moved',
        'His bookings are copied to every shard automatically',
        'PostgreSQL refuses the new rule'
      ],
      correctIndex: 1,
      explanation:
        'Plain modulo ties every row to the number of shards. Change 3 to 4 and most user_ids now map to a different shard, so most rows have to move before anyone can find their bookings. Consistent hashing is the placement rule designed for this: adding one shard moves only about 1/(N+1) of the rows.',
      referenceSource: { title: 'DDIA (Martin Kleppmann)', chapterOrSection: 'Chapter 6: Partitioning' }
    }
  }
];
