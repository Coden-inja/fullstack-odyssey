# Fullstack Odyssey 🚀

> Interactive Visual Systems Learning Playground for the True Fullstack 10.

An interactive browser-based learning platform inspired by `learnGitBranching` that teaches fullstack software engineering through real-time state machines, visual queues, and in-memory simulators.

---

## ⚡ The True Fullstack 10 Modules

1. **Node.js Event Loop & libuv**: Visual Call Stack, Microtask queue (`process.nextTick`, Promises), Macrotask queue (`setTimeout`, `setImmediate`), and C++ worker thread pool with step-by-step queue draining.
2. **Express Middleware Onion**: Request context propagation through chained middleware functions, `next()` call frames, error boundaries, and response chunking.
3. **REST & API Contract Sandbox**: HTTP status code state transitions (200, 201, 204, 400, 401, 404), header negotiation, and CORS preflight `OPTIONS`.
4. **SQL Relational Joins & Venn Intersections**: Interactive table joins (`INNER`, `LEFT`, `RIGHT`, `FULL OUTER`) with foreign keys and visual row matching.
5. **ORM Query Compilation & N+1 Problem**: Translating ORM query builder chains (Prisma/Drizzle) into compiled SQL, detecting N+1 query traps and connection pool saturation.
6. **Auth, Sessions & JWT Rotation**: HttpOnly Secure SameSite cookie exchange, RS256 asymmetric signature verification, and automated token rotation on expiration.
7. **Redis Queues & Background Workers**: BullMQ / Redis Streams producer-consumer queue with active/waiting/failed states and Dead Letter Queues (DLQ).
8. **React Server Components (RSC) & Streaming SSR**: Server/client component boundaries, React Flight payload protocol streaming, Suspense skeletons, and hydration islands.
9. **Git Directed Acyclic Graph (DAG)**: 100% in-memory GitEngine visualizing commit tree nodes, parent pointers, branch tags, animated `HEAD` re-pointing, and branch switching.
10. **CI/CD Pipeline & Edge Deployment**: Automated GitHub Actions workflow runner, test/lint parallelization, Docker layer caching, and Vercel edge distribution.

---

## 🛠️ Architecture Invariants
- **100% Client-Side In-Memory Simulation**: All state models are executed using pure TypeScript state machines without spawning dangerous OS child processes.
- **Vite + React 18 + TypeScript + Vanilla CSS**: Fast, zero-overhead bundle optimized for sub-second startup and interactive graphics.

---

## 🚀 Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run typecheck & build production bundle
npm run build
\`\`\`
