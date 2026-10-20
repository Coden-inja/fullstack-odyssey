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

export type Category = 'All' | 'Runtime' | 'Networking' | 'Database' | 'Security' | 'Architecture' | 'DevOps';

export interface ModuleMeta {
  id: ModuleId;
  number: string;
  title: string;
  category: 'Runtime' | 'Networking' | 'Database' | 'Security' | 'Architecture' | 'DevOps';
  tagline: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estTime: string;
  icon: string;
  accentColor: string;
  keySkills: string[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'event-loop',
    number: '01',
    title: 'Node.js Event Loop & libuv',
    category: 'Runtime',
    tagline: 'V8 Single Thread, Microtask Priority & Thread Pool IO',
    summary: 'Master asynchronous non-blocking execution. Step line-by-line through JavaScript code and watch frames push to the Call Stack, microtasks jump the queue, and libuv threads handle heavy IO.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    icon: '⚡',
    accentColor: '#6366f1',
    keySkills: ['Call Stack', 'process.nextTick()', 'Promise Jobs', 'Timers', 'libuv C++ Pool']
  },
  {
    id: 'middleware',
    number: '02',
    title: 'Express Middleware Onion',
    category: 'Networking',
    tagline: 'Request Context Lifecycle & Error Handling Boundaries',
    summary: 'Understand how HTTP requests traverse sequential handler layers. Step through next() calls, inspect mutated request contexts, and watch unhandled errors leap directly to error boundaries.',
    difficulty: 'Beginner',
    estTime: '10 mins',
    icon: '🧅',
    accentColor: '#10b981',
    keySkills: ['Request Context', 'next() Propagation', 'CORS & Body Parsing', 'Error Interceptors']
  },
  {
    id: 'rest-api',
    number: '03',
    title: 'REST & API Contract Sandbox',
    category: 'Networking',
    tagline: 'HTTP/1.1 RFC 7231 State Machine & CORS Preflights',
    summary: 'Build and dispatch real HTTP requests like in Postman. Test status code semantics (200, 201, 204, 400, 401, 404, 429), header negotiations, idempotency rules, and CORS OPTIONS handshakes.',
    difficulty: 'Beginner',
    estTime: '12 mins',
    icon: '🌐',
    accentColor: '#06b6d4',
    keySkills: ['RFC 7231 Status Codes', 'Idempotency', 'CORS Preflight OPTIONS', 'Header Contracts']
  },
  {
    id: 'sql-joins',
    number: '04',
    title: 'SQL Relational Joins & Venn Diagrams',
    category: 'Database',
    tagline: 'Relational Set Theory, Foreign Keys & Row Intersections',
    summary: 'Demystify SQL joins with real data tables. Toggle INNER, LEFT, RIGHT, and FULL OUTER joins while interactive Venn diagrams visually highlight intersecting foreign key matches and NULL padding.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    icon: '🗄️',
    accentColor: '#3b82f6',
    keySkills: ['INNER JOIN', 'LEFT / RIGHT OUTER', 'Foreign Key Mapping', 'NULL Handling', 'Cartesian Product']
  },
  {
    id: 'orm-queries',
    number: '05',
    title: 'ORM Query Compilation & N+1 Problem',
    category: 'Database',
    tagline: 'Prisma/Drizzle AST Compilation & Connection Pooling',
    summary: 'See how high-level TypeScript ORM chains compile into raw SQL. Trigger the dreaded N+1 query performance bug, monitor database connection pool exhaustion, and apply DataLoader batching fixes.',
    difficulty: 'Advanced',
    estTime: '18 mins',
    icon: '🔍',
    accentColor: '#f59e0b',
    keySkills: ['AST Query Generation', 'N+1 Loop Detection', 'DataLoader Batching', 'Connection Pools']
  },
  {
    id: 'auth-jwt',
    number: '06',
    title: 'Auth, Sessions & JWT Rotation',
    category: 'Security',
    tagline: 'RS256 Asymmetric Cryptography & HttpOnly Cookie Shield',
    summary: 'Inspect the 3-part anatomy of a JSON Web Token. Experience how HttpOnly SameSite cookies shield against XSS, verify asymmetric public key signatures, and execute silent refresh token rotations.',
    difficulty: 'Advanced',
    estTime: '20 mins',
    icon: '🔐',
    accentColor: '#ec4899',
    keySkills: ['RS256 Signature', 'JWT Claims', 'HttpOnly Secure Cookies', 'Token Refresh Rotation', 'XSS/CSRF Defense']
  },
  {
    id: 'redis-queues',
    number: '07',
    title: 'Redis Queues & Background Workers',
    category: 'Architecture',
    tagline: 'BullMQ Distributed Streams & Dead Letter Queues',
    summary: 'Offload blocking tasks from web threads to distributed Redis workers. Monitor job lifecycles across Waiting, Active, and Completed states, set worker concurrency, and route repeated failures to the DLQ.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    icon: '📨',
    accentColor: '#ef4444',
    keySkills: ['Producer-Consumer', 'Distributed Locks', 'Concurrency Scaling', 'Exponential Backoff', 'Dead Letter Queue (DLQ)']
  },
  {
    id: 'rsc-streaming',
    number: '08',
    title: 'React Server Components & Streaming SSR',
    category: 'Architecture',
    tagline: 'Server-Client Boundary, Flight Protocol & Hydration',
    summary: 'Understand modern Next.js 15 rendering. Watch the server stream initial HTML skeletons, inspect the raw Flight wire protocol payload as database queries resolve, and see client hydration islands activate.',
    difficulty: 'Advanced',
    estTime: '18 mins',
    icon: '⚛️',
    accentColor: '#8b5cf6',
    keySkills: ['Server Components', 'React Flight Protocol', 'Suspense Boundaries', 'Streaming SSR', 'Client Hydration Islands']
  },
  {
    id: 'git-dag',
    number: '09',
    title: 'Git Merkle DAG Visualizer',
    category: 'Architecture',
    tagline: 'Directed Acyclic Graphs, Pointer Movements & Rebasing',
    summary: 'Inspired by LearnGitBranching. An in-memory GitEngine where you type simulated commands (commit, branch, checkout, merge) and watch SVG commit nodes, parent SHA pointers, and HEAD re-point in real-time.',
    difficulty: 'Intermediate',
    estTime: '20 mins',
    icon: '🌿',
    accentColor: '#10b981',
    keySkills: ['Merkle DAG', 'Parent Pointers', 'HEAD Ref Tracking', 'Fast-Forward Merge', '3-Way Resolution']
  },
  {
    id: 'cicd-pipeline',
    number: '10',
    title: 'CI/CD & Edge Deployment',
    category: 'DevOps',
    tagline: 'GitHub Actions Parallel Matrix, Docker Caching & Edge CD',
    summary: 'Run a production deployment pipeline. Watch GitHub Actions execute matrix checks in parallel, verify TypeScript types, leverage Docker layer caching, and distribute production assets to global edge networks.',
    difficulty: 'Beginner',
    estTime: '12 mins',
    icon: '🚀',
    accentColor: '#06b6d4',
    keySkills: ['GitHub Actions Workflows', 'Parallel Test Matrix', 'Docker Layer Caching', 'Shift-Left Typecheck', 'Vercel Edge Distribution']
  }
];
