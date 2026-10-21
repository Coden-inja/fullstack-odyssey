# Course Structure & Syllabus: Visual Git

A progressive, pedagogical curriculum that builds Git mental models from first principles without abrupt jumps.

---

## 🎓 Curriculum Overview

- **Level**: Beginner to Intermediate
- **Prerequisite**: None (assumes zero Git or terminal knowledge)
- **Pedagogical Goal**: Transform Git from "a mysterious black box of memorized commands" into a visual tree of checkpoint circles and sticky-note labels.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: The Foundations of Checkpoints (Commits)
*Why start here?* Before you can branch or merge, you must understand what you are actually saving.

#### Lesson 1.1: The First Snapshot (`C0` & `git commit`)
- **Concept**: A Git repository is not a folder sync; it is an immutable history tree. A commit is a permanent snapshot of the entire project.
- **Visual State**: Circle `C0` exists. Label `main` points to `C0`. `* HEAD` points to `main`.
- **Learner Action**: Run `git commit` to create checkpoint `C1`.
- **Visual Feedback**: Circle `C1` appears. An arrow points *backward* to `C0`. `main` slides to `C1`.
- **Key Takeaway**: Commits point backwards to their parent. The branch label automatically moves forward to stay at the newest commit.

#### Lesson 1.2: Building History (`C0 -> C1 -> C2`)
- **Concept**: Chaining checkpoints together into a sequential timeline.
- **Learner Action**: Run `git commit` again to create `C2`.
- **Validation**: History contains 3 sequential commits; `main` points to `C2`.
- **The Bridge to Phase 2**: *"You now have a clean history on `main`. But what happens when two developers want to work on different features at the same time without breaking `main`? You need isolated branches!"*

---

### 📍 Phase 2: Isolated Workspaces (Branching)
*Why this comes next?* Once you understand linear commits, you need to understand parallel lines of work.

#### Lesson 2.1: What is a Branch? (`git branch <name>`)
- **Concept**: A branch is NOT a copy of your files on disk. A branch is literally a tiny 40-byte text pointer attached to a commit hash.
- **Learner Action**: Run `git branch feature`.
- **Visual Feedback**: A green label `feature` appears on `C1`, sitting right next to `main`.
- **Key Takeaway**: Creating a branch does not move you to it! `HEAD` is still on `main`.

#### Lesson 2.2: Switching Context (`git checkout <name>`)
- **Concept**: `HEAD` is the pointer that tells Git which branch you are currently standing on.
- **Learner Action**: Run `git checkout feature` (or the shortcut `git checkout -b feature`).
- **Visual Feedback**: The `* HEAD` badge unhooks from `main` and snaps to `feature`.

#### Lesson 2.3: Divergence (Committing on a Branch)
- **Concept**: When you commit while standing on a branch, ONLY that branch moves forward.
- **Learner Action**: Run `git commit` while on `feature`.
- **Visual Feedback**: A new circle `C2` appears on a new lower lane. `feature` moves to `C2`. `main` remains safe and untouched at `C1`.
- **The Bridge to Phase 3**: *"Your feature is complete and verified! But how do you bring that new code back into `main` so the whole team has it? You merge!"*

---

### 📍 Phase 3: Combining Timelines (Merging)
*Why this comes next?* Branching is useless if you can never combine your work back into production.

#### Lesson 3.1: The Receiving Branch Rule (`git checkout main`)
- **Concept**: In Git, you must always stand on the branch that is RECEIVING the incoming changes.
- **Common Mistake**: Trying to run `git merge main` while standing on `feature`.
- **Learner Action**: Run `git checkout main`.
- **Visual Feedback**: `HEAD` moves back to `main` at `C1`.

#### Lesson 3.2: The 2-Parent Merge Commit (`git merge feature`)
- **Concept**: A merge commit combines two distinct parent histories into one unified commit.
- **Learner Action**: Run `git merge feature`.
- **Visual Feedback**: Commit `C3` is born. It has **TWO incoming arrows**: one from `C1` and one from `C2`. `main` jumps to `C3`.
- **The Bridge to Phase 4**: *"You can build forward and combine branches. But what happens when a bug was introduced yesterday and you need to travel back in time to inspect an old checkpoint?"*

---

### 📍 Phase 4: Time Travel & Inspection (Detached HEAD)
*Why this comes next?* Advanced workflows require inspecting historical checkpoints directly.

#### Lesson 4.1: Checking Out a Commit Hash (`git checkout C1`)
- **Concept**: `HEAD` normally points to a branch name (`HEAD -> main`). But Git allows you to point `HEAD` directly at any historical commit ID.
- **Learner Action**: Run `git checkout C1`.
- **Visual Feedback**: `HEAD` detaches from the `main` label and sits directly on the `C1` circle.
- **Key Takeaway**: This is "Detached HEAD". You are viewing a past checkpoint without modifying any branch pointers.

#### Lesson 4.2: Returning to the Present (`git checkout main`)
- **Concept**: How to safely return to an active branch without losing your place.
- **Learner Action**: Run `git checkout main`.
- **Visual Feedback**: `HEAD` re-attaches to the `main` branch label at the latest merge commit.

---

## 🏆 Capstone Challenge: The Solo Engineer Workflow
The learner must synthesize all 4 phases in one unified puzzle:
1. Initialize repository with boilerplate (`C0`).
2. Make a commit on `main` (`C1`).
3. Create and switch to branch `bugfix`.
4. Commit twice on `bugfix` (`C2`, `C3`).
5. Switch to `main` and commit once on `main` (`C4`) to create a true divergent fork.
6. Merge `bugfix` into `main` to create a 2-parent merge commit (`C5`).
7. Verify with `Check My Answer`.
