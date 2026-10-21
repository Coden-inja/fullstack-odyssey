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
  accentColor: string;
  keySkills: string[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'event-loop',
    number: '01',
    title: 'The Event Loop: How Node.js Runs Code',
    category: 'Runtime',
    tagline: 'JavaScript Call Stack, Microtasks & Timers',
    summary: 'Learn how JavaScript runs asynchronous code without blocking the main thread. Step through code line-by-line to see when promises, timers, and callbacks actually execute.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    accentColor: '#4f46e5',
    keySkills: ['Call Stack', 'Promises & Microtasks', 'Timers (setTimeout)', 'Worker Threads']
  },
  {
    id: 'middleware',
    number: '02',
    title: 'Express: How Middleware Passes Requests',
    category: 'Networking',
    tagline: 'The Request Journey, next() Functions & Error Handling',
    summary: 'Understand how web servers process incoming requests through a chain of functions. See what happens when middleware modifies data, blocks unauthorized users, or catches errors.',
    difficulty: 'Beginner',
    estTime: '10 mins',
    accentColor: '#059669',
    keySkills: ['Request Flow', 'next() Function', 'Authentication Gates', 'Error Handlers']
  },
  {
    id: 'rest-api',
    number: '03',
    title: 'REST APIs: Requests, Responses & Headers',
    category: 'Networking',
    tagline: 'HTTP Status Codes, Safe Methods & Browser Permissions (CORS)',
    summary: 'Learn how web browsers communicate with servers. Test GET, POST, and DELETE requests, explore status codes like 200, 404, and 500, and see why browsers check permissions with CORS.',
    difficulty: 'Beginner',
    estTime: '12 mins',
    accentColor: '#0284c7',
    keySkills: ['Status Codes (200, 404, 500)', 'Idempotency', 'CORS Permissions', 'Caching & ETags']
  },
  {
    id: 'sql-joins',
    number: '04',
    title: 'SQL Joins: How Tables Connect',
    category: 'Database',
    tagline: 'Connecting Data with Inner, Left, Right & Full Joins',
    summary: 'Learn how relational databases combine data from multiple tables. See visually what happens when users have no orders, why NULL appears, and which join to choose.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    accentColor: '#2563eb',
    keySkills: ['INNER JOIN', 'LEFT JOIN & Missing Data', 'Foreign Keys', 'Query Planning']
  },
  {
    id: 'orm-queries',
    number: '05',
    title: 'Database Queries: Fixing the N+1 Performance Trap',
    category: 'Database',
    tagline: 'What Happens When Loops Query the Database & How to Batch',
    summary: 'Learn why querying the database inside a loop can slow down your entire application. Compare naive queries against batch queries to see network round-trips drop dramatically.',
    difficulty: 'Advanced',
    estTime: '18 mins',
    accentColor: '#d97706',
    keySkills: ['N+1 Query Loop', 'Network Latency', 'Batching with DataLoader', 'Connection Limits']
  },
  {
    id: 'auth-jwt',
    number: '06',
    title: 'User Auth: Passwords, Tokens & Cookies',
    category: 'Security',
    tagline: 'How Secure Logins, JWT Tokens & Protected Cookies Work',
    summary: 'Learn how web applications remember who you are after you log in. Inspect token signatures, test what happens when someone tampers with data, and see how secure cookies block attacks.',
    difficulty: 'Advanced',
    estTime: '20 mins',
    accentColor: '#db2777',
    keySkills: ['Token Anatomy', 'Digital Signatures', 'Tamper Detection', 'HttpOnly Cookie Defense']
  },
  {
    id: 'redis-queues',
    number: '07',
    title: 'Background Tasks: Queues & Workers',
    category: 'Architecture',
    tagline: 'Processing Heavy Jobs in the Background with Automatic Retries',
    summary: 'Learn how web apps send emails or process files without making users wait. Watch jobs move from waiting to active, see automatic retries on failure, and quarantine broken jobs.',
    difficulty: 'Intermediate',
    estTime: '15 mins',
    accentColor: '#dc2626',
    keySkills: ['Job Queues', 'Worker Concurrency', 'Retry with Delay', 'Dead Letter Quarantine']
  },
  {
    id: 'rsc-streaming',
    number: '08',
    title: 'Fast Page Loads: Streaming HTML & Components',
    category: 'Architecture',
    tagline: 'Loading the Page Shell First While Slow Data Streams In',
    summary: 'Learn how modern web apps load instantly by sending the page skeleton first, streaming data as it becomes ready, and making buttons interactive without full page reloads.',
    difficulty: 'Advanced',
    estTime: '18 mins',
    accentColor: '#7c3aed',
    keySkills: ['Instant Page Shell', 'Streaming Chunk by Chunk', 'Suspense Skeletons', 'Interactive Islands']
  },
  {
    id: 'git-dag',
    number: '09',
    title: 'Visual Git: Commits, Branches & Merges',
    category: 'DevOps',
    tagline: 'Understanding the Save Tree, Branch Labels & Combining History',
    summary: 'Learn Git through interactive visual puzzles. See what a commit really is, how branch pointers move, what happens when you switch branches, and how merging combines history.',
    difficulty: 'Beginner',
    estTime: '20 mins',
    accentColor: '#059669',
    keySkills: ['Commits as Checkpoints', 'Branch Pointers', 'Switching with Checkout', 'Merging History']
  },
  {
    id: 'cicd-pipeline',
    number: '10',
    title: 'Automated Deployment: Pipelines & Edge Servers',
    category: 'DevOps',
    tagline: 'Testing, Building Small Container Images & Instant Global Rollouts',
    summary: 'Learn how professional teams deploy code automatically. Watch automated tests catch bugs before they reach users, build optimized Docker containers, and switch traffic with zero downtime.',
    difficulty: 'Beginner',
    estTime: '12 mins',
    accentColor: '#0284c7',
    keySkills: ['Automated Tests & Quality Gates', 'Docker Image Optimization', 'Zero-Downtime Rollouts']
  }
];
