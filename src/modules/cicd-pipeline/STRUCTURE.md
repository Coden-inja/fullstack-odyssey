# Course Structure & Syllabus: Automated Deployment & CI/CD Pipelines

A progressive, pedagogical curriculum that teaches how automated pipelines test, package, and deploy code to global edge networks with zero downtime.

---

## 🎓 Curriculum Overview

- **Level**: Beginner to Intermediate
- **Prerequisite**: Basic familiarity with building web applications
- **Pedagogical Goal**: Understand why teams use automated CI/CD pipelines, how quality gates prevent outages, how Docker layer caching speeds up builds, and how Anycast edge routing eliminates downtime.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: Automated Quality Gates (Shift-Left Testing)
*Why start here?* What stops a junior engineer from accidentally deploying broken code to real customers?

#### Lesson 1.1: The Pre-Flight Checklist
- **Concept**: A CI pipeline automatically runs two non-negotiable checks on every commit:
  1. `Typecheck (tsc --noEmit)`: Verifies that TypeScript types and contracts match.
  2. `Unit Tests (vitest run)`: Verifies that core business logic passes.
- **Learner Action**: Run the pipeline with a simulated test failure.
- **Visual Feedback**: The pipeline immediately halts at Step 2; broken code is NEVER built or deployed.
- **Key Takeaway**: Quality gates protect production stability.

---

### 📍 Phase 2: Docker Image Optimization & Layer Caching
*Why this comes next?* Fast pipelines make developers productive; slow 15-minute builds kill momentum.

#### Lesson 2.1: Dockerfile Instruction Ordering
- **The Golden Rule**: Copy `package.json` and run `npm install` BEFORE copying your source code!
- **Concept**: Docker caches image layers. If you only edited a CSS file or button label, Docker reuses the cached `node_modules` layer (`CACHED`).
- **Learner Action**: Run the build with layer caching enabled.
- **Visual Feedback**: Build time plunges from 180 seconds down to **4 seconds**!

---

### 📍 Phase 3: Zero-Downtime Rollouts (Blue-Green / Anycast)
*Why this comes next?* Modern websites never show a 502 Bad Gateway during an update.

#### Lesson 3.1: The Health Check Verification
- **Concept**: Deployment B (v2.0) boots up completely in isolation. Automated probes ping `/healthz`.

#### Lesson 3.2: The Instant Edge Cutover
- **Concept**: Once Deployment B is healthy, the global Anycast router flips routing tables to the new version in milliseconds.
- **Learner Action**: Execute the cutover.
- **Visual Feedback**: Traffic flips from 100% on v1.0 to 100% on v2.0 with zero dropped TCP connections.
- **Key Takeaway**: Customers never experience downtime or broken pages during a deploy.

---

## 🏆 Capstone Challenge: The Production Release Engineer
The learner manages a release:
1. Trigger a pipeline that fails a security or unit test check $\rightarrow$ verify deployment is safely aborted.
2. Fix the test, enable Docker multi-stage layer caching, and verify a sub-5-second build.
3. Trigger the production Anycast cutover and verify zero downtime across all global edge nodes.
