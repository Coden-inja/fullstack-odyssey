# Course Structure & Syllabus: SQL Joins & Relational Data

A progressive, pedagogical curriculum that teaches how relational databases combine data across multiple tables.

---

## 🎓 Curriculum Overview

- **Level**: Beginner to Intermediate
- **Prerequisite**: Basic familiarity with rows and columns (tables)
- **Pedagogical Goal**: Master `INNER`, `LEFT`, `RIGHT`, and `CROSS` joins, understand Foreign Keys, and demystify how databases handle missing data with `NULL`.

---

## 🗺️ Learning Path Milestones

### 📍 Phase 1: Why Split Data into Multiple Tables?
*Why start here?* Understanding why relational databases normalize data instead of using one giant spreadsheet.

#### Lesson 1.1: Primary Keys & Foreign Keys
- **Concept**: A `users` table holds user identity (`id`). An `orders` table holds transactions, linking back via `user_id` (the Foreign Key).
- **Key Takeaway**: Normalization prevents duplicating user addresses and names 100 times for 100 purchases.

---

### 📍 Phase 2: Finding Matching Data (`INNER JOIN`)
*Why this comes next?* Finding only records that have an active relationship on both sides.

#### Lesson 2.1: The Strict Intersection
- **Concept**: `INNER JOIN` outputs rows only where the join condition matches on BOTH sides (`users.id = orders.user_id`).
- **Learner Action**: Execute an `INNER JOIN`.
- **Visual Feedback**: Notice David (who has 0 orders) is excluded from the result table.
- **The Bridge to Phase 3**: *"What if marketing needs a list of ALL registered users so they can email discounts to users with 0 purchases? INNER JOIN hid them!"*

---

### 📍 Phase 3: Preserving the Left Table (`LEFT JOIN` & `NULL`)
*Why this comes next?* Understanding how databases handle missing or optional relationships.

#### Lesson 3.1: Keeping All Left Rows
- **Concept**: `LEFT JOIN` keeps every single row from the left table (`users`).
- **Learner Action**: Execute a `LEFT JOIN`.
- **Visual Feedback**: David reappears! His missing order columns display as `NULL`.
- **Key Takeaway**: `NULL` means "no value exists here". It allows you to see both active and inactive users in one query.

#### Lesson 3.2: Finding Inactive Users (`WHERE orders.id IS NULL`)
- **Concept**: Using a `LEFT JOIN` paired with `IS NULL` to find orphaned or inactive records.

---

### 📍 Phase 4: Preserving Orphaned Records (`RIGHT JOIN`)
*Why this comes next?* Handling data where the parent record is missing or anonymous.

#### Lesson 4.1: Guest Checkouts & Orphaned Records
- **Concept**: `RIGHT JOIN` preserves every row in the right table (`orders`), even if the user account is missing (`user_id = 99`).
- **Learner Action**: Execute a `RIGHT JOIN` and observe guest orders appear with `NULL` user fields.

---

### 📍 Phase 5: The Cartesian Disaster (`CROSS JOIN`)
*Why this comes next?* Warning engineers about the catastrophic performance cost of omitting the `ON` condition.

#### Lesson 5.1: Table Row Multiplication
- **Concept**: Without a join condition, SQL pairs every single row in Table A with every single row in Table B ($N \times M$).
- **Learner Action**: Execute a `CROSS JOIN` and watch 4 users and 4 orders multiply into 16 rows.
- **Key Takeaway**: In production, cross-joining two 10,000-row tables generates 100,000,000 rows and crashes database RAM!

---

## 🏆 Capstone Challenge: The Marketing Analytics Query
The learner writes the query to solve a real business question:
- Task: Identify all registered users who have NEVER placed an order, so marketing can send a promo code.
- Solution: `SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id WHERE orders.id IS NULL`.
