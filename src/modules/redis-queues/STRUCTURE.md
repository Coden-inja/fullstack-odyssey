# Course Structure & Syllabus: Background Tasks & Distributed Queues

A progressive, pedagogical curriculum that teaches how distributed message queues (Redis / BullMQ) offload heavy tasks from web servers.

---

## 🎓 Curriculum Overview

- **Level**: Intermediate
- **Prerequisite**: Basic familiarity with server requests and async tasks
- **Pedagogical Goal**: Master the producer-consumer pattern, understand job state machines, scale worker concurrency, and isolate failing jobs with Dead Letter Queues (DLQ).

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Producer-Consumer Pattern
*Why start here?* Heavy tasks like generating PDF receipts or processing videos freeze the user's browser if executed synchronously.

#### Lesson 1.1: Fast-Food Ticket Model
- **Concept**: The web API (Producer) creates a job ticket in Redis in 5ms and responds to the user immediately. Background workers (Consumers) execute the task asynchronously.
- **Learner Action**: Enqueue 3 welcome email tasks and observe the API return HTTP 200 instantly while workers process jobs in the background.

---

### 📍 Phase 2: The Job State Machine
*Why this comes next?* Understanding how Redis tracks job status across crashes and restarts.

#### Lesson 2.1: The 4 Core States
- **The Lifecycle**: `Waiting` (in queue) $\rightarrow$ `Active` (worker acquired lock) $\rightarrow$ `Completed` (success) OR `Failed` (error).
- **Learner Action**: Step through a batch of jobs as they transition from Waiting to Active to Completed.

---

### 📍 Phase 3: Scaling Worker Concurrency
*Why this comes next?* Handling sudden traffic surges (e.g. newsletter launches or bulk exports).

#### Lesson 3.1: Parallel Worker Pools
- **Concept**: Worker concurrency dictates how many tasks run simultaneously on CPU cores.
- **Learner Action**: Scale worker concurrency from 1 to 4.
- **Visual Feedback**: Throughput quadruples; 4 jobs process in parallel without queuing delay.

---

### 📍 Phase 4: Error Handling & The Dead Letter Queue (DLQ)
*Why this comes next?* Production systems inevitably encounter corrupt payloads or network outages.

#### Lesson 4.1: The Poison Pill Problem
- **Concept**: A job with a malformed payload (e.g. invalid syntax) will crash the worker. If the worker restarts and retries forever, it clogs the queue.

#### Lesson 4.2: Exponential Backoff & Quarantine
- **Concept**: The queue retries with increasing delays ($1s \rightarrow 2s \rightarrow 4s$). After maximum attempts, the queue acknowledges and moves the job into the **Dead Letter Queue (DLQ)**.
- **Learner Action**: Enqueue a corrupt poison-pill task and watch it get safely isolated in the DLQ while healthy jobs continue flowing.

---

## 🏆 Capstone Challenge: The High-Volume Video Transcoder
The learner configures a production queue handling 100 incoming video encoding jobs:
1. Scale concurrency to process the batch efficiently.
2. Intercept and isolate a corrupt video file in the Dead Letter Queue.
3. Verify that 100% of valid video jobs complete while zero workers crash.
