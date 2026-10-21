# Course Structure & Syllabus: Express Middleware

A progressive, pedagogical curriculum that teaches how web servers process incoming HTTP requests through a chain of modular functions.

---

## 🎓 Curriculum Overview

- **Level**: Beginner
- **Prerequisite**: Basic JavaScript function calls
- **Pedagogical Goal**: Understand the Express request lifecycle, how `next()` propagates control, how request objects mutate, and how error boundaries catch crashes.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Request Assembly Line
*Why start here?* Web servers don't handle requests in a single giant function; they pass them through an assembly line.

#### Lesson 1.1: What is Middleware?
- **Concept**: A middleware is a function that sits between the incoming network request and the final database response. It receives `(req, res, next)`.
- **Learner Action**: Send a request and step through a basic logger middleware.
- **Visual Feedback**: The request enters `logger`, logs the timestamp, and pauses.

#### Lesson 1.2: The `next()` Baton Pass
- **Concept**: In Express, you MUST call `next()` to hand the request to the next station. If you forget `next()`, the conveyor belt stops and the browser hangs forever.
- **Learner Action**: Step `next()` to pass control to the route handler and return HTTP 200.

---

### 📍 Phase 2: Mutating the Request Context (`req`)
*Why this comes next?* Downstream route handlers need to know who is logged in or what request ID was assigned.

#### Lesson 2.1: The Shared Request Object
- **Concept**: `req` is a single JavaScript object shared by all middleware in the chain. Any middleware can attach new data to it.
- **Learner Action**: Watch `tokenVerifier` decode an authorization header and attach `req.user = { id: 42, name: 'Alex' }`.
- **Visual Feedback**: The `req` inspector shows `req.user` appearing before the database route runs.

---

### 📍 Phase 3: The Security Bouncer (Halting the Chain)
*Why this comes next?* Protecting expensive database queries from unauthorized or malicious traffic.

#### Lesson 3.1: Halting Without `next()`
- **Concept**: If a middleware calls `res.status(401).json({ error })` WITHOUT calling `next()`, the pipeline terminates instantly.
- **Learner Action**: Send an unauthenticated request.
- **Visual Feedback**: The auth middleware sends HTTP 401; the downstream database handler is never touched.

---

### 📍 Phase 4: The 4-Argument Error Boundary
*Why this comes next?* Production servers will crash if an uncaught database error or exception happens midway.

#### Lesson 4.1: The Special Error Arity `(err, req, res, next)`
- **Concept**: Express inspects function parameter counts. When a middleware calls `next(err)` with an error, Express bypasses all normal middleware and teleports straight to the 4-parameter error handler.
- **Learner Action**: Simulate an uncaught database crash and observe the error boundary format a clean HTTP 500 response.

---

## 🏆 Capstone Challenge: Building a Production API Pipeline
Assemble a full 4-station Express pipeline in the correct sequence:
1. `requestId` injector $\rightarrow$ 2. `authGuard` $\rightarrow$ 3. `checkoutHandler` $\rightarrow$ 4. `errorHandler`.
- Target: Verify valid requests complete with HTTP 200, missing tokens halt at Station 2 with HTTP 401, and simulated crashes jump cleanly to Station 4 with HTTP 500.
