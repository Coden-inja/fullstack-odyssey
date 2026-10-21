# Course Structure & Syllabus: Streaming HTML & Server Components

A progressive, pedagogical curriculum that teaches modern React 18 / Next.js Server Components, HTTP/2 chunked transfer, and selective hydration.

---

## 🎓 Curriculum Overview

- **Level**: Advanced
- **Prerequisite**: Basic familiarity with React components and HTML rendering
- **Pedagogical Goal**: Understand why traditional SSR causes blank white screens, how streaming HTML sends the page shell first, and how selective hydration allows instant interaction.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Traditional SSR Bottleneck
*Why start here?* Understanding the historic limitation of server-side rendering.

#### Lesson 1.1: The All-or-Nothing Trap
- **The Problem**: In old SSR, the server queries the database, generates the full HTML string, and sends it. If a database query takes 1 second, the user sees a blank white screen for 1 second!
- **Key Takeaway**: You can't show the navigation bar until the slowest database query on the page finishes.

---

### 📍 Phase 2: Instant Page Shells (HTTP/2 Chunked Transfer)
*Why this comes next?* Sending the UI skeleton immediately while data is still loading.

#### Lesson 2.1: The Appetizer Model (Chunk 0)
- **Concept**: With streaming, the server immediately flushes Chunk 0 (layout, navigation, CSS, and `<Suspense>` skeletons) in 15ms.
- **Learner Action**: Trigger initial stream.
- **Visual Feedback**: The browser paints a complete layout and loading skeleton in 15ms.
- **Key Takeaway**: The user perceives the page as loaded instantly.

---

### 📍 Phase 3: Streaming Resolved Data (React Flight Protocol)
*Why this comes next?* Replacing the skeletons once database queries complete without reloading the page.

#### Lesson 3.1: The Flight Wire Protocol
- **Concept**: The HTTP connection remains open. When the query completes, the server streams Chunk 1 containing React Flight instructions (`0:["$","div",...]`).
- **Learner Action**: Stream the resolved data chunk.
- **Visual Feedback**: The loading skeleton smoothly swaps into live content without a page reload.

---

### 📍 Phase 4: Selective Hydration & Event Replay
*Why this comes next?* Allowing users to interact with buttons before the full JavaScript bundle downloads.

#### Lesson 4.1: The In-Memory Click Queue
- **Concept**: If an impatient user clicks a button before JavaScript has finished downloading, React 18 stores the click in an event queue.
- **Learner Action**: Click an unhydrated button, observe the click get queued, and watch it replay instantly upon hydration.
- **Key Takeaway**: Zero dropped user input; pages become interactive faster.

---

## 🏆 Capstone Challenge: The High-Speed E-Commerce Product Page
The learner configures a streaming product page:
1. Stream static shell with breadcrumbs and navbar in under 20ms.
2. Render `<Suspense>` skeletons for heavy product reviews.
3. Verify that user clicks on the "Add to Cart" button are queued and replayed upon island hydration.
