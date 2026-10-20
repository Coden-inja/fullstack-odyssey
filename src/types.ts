export type ModuleId =
  | 'event-loop'
  | 'middleware'
  | 'rest-api'
  | 'sql-joins'
  | 'orm-queries'
  | 'auth-jwt'
  | 'redis-queues'
  | 'rsc-streaming'
  | 'git-dag'
  | 'cicd-pipeline';

export interface ModuleMeta {
  id: ModuleId;
  number: number;
  title: string;
  category: 'Runtime' | 'Networking' | 'Database' | 'Security' | 'Architecture' | 'DevOps';
  summary: string;
  tag: string;
  icon: string;
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'event-loop',
    number: 1,
    title: 'Node.js Event Loop & libuv',
    category: 'Runtime',
    summary: 'Call Stack, Microtask queue (Promises/nextTick), Macrotask queue (Timers), and libuv thread pool offloading.',
    tag: 'libuv / Async',
    icon: '⚡'
  },
  {
    id: 'middleware',
    number: 2,
    title: 'Express Middleware Onion',
    category: 'Networking',
    summary: 'Request context propagation through chained middleware functions, next() call frames, and error boundaries.',
    tag: 'HTTP Pipeline',
    icon: '🧅'
  },
  {
    id: 'rest-api',
    number: 3,
    title: 'REST & API Contract Sandbox',
    category: 'Networking',
    summary: 'HTTP status state machines (200, 201, 400, 401, 403, 404, 429), header negotiation, and CORS preflight OPTIONS.',
    tag: 'REST / RFC 7231',
    icon: '🌐'
  },
  {
    id: 'sql-joins',
    number: 4,
    title: 'SQL Relational Joins & Venn',
    category: 'Database',
    summary: 'Interactive table joins (INNER, LEFT, RIGHT, FULL OUTER) with foreign keys and visual row matching intersections.',
    tag: 'PostgreSQL / SQL',
    icon: '🗄️'
  },
  {
    id: 'orm-queries',
    number: 5,
    title: 'ORM Query Building & N+1',
    category: 'Database',
    summary: 'Translating ORM chains (Prisma/Drizzle) into compiled SQL, detecting the N+1 query trap and connection pools.',
    tag: 'Prisma / AST',
    icon: '🔍'
  },
  {
    id: 'auth-jwt',
    number: 6,
    title: 'Auth, Sessions & JWT Rotation',
    category: 'Security',
    summary: 'HttpOnly Secure SameSite cookie exchange, RS256 token verification, and refresh token rotation on token expiry.',
    tag: 'RS256 / Cookies',
    icon: '🔐'
  },
  {
    id: 'redis-queues',
    number: 7,
    title: 'Redis Queues & Background Workers',
    category: 'Architecture',
    summary: 'BullMQ / Redis Streams producer-consumer queue with active/waiting/failed states and Dead Letter Queues (DLQ).',
    tag: 'BullMQ / Redis',
    icon: '📨'
  },
  {
    id: 'rsc-streaming',
    number: 8,
    title: 'React Server Components (RSC)',
    category: 'Architecture',
    summary: 'Server/client component boundary, React Flight protocol payload streaming, Suspense, and hydration islands.',
    tag: 'RSC / Streaming',
    icon: '⚛️'
  },
  {
    id: 'git-dag',
    number: 9,
    title: 'Git Directed Acyclic Graph (DAG)',
    category: 'Architecture',
    summary: '100% in-memory GitEngine: commit tree nodes, parent pointers, branch tags, animated HEAD re-pointing and rebasing.',
    tag: 'Git Merkle Tree',
    icon: '🌿'
  },
  {
    id: 'cicd-pipeline',
    number: 10,
    title: 'CI/CD & Edge Deployment',
    category: 'DevOps',
    summary: 'GitHub Actions workflow runner, test/lint matrix parallelization, Docker layer caching, and Vercel edge distribution.',
    tag: 'CI/CD / Edge',
    icon: '🚀'
  }
];
