# Course Structure & Syllabus: The Event Loop & Async JavaScript

A progressive, pedagogical curriculum that demystifies how Node.js executes asynchronous, non-blocking code on a single thread.

---

## 🎓 Curriculum Overview

- **Level**: Beginner to Intermediate
- **Prerequisite**: Basic understanding of functions and `console.log`
- **Pedagogical Goal**: Master the execution order of JavaScript code by visualizing the Call Stack, Microtask Queue, Timer Wheel, and libuv thread pool.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Synchronous Call Stack
*Why start here?* Before understanding asynchronous queues, you must understand how JavaScript runs code normally.

#### Lesson 1.1: What is the Call Stack?
- **Concept**: JavaScript is single-threaded: it has one Call Stack that does one thing at a time.
- **Learner Action**: Step through synchronous `console.log()` statements.
- **Visual Feedback**: Function frames push onto the top of the stack, print to the console, and pop off.
- **Key Takeaway**: Nothing else in JavaScript can run while synchronous code occupies the Call Stack.

#### Lesson 1.2: Stack Overflow & Blocking Code
- **Concept**: If synchronous code enters an infinite loop or heavy calculation, the Call Stack freezes, and no user clicks or network requests can be processed.
- **The Bridge to Phase 2**: *"If heavy work blocks the Call Stack, how can a server handle thousands of users? It offloads tasks to asynchronous queues!"*

---

### 📍 Phase 2: Asynchronous Timers (Macrotasks)
*Why this comes next?* Understanding how tasks are delayed and scheduled for later execution.

#### Lesson 2.1: The Myth of `setTimeout(..., 0)`
- **Concept**: Setting a timer to 0ms does NOT mean "run immediately." It means: "Place this callback into the Timers Queue and wait for the Call Stack to empty."
- **Learner Action**: Run code mixing synchronous logs with `setTimeout(..., 0)`.
- **Visual Feedback**: The timer callback sits in the Timers Queue while synchronous code finishes first.
- **Key Takeaway**: Synchronous code ALWAYS runs before any timer callback.

---

### 📍 Phase 3: Promises & The Microtask Queue
*Why this comes next?* Promises introduce queue priority rules that override standard timers.

#### Lesson 3.1: Microtasks Jump the Line
- **Concept**: JavaScript has two distinct queues: Microtasks (Promises) and Macrotasks (Timers).
- **The Golden Rule**: Whenever the Call Stack empties, JavaScript MUST drain the entire Microtask Queue before touching any timer callback!
- **Learner Action**: Step through `Promise.resolve().then(...)` alongside `setTimeout(..., 0)`.
- **Visual Feedback**: The Promise callback executes before the Timer callback.

#### Lesson 3.2: The Super VIP Queue (`process.nextTick`)
- **Concept**: Node.js has a priority microtask queue: `process.nextTick()`. It executes even before standard Promise jobs!
- **Learner Action**: Observe `nextTick` callbacks drain first at the end of the synchronous tick.
- **The Bridge to Phase 4**: *"Promises and timers handle async scheduling. But what about heavy CPU tasks like hashing passwords or compressing files? Who does that work?"*

---

### 📍 Phase 4: The libuv Background Thread Pool
*Why this comes next?* Explaining how Node.js performs heavy work without freezing the single JavaScript thread.

#### Lesson 4.1: The 4-Thread Pool (`UV_THREADPOOL_SIZE=4`)
- **Concept**: Node.js delegates heavy CPU tasks (crypto, compression, disk I/O) to a pool of 4 C++ worker threads.
- **Learner Action**: Dispatch a `crypto.pbkdf2` password hash.
- **Visual Feedback**: Worker 1 status flips to `Busy (Hashing)`, while the main Call Stack stays completely free to respond to new requests.
- **Key Takeaway**: The main thread never waits; it only executes the completion callback once the C++ worker finishes.

---

## 🏆 Capstone Challenge: The Execution Order Predictor
The learner must predict and verify the exact output sequence of a complex interleaved script:
`console.log('1')` $\rightarrow$ `setTimeout('5', 0)` $\rightarrow$ `Promise.then('4')` $\rightarrow$ `process.nextTick('3')` $\rightarrow$ `crypto.hash('6')` $\rightarrow$ `console.log('2')`.
- Target: Validate understanding of Sync (1, 2) $\rightarrow$ nextTick (3) $\rightarrow$ Promise (4) $\rightarrow$ Timer (5) $\rightarrow$ Worker (6).
