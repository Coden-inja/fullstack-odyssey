# Mental Flow & Story Guide: User Auth (Tokens, Passwords & Cookies)

This document maps the exact cognitive journey of a beginner learning how web security, digital signatures, and cookies protect user accounts.

---

## 🧭 Step 1: Arrival — "How does a website remember who I am?"

### 👀 What they see on screen
- A color-coded string separated by dots:
  - Blue: `eyJhbGciOiJIUzI1Ni...` (Header)
  - Purple: `eyJzdWIiOjQyLCJyb2...` (Payload)
  - Green: `valid_hmac_secret...` (Signature)
- A button: **"Verify Signature →"**

### 🧠 What they think
> *"Is this encrypted? Can people read what's inside it? Does the server have to ask the database for my password on every click?"*

### ❓ Where they will get confused
- **The #1 misconception:** Beginners think JWTs are encrypted secrets.
- In reality, JWTs are NOT encrypted! Anyone can decode the Base64 string and read the payload.

### 👉 What to do (The Guided Instruction)
> **The Digital Stamp Card:** A JWT is not a secret envelope; it is a stamped concert wristband.  
> Everyone can read what is printed on your wristband (`user: 42, role: member`), but only the venue has the cryptographic stamp to forge the signature.  
> **Your Task:** Click **"Verify Signature →"** to confirm the server verifies the math.

---

## ⚡ Step 2: The Tamper Test (Level 2: Catching Hackers)

### 🧠 What they think
> *"If the payload is just Base64 text that anyone can read, what stops me from changing `"role": "member"` to `"role": "admin"` to give myself free superuser powers?"*

### ❓ Where they will get confused
- They don't understand how digital signatures mathematically bind the payload to a secret key.

### 👉 What to do
- Click **"Tamper Payload (role: admin)"**.
- Notice the payload changes to: `{"sub": 42, "role": "admin"}`.
- Click **"Verify Signature →"**.

### ⚡ What moves on screen
- The badge immediately flashes red: **`Invalid Signature (Tampered) ✕`**.
- The server rejects the token on the spot!

### 💡 The Aha! Moment
> **The Cryptographic Seal:**  
> The server computes: $\text{HMAC}(\text{header} + \text{payload}, \text{SECRET})$.  
> If an attacker changes even ONE single letter in the payload, the math produces completely different random gibberish. Because the attacker doesn't know the server's private secret, they cannot generate the matching signature!

---

## 🍪 Step 3: LocalStorage vs HttpOnly Cookies (Level 3: The Cookie Shield)

### 🧠 What they think
> *"I'll just save my login token in `localStorage.setItem('token', jwt)`. It's so easy to use in JavaScript!"*

### ❓ Where they will get confused
- Beginners don't know what Cross-Site Scripting (XSS) is.
- If a malicious third-party script runs on your page (e.g. from a hacked npm package), it can read `localStorage` in one line of code!

### 👉 What to do
- Leave storage as **localStorage**.
- Click **"Simulate XSS Attack →"**.

### ⚡ What moves on screen
- Red alert: **`Token Stolen by XSS Script!`**.
- The attacker exfiltrated your token and hijacked your session.

### 👉 The Fix
- Switch storage to **HttpOnly Cookie**.
- Re-run the simulation.

### ⚡ What moves on screen
- Green alert: **`XSS Neutralized: Cookie Protected ✓`**.
- The script attempts `document.cookie`, but the browser returns an empty string!

### 💡 The Aha! Moment
> *"HttpOnly is a browser-level security lock! It tells the browser: 'Never let ANY JavaScript code read this cookie.' When you make API calls, the browser automatically attaches the cookie in the background without exposing it to malicious scripts!"*
