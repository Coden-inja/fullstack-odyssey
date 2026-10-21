# Course Structure & Syllabus: REST APIs & HTTP Contracts

A progressive, pedagogical curriculum that teaches how browsers and backend servers communicate over plain-text HTTP wire protocols.

---

## 🎓 Curriculum Overview

- **Level**: Beginner
- **Prerequisite**: None
- **Pedagogical Goal**: Demystify HTTP status codes, understand Safe vs. Idempotent operations, demystify CORS preflight handshakes, and leverage HTTP caching.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Plain-Text Wire Protocol
*Why start here?* Before memorizing REST acronyms, you must realize that HTTP is just plain-text ASCII sent over a TCP socket.

#### Lesson 1.1: Anatomy of an HTTP Request & Response
- **Concept**: A request is plain text: Method (`GET`), Path (`/api/users`), Headers (`Host: ...`), and an optional Body.
- **Learner Action**: Send a `GET /api/users` request and inspect the raw wire socket frames.
- **Key Takeaway**: Status code 200 OK tells the browser the request succeeded.

#### Lesson 1.2: Creating Data with `POST` (201 Created)
- **Concept**: `POST` sends a JSON body payload to manufacture a new resource on the server.
- **Learner Action**: Dispatch a `POST` with a user object and receive HTTP 201 Created with the new resource ID.

---

### 📍 Phase 2: Safe vs. Idempotent Methods
*Why this comes next?* Understanding network reliability and what happens when requests are repeated.

#### Lesson 2.1: What Does "Safe" Mean?
- **Concept**: A method is "Safe" if it only reads data and makes zero state modifications (e.g. `GET`, `HEAD`).

#### Lesson 2.2: What Does "Idempotent" Mean?
- **Concept**: An operation is "Idempotent" if running it once or running it 100 times leaves the system in the exact same final state.
- **The Case of `DELETE` & `PUT`**: `DELETE /api/users/42` removes the user. Deleting it 10 more times still leaves the user removed (204 No Content).
- **The Case of `POST`**: `POST /api/orders` is NOT idempotent; clicking 10 times charges the customer 10 times!

---

### 📍 Phase 3: Browser Permissions & CORS Preflight
*Why this comes next?* Beginners frequently face red console CORS errors without understanding why the browser blocked them.

#### Lesson 3.1: The Same-Origin Policy
- **Concept**: Browsers protect users by forbidding a script on `https://evil-site.com` from reading private data from `https://bank.com`.

#### Lesson 3.2: The Invisible `OPTIONS` Preflight Handshake
- **Concept**: When calling cross-origin APIs with custom headers, the browser pauses and sends an invisible `OPTIONS` request first to ask: *"Are you willing to accept requests from this origin?"*
- **Learner Action**: Trigger a cross-origin request and observe the preflight handshake return `Access-Control-Allow-Origin: *`.

---

### 📍 Phase 4: Smart Caching with ETags (HTTP 304)
*Why this comes next?* Mobile performance requires eliminating redundant payload downloads.

#### Lesson 4.1: Fingerprinting Content with ETags
- **Concept**: The server provides an `ETag` (a fingerprint hash of the data).
- **Learner Action**: Re-request data with `If-None-Match: <etag>`.
- **Visual Feedback**: The server returns `HTTP 304 Not Modified` with `Content-Length: 0`.
- **Key Takeaway**: 0 bytes sent over the wire; the browser uses its instant local cache.

---

## 🏆 Capstone Challenge: The API Architect
The learner configures and dispatches the correct HTTP request for 3 realistic scenarios:
1. Fetching a cached user list using ETags $\rightarrow$ verify 304 Not Modified.
2. Cross-origin profile update $\rightarrow$ verify OPTIONS preflight handshake and 200 OK.
3. Safe resource cleanup $\rightarrow$ verify idempotent DELETE returning 204 No Content.
