# Course Structure & Syllabus: Database Queries & The N+1 Bug

A progressive, pedagogical curriculum that teaches how ORM abstraction layers compile into raw SQL and how to eliminate the N+1 query performance bug.

---

## 🎓 Curriculum Overview

- **Level**: Intermediate
- **Prerequisite**: Basic familiarity with loops and database queries
- **Pedagogical Goal**: Learn how high-level ORM methods compile into SQL, why looping queries causes network saturation, and how to use eager joins and DataLoader batching.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Hidden Cost of ORM Abstractions
*Why start here?* ORMs like Prisma and Drizzle make code look simple, hiding the heavy network queries underneath.

#### Lesson 1.1: The Innocent For-Loop
- **Code**: `const users = await db.users.findMany(); for (u of users) { u.posts = await db.posts.findMany({ where: { userId: u.id } }) }`.
- **The Problem**: In local development with 2 users, this takes 4ms and seems fine.
- **The Production Reality**: Your database is in a remote data center. Every `await db.query()` sends TCP packets over the internet.

---

### 📍 Phase 2: The Math of N+1 & Connection Pool Saturation
*Why this comes next?* Understanding why high-traffic sites experience sudden database timeouts.

#### Lesson 2.1: The Network Latency Waterfall
- **The Formula**: 1 query to fetch users + N queries for their posts ($1 + N$).
- **Learner Action**: Run the Naive N+1 simulation.
- **Visual Feedback**: 11 sequential queries fire. Total latency jumps to 165ms. Connection pool spikes to 80% saturation.
- **Key Takeaway**: Database connections are limited (typically 10-20 connections). N+1 queries saturate the pool, causing other users' requests to time out in line.

---

### 📍 Phase 3: Fixing with Eager SQL JOINs
*Why this comes next?* Letting the database server do the relational work in a single round-trip.

#### Lesson 3.1: The `include` Pattern
- **Concept**: Telling the ORM to compile an eager join: `SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id`.
- **Learner Action**: Run the Eager Join simulation.
- **Visual Feedback**: Round-trips plunge from 11 down to **1**! Latency drops from 165ms to **18ms** (89% faster).

---

### 📍 Phase 4: Automated Batching with DataLoader
*Why this comes next?* In microservices, GraphQL, or decoupled React components, you can't always write a giant custom SQL join.

#### Lesson 4.1: Microtask Collection (`WHERE id IN (...)`)
- **Concept**: DataLoader queues individual `load(user.id)` calls during the current synchronous JavaScript tick. When the tick ends, it combines all IDs into a single query: `WHERE user_id IN (1, 2, ..., 10)`.
- **Learner Action**: Run DataLoader Batching.
- **Visual Feedback**: 11 round-trips collapse into **2 round-trips**. Latency is only 31ms.

---

## 🏆 Capstone Challenge: The Slow Dashboard Rescue
The learner inspects a realistic e-commerce dashboard that takes 900ms to load 20 user cards:
- Task: Identify the N+1 loop (21 round-trips) and refactor it into a batched query.
- Validation: Verify total network round-trips drop from 21 down to 2 and connection pool utilization stays below 30%.
