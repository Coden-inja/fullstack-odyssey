import { LevelDefinition } from '../types';
import { browserNode, makeNode, makeWire } from './nodeFactory';
import { PERSONA } from './story';

// Every level opens with its problem live and the fix unwired: you see it fail,
// then you build the repair. Text only uses concepts from data/concepts.ts that
// this level or an earlier one introduced (checked by utils/conceptLint.ts).
// The setting (who, which train, which site) lives in data/story.ts.

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const CAP = 250;
const G = PERSONA.name;

export const CANVAS_CURRICULUM: LevelDefinition[] = [
  // ─────────────────────────────────────────────── LEVEL 1
  {
    id: 'level-1-first-request',
    levelNumber: 1,
    title: `${G}’s First Request`,
    subtitle: 'One browser, one server, one database',
    inOneLine: `A server is just a program waiting on a port. ${G}’s browser sends it a request and then waits, doing nothing else, until the response comes back.`,
    storyNarrative: `${G} from Indore needs a berth on tomorrow’s Avantika Express to Mumbai. His browser is the client: it opens a connection to Server 1 on port 3000 and sends an HTTP request, POST /api/bookings. Server 1 isn’t a special machine. It’s a program that called listen(3000) and loops forever waiting for bytes. It can’t keep bookings in its own memory (restart it and that memory is gone), so it sends SQL to a database, PostgreSQL, which writes the row to disk. The answers travel back the way they came: database to server, server to browser, ending in status code 200 OK. Every hop adds latency, and ${G}’s browser waits for all of it. Nothing is plugged in yet: press Book first and see what happens, then wire it up.`,
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
      { kind: 'wire', from: 'node-browser', to: 'node-server-1', label: `Plug ${G}’s computer into Server 1` },
      { kind: 'wire', from: 'node-server-1', to: 'node-db-primary', label: 'Connect Server 1 to the database' },
      { kind: 'outcome', action: 'buy', status: 200, label: 'Book a berth and get 200 OK back' }
    ],
    solution: [
      { kind: 'wire', from: 'node-browser', to: 'node-server-1', text: 'Drag from the round jack on the monitor’s right edge and drop on Server 1.' },
      { kind: 'wire', from: 'node-server-1', to: 'node-db-primary', text: 'Drag from Server 1’s right dot and drop on PostgreSQL.' },
      { kind: 'click', action: 'buy', text: `Press Book on ${G}’s screen and follow the request hop by hop.` }
    ],
    sources: [
      { name: 'backendengineer.in', title: 'What is a Server, Really?', url: 'https://www.backendengineer.in/topics/what-is-a-server' },
      { name: 'allahabadi.dev', title: 'Request-Response pattern', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'India got public internet on 15 August 1995, when VSNL opened dial-up access to everyone.',
      'IRCTC started selling train tickets online in 2002. Before that, every berth was booked at a counter window.',
      'The first message sent over ARPANET, in October 1969, was “LO”. The receiving computer crashed before the rest of “LOGIN” arrived.'
    ],
    quiz: {
      question: `${G} presses Book while Server 1’s process is restarting. What happens?`,
      options: [
        'The request waits inside Server 1 until the process comes back',
        'Nothing is listening on port 3000, so the connection is refused and he gets an error',
        'PostgreSQL answers the browser directly instead',
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
    id: 'level-2-tatkal',
    levelNumber: 2,
    title: '10:00 AM: Tatkal Opens',
    subtitle: 'More requests than one server can finish',
    inOneLine: 'A server can only finish so many requests per second. When more arrive than it can finish, the extra ones pile up, and everyone behind them waits longer and longer.',
    storyNarrative: `AC Tatkal opens at 10:00 AM sharp, and lakhs of people press Book in the same few seconds. Each booking keeps Server 1’s CPU busy for a few milliseconds, so it can finish about 250 requests per second: that is its capacity. Below 250, requests finish as fast as they arrive. Above it the server is overloaded: every second more arrive than finish, and the extra ones wait in line in memory. Watch the crowd above ${G}’s monitor and the line in front of Server 1. Little’s Law says the number of requests inside a system equals the arrival rate times how long each one stays. Push arrivals past capacity and the line, and so the wait, grows every second. ${G}’s request joins the back of it, and once the wait reaches 10 seconds his browser gives up: 504 Gateway Timeout. Nothing crashed. Server 1 is busy every millisecond, just not with ${G}. There is no fix in this level: break it on purpose and watch how it fails.`,
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
      { kind: 'outcome', action: 'buy', status: 504, label: `Book during the rush and see what ${G} gets` }
    ],
    solution: [
      { kind: 'traffic', rps: 450, text: 'Drag the traffic slider above 400 requests per second and watch the line in front of Server 1 grow.' },
      { kind: 'click', action: 'buy', text: `Press Book and watch ${G}’s place in line.` }
    ],
    sources: [
      { name: 'backendengineer.in', title: 'Latency vs Throughput: The Tradeoff Nobody Names', url: 'https://www.backendengineer.in/topics/latency-vs-throughput' },
      { name: 'allahabadi.dev', title: 'Why slow is worse than dead', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' }
    ],
    facts: [
      'The Tatkal scheme for last-minute train bookings began in 1997. Since 2015, AC Tatkal opens at 10:00 AM and non-AC at 11:00 AM.',
      'Little’s Law was proved by John Little in 1961. It holds for almost anything that things enter and leave: ticket windows, toll plazas, servers.'
    ],
    quiz: {
      question: 'Server 1 finishes 250 requests per second and 400 arrive every second. After 10 seconds, about how many are waiting?',
      options: ['None: it catches up eventually', 'About 1,500: 150 more pile up every second and none of them leave early', 'About 400', 'About 250'],
      correctIndex: 1,
      explanation:
        '400 arrive and 250 finish each second, so 150 are added to the line every second: 1,500 after 10 seconds. By Little’s Law the wait grows with the line, which is why every new request ends in a timeout, not only “the extra 150”.',
      referenceSource: { title: 'backendengineer.in', chapterOrSection: 'Latency vs Throughput' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 3
  {
    id: 'level-3-second-copy',
    levelNumber: 3,
    title: 'Run a Second Copy',
    subtitle: 'Horizontal scaling and the load balancer',
    inOneLine: 'You can’t buy a CPU twice as fast, but you can run a second copy of the same program and send half the requests to each.',
    storyNarrative: `Making Server 1 bigger is vertical scaling: it works until you reach the biggest machine money can buy. Horizontal scaling runs another instance of the exact same program on a second machine. Server 2 is already running, but ${G}’s browser can only connect to one address, so a load balancer (Nginx, in most real setups) sits in front. It accepts every request and forwards each one to an instance. Round-robin is the simplest rule: first request to Server 1, next to Server 2, then back to Server 1. Tatkal traffic is still at 450 requests per second and all of it goes to Server 1, so its line is full and bookings time out. Split across two instances it’s 225 each, under the 250 capacity, and you’ll watch both lines drain. Server 2 needs its own connection to the database too.`,
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
      { kind: 'wire', from: 'node-browser', to: 'node-balancer', label: `Move ${G}’s cable to the load balancer` },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-1', label: 'Load balancer → Server 1' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-2', label: 'Load balancer → Server 2' },
      { kind: 'wire', from: 'node-server-2', to: 'node-db-primary', label: 'Server 2 → PostgreSQL' },
      { kind: 'outcome', action: 'buy', status: 200, minRps: 400, label: 'Book during the rush (400+ requests per second) and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-browser', to: 'node-balancer', text: 'Drag from the monitor’s jack to the load balancer. The old cable comes out by itself: one jack, one cable.' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-1', text: 'Drag from the load balancer’s right dot to Server 1.' },
      { kind: 'wire', from: 'node-balancer', to: 'node-server-2', text: 'Drag from the load balancer’s right dot to Server 2.' },
      { kind: 'wire', from: 'node-server-2', to: 'node-db-primary', text: 'Drag from Server 2’s right dot to PostgreSQL.' },
      { kind: 'click', action: 'buy', text: 'Press Book. If Server 1 is still clearing its old line, the next press goes to Server 2.' }
    ],
    sources: [
      { name: 'ByteByteGo', title: 'Top 6 Load Balancing Algorithms Every Developer Should Know', url: yt('dBmxNsS3BGE') },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'In October 2014 Flipkart’s first Big Billion Day sale buckled under the traffic, and its founders emailed every customer an apology the next day.',
      'Nginx was written by Igor Sysoev to handle 10,000 simultaneous connections on one machine, a challenge named “the C10k problem” in 1999.'
    ],
    quiz: {
      question: 'Two instances, each with a capacity of 250 requests per second, sit behind a round-robin load balancer. What’s the most traffic they can take before requests pile up?',
      options: ['250 requests per second', '500 requests per second', '1,000 requests per second', 'No limit: the load balancer absorbs the rest'],
      correctIndex: 1,
      explanation:
        'Round-robin gives each instance half the requests, so each reaches its 250 limit when 500 arrive in total. Past that you’re back in Level 2, just with two lines. The load balancer only forwards requests; it doesn’t do the work.',
      referenceSource: { title: 'ByteByteGo', chapterOrSection: 'Top 6 Load Balancing Algorithms Every Developer Should Know' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 4
  {
    id: 'level-4-logged-out',
    levelNumber: 4,
    title: 'Logged Out Mid-Booking',
    subtitle: '“Session expired, please log in again”',
    inOneLine: 'If a server keeps who-you-are in its own memory, the next request that lands on a different instance meets a stranger.',
    storyNarrative: `${G} logged in a minute ago and that request happened to land on Server 1. Server 1 created a session, 8f3a → ${G}, kept it in its own process memory, and gave the browser a cookie holding sid=8f3a. The browser sends that cookie with every request. Press Book twice: round-robin sends the first to Server 1, which knows ${G}, and the second to Server 2, which looks up 8f3a in its own memory, finds nothing and answers 401 Unauthorized. ${G} sees the most hated screen in Indian rail booking, “Session expired, please log in again”, while his berth slips away. Server 1 is stateful: it holds something the other instance doesn’t. The fix is to make both instances stateless. Move sessions out of process memory into Redis, a separate in-memory key-value store that every instance connects to. Then any instance can look up 8f3a in under a millisecond.`,
    introduces: ['session', 'cookie', '401', 'stateless', 'redis'],
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-server-1', 'server', 'Server 1', 710, 40, { localSessions: [G] }),
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
      { kind: 'click', action: 'buy', text: 'Press Book twice: round-robin sends one of them to Server 2.' }
    ],
    sources: [
      { name: 'The Twelve-Factor App', title: 'VI. Processes: execute the app as one or more stateless processes', url: 'https://12factor.net/processes' },
      { name: 'JavaScript Mastery', title: 'How Senior Engineers Actually Think About System Design & Architecture', url: yt('EaXHfuHRWwg') }
    ],
    facts: [
      'Hotmail, one of the first free web email services, was co-founded in 1996 by Sabeer Bhatia, who grew up in Bengaluru.',
      'Cookies were invented in 1994 by Lou Montulli at Netscape, so an online shopping cart could remember what you’d put in it.'
    ],
    quiz: {
      question: `Instead of Redis, you configure the load balancer to always send ${G} to Server 1. What breaks?`,
      options: [
        'Nothing: this is just as good',
        'When Server 1 restarts, every session in its memory is gone and all those users are logged out',
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
    inOneLine: 'PostgreSQL runs a whole process for every connection, so it caps them, and a handful of instances each opening their own blow straight through the cap.',
    storyNarrative: `Traffic kept growing, so you now run 4 instances behind the load balancer. From here on they’re drawn as one box: the fleet. Each instance opens 30 connections to PostgreSQL so it can run 30 queries at once: 4 × 30 = 120. PostgreSQL works differently from your server. It starts a separate operating-system process for every connection, 5–10 MB of memory each, so it enforces a connection limit: max_connections = 100. Connection 101 is refused with “FATAL: sorry, too many clients already”, and ${G}’s booking fails with 500. A connection pool such as PgBouncer sits between the fleet and the database. It keeps 20 real connections open and lets every instance borrow one for the few milliseconds a query takes, then hand it back. Opening a brand-new connection costs around 40 ms of back-and-forth before the first query; borrowing an open one skips that.`,
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
    initialWires: [makeWire('node-browser', 'node-balancer'), makeWire('node-balancer', 'node-fleet'), makeWire('node-fleet', 'node-db-primary')],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-pool', label: 'App fleet → PgBouncer' },
      { kind: 'wire', from: 'node-pool', to: 'node-db-primary', label: 'PgBouncer → PostgreSQL' },
      { kind: 'noWire', fromType: 'server', toType: 'database', label: 'Cut the fleet’s direct wire to PostgreSQL' },
      { kind: 'outcome', action: 'buy', status: 200, label: 'Book and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-pool', text: 'Drag from the fleet’s right dot to PgBouncer.' },
      { kind: 'wire', from: 'node-pool', to: 'node-db-primary', text: 'Drag from PgBouncer’s right dot to PostgreSQL.' },
      { kind: 'unwire', from: 'node-fleet', to: 'node-db-primary', text: 'Hover the direct fleet → PostgreSQL wire and click the ✕ in its middle.' },
      { kind: 'click', action: 'buy', text: 'Press Book: the query now borrows one of PgBouncer’s connections.' }
    ],
    sources: [
      { name: 'Hussein Nasser', title: 'Connection Pooling in PostgreSQL with NodeJS (Performance Numbers)', url: yt('GTeCtIoV2Tw') },
      { name: 'Arjay McCandless', title: 'What is Connection Pooling?', url: yt('qIS5lNj1b5w') },
      { name: 'PostgreSQL docs', title: 'Connections and Authentication: max_connections', url: 'https://www.postgresql.org/docs/current/runtime-config-connection.html' }
    ],
    facts: [
      'C-DOT, set up in 1984 under Sam Pitroda, built the digital telephone exchanges that took phone lines to small-town India.',
      'PostgreSQL grew out of POSTGRES, a research project Michael Stonebraker started at UC Berkeley in 1986.'
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
    id: 'level-6-availability-flood',
    levelNumber: 6,
    title: 'Everyone Checks Availability',
    subtitle: 'The same question, 3,000 times a second',
    inOneLine: 'When the same expensive answer is asked for thousands of times a second and only changes when someone books, work it out once and keep a copy in memory.',
    storyNarrative: `Nobody books blind. Everyone keeps pressing Refresh on “AVL 12” for coach B2, hoping it doesn’t turn into a waiting list. Each check runs SELECT count(*) FROM berths WHERE coach = ‘B2’ AND status = ‘free’, a query that walks every berth row. That’s 3,000 identical queries a second, and PostgreSQL can finish about 800, so a line of queries builds up in front of the database, and checks and bookings alike time out behind it. PgBouncer protects the connection limit, not the database’s CPU. The system is read-heavy: thousands of reads for every write. A cache fixes it. This Redis is used differently from the session store: the server first asks it for avail:B2. If the copy is there (a hit), it answers in about 1 ms and PostgreSQL is never asked. If not (a miss), it runs the count once, stores the answer with a TTL of 5 seconds, and returns it. PostgreSQL now runs the count about once every 5 seconds, and you’ll watch its line drain. What breaks next: when that copy expires, every request misses at the same moment and they all hit the database together. That is a cache stampede.`,
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
    initialWires: [makeWire('node-browser', 'node-balancer'), makeWire('node-balancer', 'node-fleet'), makeWire('node-fleet', 'node-pool'), makeWire('node-pool', 'node-db-primary')],
    simulatedTrafficRps: 3000,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true, readHeavy: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-cache', label: 'App fleet → Redis cache' },
      { kind: 'outcome', action: 'browse', status: 200, minRps: 2000, label: 'Check availability during the flood and get 200 OK' },
      { kind: 'outcome', action: 'buy', status: 200, minRps: 2000, label: 'Book a berth during the flood and get 200 OK' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-cache', text: 'Drag from the fleet’s right dot to the Redis cache, then watch PostgreSQL’s line drain.' },
      { kind: 'click', action: 'browse', text: `Press Refresh next to availability on ${G}’s screen. The first time is a miss; press it again for a hit.` },
      { kind: 'click', action: 'buy', text: 'Press Book: PostgreSQL has room for bookings again.' }
    ],
    sources: [
      { name: 'Hello Interview', title: '4 Ways to Fix Cache Stampede', url: yt('MPFkGLZGe9M') },
      { name: 'Yash Mantri', title: 'Cache Stampede and How to Prevent It', url: yt('WGiHw5Ioi1g') }
    ],
    facts: [
      'When Coldplay’s India concert tickets went on sale in September 2024, more than a crore people reportedly waited in line online at the same moment.',
      'Memcached, the cache much of the early web leaned on, was written by Brad Fitzpatrick in 2003 for LiveJournal.'
    ],
    quiz: {
      question: 'Availability for coach B2 is cached with a 5-second TTL. Someone books berth 12. What can everyone else see for up to 5 seconds?',
      options: ['The new count, immediately', 'The old count: the cached copy only changes when its TTL runs out', 'An error page', 'Nothing until PostgreSQL restarts'],
      correctIndex: 1,
      explanation:
        'A cache trades freshness for speed. An availability count up to 5 seconds old is fine; the booking itself still goes straight to PostgreSQL, so two people can never get the same berth. Choosing a TTL is choosing how stale an answer you can live with.',
      referenceSource: { title: 'Hello Interview', chapterOrSection: '4 Ways to Fix Cache Stampede' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 7
  {
    id: 'level-7-e-ticket',
    levelNumber: 7,
    title: 'Waiting for the E-Ticket',
    subtitle: 'Why does booking take 3.2 seconds?',
    inOneLine: 'Ask of every step: if this fails, should the booking fail? If not, the user shouldn’t be waiting for it.',
    storyNarrative: `After saving the booking, the server makes the PDF e-ticket (1.8 s) and sends the confirmation SMS and email (1.4 s). All of it is synchronous: one step, wait, the next step, wait, and only then the response. ${G} stares at a spinner for 3.2 seconds, scared to press Back, while an instance sits blocked. Apply the test: if the SMS fails, should ${G} lose his berth? No. Then he shouldn’t wait for it. Make it asynchronous: save the booking (the part that must succeed), add a job “send e-ticket to user 42, berth 12” to a job queue (BullMQ, which keeps jobs in Redis), and respond straight away. A separate worker process takes jobs off the queue and does the slow part a moment later. If the SMS gateway is down, the job waits and is retried; the booking is already safe.`,
    introduces: ['synchronous', 'asynchronous', 'job-queue', 'worker'],
    hiddenInfra: ['sessions', 'cache'],
    hiddenNote: 'The session store and the availability cache are still running, hidden.',
    initialNodes: [
      browserNode(),
      makeNode('node-balancer', 'balancer', 'Load balancer', 440, 170),
      makeNode('node-fleet', 'server', 'App fleet', 710, 170, { instances: 4, connsPerInstance: 30 }),
      makeNode('node-pool', 'pool', 'PgBouncer', 980, 60, { poolSize: 20 }),
      makeNode('node-queue', 'queue', 'Job queue', 980, 340),
      makeNode('node-db-primary', 'database', 'PostgreSQL', 1250, 60, { rows: 2_310_904, maxConnections: 100 })
    ],
    initialWires: [makeWire('node-browser', 'node-balancer'), makeWire('node-balancer', 'node-fleet'), makeWire('node-fleet', 'node-pool'), makeWire('node-pool', 'node-db-primary')],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, connectionLimit: true, slowSideEffects: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-queue', label: 'App fleet → job queue' },
      { kind: 'outcome', action: 'buy', status: 200, maxLatencyMs: 500, label: 'Book and get 200 OK in under 500 ms' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-queue', text: 'Drag from the fleet’s right dot to the job queue.' },
      { kind: 'click', action: 'buy', text: 'Press Book: the answer comes back right away, and the e-ticket lands a moment later.' }
    ],
    sources: [
      { name: 'allahabadi.dev', title: 'Request-Response: the test that actually works', url: 'https://allahabadi.dev/backend-system-design/patterns/request-response/' },
      { name: 'ByteByteGo', title: 'Kafka Basics & Message Queue Architecture', url: yt('Bc6oyURRIxQ') }
    ],
    facts: [
      'UPI went live in 2016. By August 2023 it was handling more than 1,000 crore payments a month.',
      'Ray Tomlinson sent the first network email in 1971 and picked “@” to separate the user from the machine. Email has always been store-and-forward: nobody waits for delivery.'
    ],
    quiz: {
      question: 'Which step must stay synchronous inside the booking request?',
      options: ['Sending the confirmation SMS', 'Making the PDF e-ticket', 'Writing the booking row to PostgreSQL', `Recording that ${G} pressed Book, for analytics`],
      correctIndex: 2,
      explanation: `Use the test: if this fails, should the booking fail? Only for the database write: if it fails, ${G} has no berth and must be told now. The SMS, the PDF and the analytics can fail and be retried later without changing whether he has a berth, so they go on the queue.`,
      referenceSource: { title: 'allahabadi.dev', chapterOrSection: 'Request-Response: the test that actually works' }
    }
  },

  // ─────────────────────────────────────────────── LEVEL 8
  {
    id: 'level-8-sharding-wall',
    levelNumber: 8,
    title: 'The 21-Crore-Row Wall',
    subtitle: 'Too many bookings for one database',
    inOneLine: 'When one database holds too many rows to search quickly, split the rows across several databases and let each row’s key decide which one holds it.',
    storyNarrative: `A few years of Tatkal later, the bookings table holds 21 crore rows. To find rows by user_id quickly, PostgreSQL keeps an index, a sorted B-tree, and an index is only fast while it fits in RAM. At 21 crore rows it doesn’t, so every booking reads index pages from disk and takes about 2.4 seconds. A bigger machine buys time (vertical scaling again, with the same ceiling). Sharding splits the table across three independent PostgreSQL databases, each holding a slice of the rows. The shard key decides where a row lives: shard = user_id % 3. ${G} is user 42, and 42 % 3 = 0, so his bookings always live on Shard A. Each shard’s index is a third of the size and fits in RAM again. The cost: a question that isn’t about one user_id (“who booked berth 12 on today’s train?”) has to be asked of every shard and the answers merged.`,
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
    initialWires: [makeWire('node-browser', 'node-balancer'), makeWire('node-balancer', 'node-fleet'), makeWire('node-fleet', 'node-shard-a')],
    simulatedTrafficRps: 600,
    trafficControl: true,
    mechanics: { serverCapacityRps: CAP, sharding: true },
    goals: [
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-b', label: 'App fleet → Shard B' },
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-c', label: 'App fleet → Shard C' },
      { kind: 'outcome', action: 'buy', status: 200, maxLatencyMs: 200, label: 'Book and get 200 OK in under 200 ms' }
    ],
    solution: [
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-b', text: 'Drag from the fleet’s right dot to Shard B. With two shards each still holds 10.5 crore rows.' },
      { kind: 'wire', from: 'node-fleet', to: 'node-shard-c', text: 'Drag from the fleet’s right dot to Shard C: 7 crore rows each.' },
      { kind: 'click', action: 'buy', text: 'Press Book and watch 42 % 3 pick Shard A.' }
    ],
    sources: [
      { name: 'Gaurav Sen', title: 'What is DATABASE SHARDING?', url: yt('5faMjKuB9bc') },
      { name: 'ByteByteGo', title: 'Consistent Hashing | Algorithms You Should Know #1', url: yt('UF9Iqmg94tk') }
    ],
    facts: [
      'PARAM 8000, India’s first supercomputer, was built by C-DAC in 1991 after India was refused the import of a Cray.',
      'The B-tree was invented by Rudolf Bayer and Edward McCreight at Boeing’s research labs in 1970. Nobody agrees what the B stands for.',
      'Consistent hashing was published at MIT in 1997 by David Karger and colleagues, and became the foundation of Akamai.'
    ],
    quiz: {
      question: `You add a 4th shard and change the rule to user_id % 4. What happens to ${G} (user 42)?`,
      options: [
        'Nothing changes for him',
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
