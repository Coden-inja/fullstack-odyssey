# Mental Flow & Story Guide: Visual Git (Commits, Branches & Merges)

This document maps the exact cognitive journey of a beginner with zero prior Git knowledge interacting with the Visual Git lab.

---

## 🧭 Step 1: The First Impression (Arrival)

### 👀 What they see on screen
- A clean canvas with a single blue circle labeled `C0`.
- A blue label tagged `main` attached to `C0`.
- A small yellow badge `* HEAD` pointing to `main`.
- A terminal prompt at the bottom: `$ _`

### 🧠 What they think
> *"What is C0? Is it a folder? What does HEAD mean? Did I break something already?"*

### ❓ Where they will get confused
- They think Git is a folder syncer (like Google Drive or Dropbox).
- They have no concept of a "commit" or "branch".
- Seeing `HEAD` without explanation looks like a weird error or jargon.

### 👉 What to do (The Guided Instruction)
> **Look at the circle `C0`:** That is a snapshot of your project (a save point).  
> **Look at `main`:** That is your branch name. In Git, a branch is just a sticky-note label pointing to a commit.  
> **Look at `HEAD`:** That shows which commit you are currently standing on.  
> **Your Task:** Save your next checkpoint by typing `git commit` in the terminal below.

---

## ⚡ Step 2: Making the First Commit

### 👀 What they see after typing `git commit`
- A new blue circle labeled `C1` appears to the right of `C0`.
- An arrow connects `C1` pointing backwards to `C0`.
- The `main` label and `HEAD` badge smoothly slide from `C0` over to `C1`.

### 🧠 What they think
> *"Wait, why is the arrow pointing backwards to C0 instead of forward to C1? Did it undo my work?"*

### ❓ Where they will get confused
- Intuition says arrows point forward in time.
- In Git, children point backward to their parent checkpoints.

### 💡 The Aha! Moment
> **The Arrow Points Back:** Every commit remembers where it came from. `C1` knows its parent is `C0`.  
> **The Label Slid Forward:** Your project files didn't duplicate. Git simply moved the `main` label forward to mark `C1` as the latest save point.

---

## 🎯 Step 3: Checking the Goal (Level 1 Check)

### 👀 What they see
- A "Goal State" mini-map showing: `C0 -> C1 -> C2 (main, HEAD)`.
- A button labeled **"Check My Answer"**.

### 🧠 What they think
> *"The goal has 3 circles (C0, C1, C2). I only have C0 and C1. I need to commit one more time!"*

### 👉 What to do
- Type `git commit` a second time to create `C2`.
- Click **"Check My Answer"**.

### ✅ Submit & Feedback
- The validator checks:
  1. Does history contain 3 commits? `Yes (C0, C1, C2)`
  2. Does `main` point to `C2`? `Yes`
  3. Does `HEAD` point to `main`? `Yes`
- **Result:** Green success banner: *"Level 1 Mastered! You now understand that commits are snapshots and branches are movable labels."*

---

## 🌿 Step 4: The Need for Branches (Level 2: Branching Out)

### 🧠 What they think when entering Level 2
> *"Why do I need branches? Can't I just keep committing on main?"*

### ❓ Where they will get confused
- Beginners think creating a branch copies the entire project into a new folder on disk.
- They wonder: *"If I make a mistake on a branch, will it ruin main?"*

### 👉 What to do
> **The Problem:** You want to redesign the navigation bar, but you don't want to break the working site. You need an isolated workspace.  
> **Type:** `git checkout -b feature`

### ⚡ What moves on screen
- A new green label `feature` appears right on top of `C1` alongside `main`.
- The `HEAD` badge unhooks from `main` and snaps to `feature`.

### 💡 The Aha! Moment
> *"A branch is literally just a new sticky-note on the exact same commit! Nothing was copied or duplicated."*

---

## 🔀 Step 5: Divergent History

### 👉 What to do
- Type `git commit` while on `feature`.

### ⚡ What moves on screen
- A new commit `C2` appears in a new lower lane (Lane 1).
- An arrow connects `C2` back to `C1`.
- `feature` moves to `C2`.
- `main` STAYS behind at `C1`!

### 💡 The Aha! Moment
> *"Now I see it! Main is safe at C1. Feature is exploring new work at C2. They have diverged!"*

---

## 🤝 Step 6: Merging History (Level 3: Bringing Work Home)

### 🧠 What they think when entering Level 3
> *"My feature is done and tested. How do I get my new code back into main?"*

### ❓ Where they will get confused
- Do I merge `feature` into `main`, or `main` into `feature`?
- Beginners often run merge while standing on the wrong branch.

### 👉 What to do
> **Rule:** You must stand on the branch that is RECEIVING the changes.  
> 1. Switch back to main: `git checkout main`  
> 2. Merge feature: `git merge feature`

### ⚡ What moves on screen
- A special new commit `C3` (The Merge Commit) appears.
- It has **TWO incoming arrows**: one from `C1` and one from `C2`!
- The `main` label jumps forward to `C3`.

### 💡 The Aha! Moment
> *"A merge commit is special because it has two parents! It bridges two parallel timelines into one unified history."*

---

## 🕰️ Step 7: Traveling Back in Time (Level 4: Detached HEAD)

### 🧠 What they think
> *"What does 'detached HEAD' mean? It sounds dangerous like I broke Git."*

### ❓ Where they will get confused
- They think their repository is corrupted.

### 👉 What to do
> **Type:** `git checkout C1` (checking out a commit hash instead of a branch name).

### ⚡ What moves on screen
- `HEAD` detaches from the `main` label and rests directly on top of circle `C1`.
- A warning banner illuminates: *"Detached HEAD: You are viewing a past checkpoint directly, not standing on any branch."*

### 💡 The Aha! Moment
> *"HEAD normally points to a branch label. When you checkout a commit directly, HEAD points to the circle itself. If you commit here without a branch, there's no label to find it later!"*
