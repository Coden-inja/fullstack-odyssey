# Course Structure & Syllabus: User Authentication & Tokens

A progressive, pedagogical curriculum that teaches how digital tokens, cryptographic signatures, and secure cookies manage user identity.

---

## 🎓 Curriculum Overview

- **Level**: Intermediate to Advanced
- **Prerequisite**: Basic understanding of client-server requests
- **Pedagogical Goal**: Understand why servers use stateless tokens, how digital signatures prove data authenticity, and why HttpOnly cookies protect against token theft.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Stateless Authentication Problem
*Why start here?* Web servers handle millions of requests; querying the database for a password on every click is slow and unscalable.

#### Lesson 1.1: The 3-Part Token Anatomy
- **Concept**: A JSON Web Token (JWT) is split into 3 Base64URL parts separated by dots:
  1. `Header`: Algorithm used (e.g. HS256).
  2. `Payload`: Plain-text data (user ID, role, expiration date).
  3. `Signature`: Cryptographic seal generated using the server's private secret.
- **Common Misconception**: JWTs are NOT encrypted! Anyone can decode and read the payload.
- **Key Takeaway**: A JWT is a stamped wristband. Anyone can read it, but only the server has the stamp to create it.

---

### 📍 Phase 2: Cryptographic Tamper Detection
*Why this comes next?* If anyone can read the payload, what prevents an attacker from making themselves an admin?

#### Lesson 2.1: The HMAC Math Seal
- **Concept**: The server calculates: $\text{HMAC}(\text{header} + \text{payload}, \text{SECRET})$.
- **Learner Action**: Change role from `"member"` to `"admin"`.
- **Visual Feedback**: The verification badge flashes: `Invalid Signature ✕`.
- **Key Takeaway**: Modifying even one letter in the payload produces a completely different hash. Because the attacker lacks the server secret, they cannot generate the matching signature.

---

### 📍 Phase 3: The Storage Battle (LocalStorage vs. HttpOnly Cookies)
*Why this comes next?* Where you store your token determines whether hackers can steal it.

#### Lesson 3.1: The Danger of `localStorage` (XSS Vulnerability)
- **Concept**: Any JavaScript running on the page can execute `localStorage.getItem('token')`. If an attacker injects a malicious script (XSS), your account is hijacked.

#### Lesson 3.2: The `HttpOnly` Cookie Shield
- **Concept**: `HttpOnly; Secure; SameSite=Strict` cookies are locked by the browser. Browser JavaScript literally CANNOT access them (`document.cookie` returns empty).
- **Learner Action**: Simulate an XSS script attack against both storage mechanisms and observe the cookie shield block the theft.

---

### 📍 Phase 4: Token Lifecycles & Silent Refresh
*Why this comes next?* What happens when a token expires while a user is working?

#### Lesson 4.1: Short-Lived Access Tokens + Refresh Token Families
- **Concept**: Access tokens live for only 15 minutes. A secure, single-use refresh token stored in an HttpOnly cookie automatically rotates in the background to issue fresh access tokens without logging the user out.

---

## 🏆 Capstone Challenge: Hardening an Auth System
The learner audits an authentication endpoint:
1. Detect a tampered JWT payload where role was altered to `admin`.
2. Migrate token storage from `localStorage` to `HttpOnly; Secure; SameSite=Strict` cookie.
3. Verify that XSS script exfiltration tests fail while legitimate API requests succeed.
