// The vocabulary ledger. A level may only use a term once the level that
// introduces it has been reached — utils/conceptLint.ts enforces this.
// Definitions themselves may only lean on concepts from the same or earlier levels.

export interface Concept {
  id: string;
  term: string;
  aliases: string[];
  level: number;
  definition: string;
}

export const CONCEPTS: Concept[] = [
  // ── Level 1 ──────────────────────────────────────────────
  {
    id: 'client',
    term: 'client',
    aliases: [],
    level: 1,
    definition: 'The program that starts the conversation. Here it is Bob’s browser.'
  },
  {
    id: 'server',
    term: 'server',
    aliases: ['servers'],
    level: 1,
    definition:
      'Just a program running in a loop, waiting for someone to talk to it. Stop the process and the machine is no longer a server.'
  },
  {
    id: 'port',
    term: 'port',
    aliases: [],
    level: 1,
    definition:
      'A number (0–65535) the operating system uses to hand incoming bytes to the right process. listen(3000) claims port 3000.'
  },
  {
    id: 'connection',
    term: 'connection',
    aliases: ['connections', 'socket'],
    level: 1,
    definition:
      'An open two-way line of bytes between two programs (a TCP socket). Opening one takes a few back-and-forth messages first.'
  },
  {
    id: 'http',
    term: 'HTTP',
    aliases: [],
    level: 1,
    definition: 'The text format browsers and servers use: a method (GET, POST), a path (/api/orders), headers and a body.'
  },
  {
    id: 'request',
    term: 'request',
    aliases: ['requests'],
    level: 1,
    definition: 'One message from the client asking the server to do something, e.g. POST /api/orders.'
  },
  {
    id: 'response',
    term: 'response',
    aliases: ['responses'],
    level: 1,
    definition: 'The server’s reply to one request: a status code plus a body.'
  },
  {
    id: 'database',
    term: 'database',
    aliases: ['PostgreSQL', 'Postgres'],
    level: 1,
    definition:
      'A separate program that keeps data on disk so it survives restarts. Servers send it SQL over a connection.'
  },
  {
    id: 'sql',
    term: 'SQL',
    aliases: [],
    level: 1,
    definition: 'The language for asking a database to read or write rows: SELECT, INSERT, UPDATE.'
  },
  {
    id: 'status-code',
    term: 'status code',
    aliases: ['200 OK', '500'],
    level: 1,
    definition:
      'The 3-digit number at the top of every response. 2xx: it worked. 4xx: the request was the problem. 5xx: the server failed.'
  },
  {
    id: 'latency',
    term: 'latency',
    aliases: [],
    level: 1,
    definition: 'How long one request takes from click to answer, in milliseconds (ms).'
  },

  // ── Level 2 ──────────────────────────────────────────────
  {
    id: 'rps',
    term: 'requests per second',
    aliases: ['req/s', 'traffic'],
    level: 2,
    definition: 'How many requests arrive each second. At 10:00 AM it jumps from a handful to hundreds.'
  },
  {
    id: 'capacity',
    term: 'capacity',
    aliases: [],
    level: 2,
    definition:
      'The most requests per second a server can finish. Past it, requests arrive faster than they complete and pile up.'
  },
  {
    id: 'cpu',
    term: 'CPU',
    aliases: [],
    level: 2,
    definition: 'The chip that runs the server’s code. At 100% it cannot start anything new until something finishes.'
  },
  {
    id: 'overload',
    term: 'overload',
    aliases: ['overloaded'],
    level: 2,
    definition: 'Arrivals exceed capacity. The pile of waiting requests, and the wait itself, grow every second.'
  },
  {
    id: 'timeout',
    term: 'timeout',
    aliases: ['504', 'Gateway Timeout', 'timed out', 'times out'],
    level: 2,
    definition:
      'Giving up after waiting too long. 504 Gateway Timeout means whoever was waiting for an answer stopped waiting.'
  },
  {
    id: 'littles-law',
    term: 'Little’s Law',
    aliases: ["Little's Law"],
    level: 2,
    definition:
      'Requests inside a system = arrival rate × time each one spends there. If arrivals beat capacity, both keep growing.'
  },

  // ── Level 3 ──────────────────────────────────────────────
  {
    id: 'vertical-scaling',
    term: 'vertical scaling',
    aliases: [],
    level: 3,
    definition: 'Buying a bigger machine. Simple, but there is always a biggest machine, and its price climbs fast.'
  },
  {
    id: 'horizontal-scaling',
    term: 'horizontal scaling',
    aliases: [],
    level: 3,
    definition: 'Running more copies of the same server program on more machines instead of one bigger machine.'
  },
  {
    id: 'instance',
    term: 'instance',
    aliases: ['instances'],
    level: 3,
    definition: 'One running copy of your server program. Server 1 and Server 2 are two instances of the same code.'
  },
  {
    id: 'load-balancer',
    term: 'load balancer',
    aliases: ['balancer', 'Nginx'],
    level: 3,
    definition:
      'A program that receives every request and forwards it to one of several instances, so the browser only needs one address.'
  },
  {
    id: 'round-robin',
    term: 'round-robin',
    aliases: ['round robin'],
    level: 3,
    definition: 'The simplest forwarding rule: request 1 to Server 1, request 2 to Server 2, request 3 back to Server 1…'
  },

  // ── Level 4 ──────────────────────────────────────────────
  {
    id: 'session',
    term: 'session',
    aliases: ['sessions'],
    level: 4,
    definition: 'What a server remembers about you between requests, e.g. “session 8f3a belongs to Bob”.'
  },
  {
    id: 'cookie',
    term: 'cookie',
    aliases: ['sid'],
    level: 4,
    definition: 'A small value the browser stores and sends back with every request. Here: Bob’s session id, sid=8f3a.'
  },
  {
    id: '401',
    term: '401 Unauthorized',
    aliases: ['401'],
    level: 4,
    definition: 'Status code meaning “I don’t know who you are.” The request needs a session the server recognises.'
  },
  {
    id: 'stateless',
    term: 'stateless',
    aliases: ['stateful'],
    level: 4,
    definition:
      'A stateless server keeps nothing about users in its own memory between requests, so any instance can answer anyone. A stateful one does.'
  },
  {
    id: 'redis',
    term: 'Redis',
    aliases: [],
    level: 4,
    definition:
      'A separate in-memory key-value store: SET key value, GET key. Answers in under a millisecond, and every instance can connect to the same one.'
  },

  // ── Level 5 ──────────────────────────────────────────────
  {
    id: 'fleet',
    term: 'fleet',
    aliases: [],
    level: 5,
    definition: 'All instances of your server together. From Level 5 on they are drawn as one box.'
  },
  {
    id: 'connection-limit',
    term: 'connection limit',
    aliases: ['max_connections', 'too many clients'],
    level: 5,
    definition:
      'PostgreSQL runs a whole operating-system process per connection (5–10 MB each), so it refuses new ones past max_connections (100 by default).'
  },
  {
    id: 'connection-pool',
    term: 'connection pool',
    aliases: ['pool', 'pooling', 'PgBouncer', 'pooled'],
    level: 5,
    definition:
      'A small set of already-open database connections that many requests take turns borrowing for a few milliseconds each.'
  },

  // ── Level 6 ──────────────────────────────────────────────
  {
    id: 'read-heavy',
    term: 'read-heavy',
    aliases: [],
    level: 6,
    definition: 'Far more reads than writes. The free-seat count is read thousands of times for every booking.'
  },
  {
    id: 'cache',
    term: 'cache',
    aliases: ['cached', 'caching', 'cache hit', 'cache miss'],
    level: 6,
    definition:
      'A copy of an expensive answer kept in memory. A hit means the copy was there; a miss means you compute it and store it.'
  },
  {
    id: 'ttl',
    term: 'TTL',
    aliases: [],
    level: 6,
    definition: 'Time to live: how many seconds a cached copy is kept before it is thrown away and recomputed.'
  },
  {
    id: 'cache-stampede',
    term: 'cache stampede',
    aliases: ['thundering herd'],
    level: 6,
    definition:
      'When a popular cached copy expires, every request misses at the same moment and they all hit the database together.'
  },

  // ── Level 7 ──────────────────────────────────────────────
  {
    id: 'synchronous',
    term: 'synchronous',
    aliases: [],
    level: 7,
    definition: 'The caller waits for each step to finish before doing anything else.'
  },
  {
    id: 'asynchronous',
    term: 'asynchronous',
    // not 'async': it is a JavaScript keyword in every level's server code
    aliases: [],
    level: 7,
    definition: 'The caller hands the work off and carries on. The work finishes later, somewhere else.'
  },
  {
    id: 'job-queue',
    term: 'job queue',
    aliases: ['queue', 'queued', 'BullMQ'],
    level: 7,
    definition: 'A list of jobs waiting to be done, stored outside the server (here in Redis) so they survive restarts.'
  },
  {
    id: 'worker',
    term: 'worker',
    aliases: ['workers'],
    level: 7,
    definition: 'A separate process that takes jobs off the queue one by one and does the slow work.'
  },

  // ── Level 8 ──────────────────────────────────────────────
  {
    id: 'index',
    term: 'index',
    aliases: ['B-tree'],
    level: 8,
    definition:
      'A sorted structure the database keeps so it can find a row without reading the whole table. Fast while it fits in RAM.'
  },
  {
    id: 'shard',
    term: 'shard',
    aliases: ['shards', 'sharding', 'sharded', 'partitioning'],
    level: 8,
    definition: 'One of several independent databases, each holding a slice of the rows.'
  },
  {
    id: 'shard-key',
    term: 'shard key',
    aliases: ['modulo'],
    level: 8,
    definition: 'The column that decides which shard a row lives on. Rule here: shard = user_id % number_of_shards.'
  },
  {
    id: 'consistent-hashing',
    term: 'consistent hashing',
    aliases: [],
    level: 8,
    definition:
      'A placement rule where adding one shard moves only about 1/(N+1) of the rows, instead of most of them as with plain modulo.'
  }
];

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);

export const conceptsUpTo = (level: number) => CONCEPTS.filter((c) => c.level <= level);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One regex per concept, matching the term or any alias as a whole word
export const conceptPattern = (c: Concept) =>
  new RegExp(`(?<![\\w-])(${[c.term, ...c.aliases].map(escape).join('|')})(?![\\w-])`, 'i');
