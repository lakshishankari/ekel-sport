const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

const adminRouter = express.Router();

function isStaffEmail(email) {
  return String(email || "").trim().toLowerCase().endsWith("@kln.ac.lk");
}

// ─────────────────────────────────────────────────────────────
// ENSURE TABLES EXIST (called once on first request)
// ─────────────────────────────────────────────────────────────
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      author_id   BIGINT UNSIGNED NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_role ENUM('ADMIN','STUDENT') NOT NULL,
      sport_tag   VARCHAR(100),
      content     TEXT NOT NULL,
      likes_count INT UNSIGNED DEFAULT 0,
      visibility  ENUM('PUBLIC','ALL_USERS','ENROLLED','ONLY_ME') NOT NULL DEFAULT 'ALL_USERS',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add visibility column if it was created before this migration
  try {
    await pool.query(`ALTER TABLE posts ADD COLUMN visibility ENUM('PUBLIC','ALL_USERS','ENROLLED','ONLY_ME') NOT NULL DEFAULT 'ALL_USERS' AFTER likes_count`);
  } catch (_) { /* column already exists */ }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      post_id   INT UNSIGNED NOT NULL,
      user_id   BIGINT UNSIGNED NOT NULL,
      UNIQUE KEY uq_post_user (post_id, user_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id   BIGINT UNSIGNED NOT NULL,
      admin_name VARCHAR(255) NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      sport_tag  VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id     BIGINT UNSIGNED NOT NULL,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      sport_tag    VARCHAR(100),
      venue        VARCHAR(255),
      event_date   DATE,
      event_time   VARCHAR(50),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id       BIGINT UNSIGNED PRIMARY KEY,
      department    VARCHAR(255),
      year_of_study VARCHAR(100),
      bio           TEXT,
      avatar_color  VARCHAR(20) DEFAULT '#4F46E5',
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Ensure performance_entries exists (may already exist from DB schema)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS performance_entries (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_user_id  BIGINT UNSIGNED NOT NULL,
      sport_id         INT UNSIGNED NOT NULL,
      type             ENUM('MATCH','FITNESS','DISCIPLINE') NOT NULL,
      metric           VARCHAR(255),
      value            DECIMAL(10,2),
      notes            TEXT,
      recorded_by      BIGINT UNSIGNED,
      recorded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Event team members — per-event roster (separate from general squad team)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_team_members (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_id         INT UNSIGNED NOT NULL,
      student_user_id  BIGINT UNSIGNED NOT NULL,
      sport_id         INT UNSIGNED NOT NULL,
      assigned_by      BIGINT UNSIGNED,
      assigned_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event_student (event_id, student_user_id)
    )
  `);
  // Add sport_id column to events table if it doesn't exist yet
  try {
    await pool.query(`ALTER TABLE events ADD COLUMN sport_id INT UNSIGNED NULL AFTER sport_tag`);
    // Back-fill sport_id from sport_tag
    await pool.query(`
      UPDATE events e
      JOIN sports s ON s.name = e.sport_tag
      SET e.sport_id = s.id
      WHERE e.sport_id IS NULL AND e.sport_tag IS NOT NULL
    `);
  } catch (_) { /* column already exists */ }
  // Add event_id column to performance_entries so marks are scoped per-event
  try {
    await pool.query(`ALTER TABLE performance_entries ADD COLUMN event_id INT UNSIGNED NULL AFTER sport_id`);
  } catch (_) { /* column already exists */ }
  // Add created_by_admin_id column if missing (older schema may lack it)
  try {
    await pool.query(`ALTER TABLE performance_entries ADD COLUMN created_by_admin_id BIGINT UNSIGNED NULL`);
  } catch (_) { /* column already exists */ }
  // Add a unique constraint so upsert works cleanly:  one row per student+event+type+metric
  try {
    await pool.query(`ALTER TABLE performance_entries ADD UNIQUE KEY uq_event_student_metric (event_id, student_user_id, type, metric)`);
  } catch (_) { /* constraint already exists */ }
  // Add placement column to performance_entries (1st / 2nd / 3rd / None)
  try {
    await pool.query(`ALTER TABLE performance_entries ADD COLUMN placement VARCHAR(20) NULL AFTER notes`);
  } catch (_) { /* column already exists */ }
  // Add sub_category and gender_category to events
  try {
    await pool.query(`ALTER TABLE events ADD COLUMN sub_category VARCHAR(100) NULL AFTER description`);
  } catch (_) { /* column already exists */ }
  try {
    await pool.query(`ALTER TABLE events ADD COLUMN gender_category VARCHAR(20) NULL AFTER sub_category`);
  } catch (_) { /* column already exists */ }
  // Manual attendance: ensure attendance_sessions table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sport_id     INT UNSIGNED NOT NULL,
      location     VARCHAR(255) NOT NULL,
      session_date DATE NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add columns that may be missing from old QR-era schema
  try { await pool.query(`ALTER TABLE attendance_sessions ADD COLUMN session_name VARCHAR(255) NULL AFTER session_date`);  } catch (_) {}
  try { await pool.query(`ALTER TABLE attendance_sessions ADD COLUMN start_time   VARCHAR(10) NULL AFTER session_name`);   } catch (_) {}
  try { await pool.query(`ALTER TABLE attendance_sessions ADD COLUMN end_time     VARCHAR(10) NULL AFTER start_time`);     } catch (_) {}
  try { await pool.query(`ALTER TABLE attendance_sessions ADD COLUMN created_by   BIGINT UNSIGNED NULL AFTER end_time`);   } catch (_) {}
  // Ensure attendance table exists with status support
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_user_id  BIGINT UNSIGNED NOT NULL,
      sport_id         INT UNSIGNED NOT NULL,
      session_id       INT UNSIGNED NOT NULL,
      session_date     DATE,
      status           ENUM('PRESENT','ABSENT') NOT NULL DEFAULT 'PRESENT',
      marked_by        BIGINT UNSIGNED NULL,
      attended_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add status column to attendance if missing (old schema had no status)
  try {
    await pool.query(`ALTER TABLE attendance ADD COLUMN status ENUM('PRESENT','ABSENT') NOT NULL DEFAULT 'PRESENT' AFTER session_date`);
  } catch (_) { /* already exists */ }
  // Add marked_by column
  try {
    await pool.query(`ALTER TABLE attendance ADD COLUMN marked_by BIGINT UNSIGNED NULL AFTER status`);
  } catch (_) { /* already exists */ }
  // Add unique constraint to prevent duplicate attendance per student per session
  try {
    await pool.query(`ALTER TABLE attendance ADD UNIQUE KEY uq_session_student (session_id, student_user_id)`);
  } catch (_) { /* already exists */ }
  // Add eligibility_criteria column to sports
  try {
    await pool.query(`ALTER TABLE sports ADD COLUMN eligibility_criteria TEXT NULL AFTER whatsapp_link`);
  } catch (_) { /* column already exists */ }
}
ensureTables().catch((e) => console.warn("ensureTables warning:", e.message));

// ─────────────────────────────────────────────────────────────
// PERFORMANCE ENTRIES
// GET  /api/admin/performance/students?sportId=X
//   → returns all APPROVED students for a sport (to load in performance screens)
// POST /api/admin/performance/batch
//   → { sportId, type, entries: [{ studentUserId, metric, value, notes }] }
//   → upsert performance_entries rows
// GET  /api/admin/performance/history?sportId=X&type=MATCH|FITNESS|DISCIPLINE
//   → list recent entries for review
// ─────────────────────────────────────────────────────────────
adminRouter.get("/performance/students", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.query.sportId);
    if (!sportId) return res.status(400).json({ message: "sportId is required" });

    const [rows] = await pool.query(`
      SELECT
        u.id AS student_user_id,
        u.full_name,
        u.student_id,
        se.squad_level
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      WHERE se.sport_id = ? AND se.status = 'APPROVED'
      ORDER BY u.full_name ASC
    `, [sportId]);
    return res.json(rows);
  } catch (err) {
    console.error("PERFORMANCE STUDENTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET existing marks for a specific event
// GET /api/admin/performance/event/:eventId
adminRouter.get("/performance/event/:eventId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) return res.status(400).json({ message: "Invalid eventId" });

    const [rows] = await pool.query(`
      SELECT student_user_id, metric, value, notes, placement
      FROM performance_entries
      WHERE event_id = ? AND type = 'MATCH'
    `, [eventId]);
    return res.json(rows);
  } catch (err) {
    console.error("PERFORMANCE EVENT GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/performance/batch", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.body?.sportId);
    const eventId = req.body?.eventId ? Number(req.body.eventId) : null;
    const type    = String(req.body?.type || "").toUpperCase();
    const entries = req.body?.entries;

    if (!sportId)                               return res.status(400).json({ message: "sportId is required" });
    if (!["MATCH", "FITNESS", "DISCIPLINE"].includes(type)) return res.status(400).json({ message: "type must be MATCH, FITNESS, or DISCIPLINE" });
    if (!Array.isArray(entries) || entries.length === 0)    return res.status(400).json({ message: "entries array is required" });

    let saved = 0;
    for (const entry of entries) {
      const studentUserId = Number(entry.studentUserId);
      const value         = entry.value !== "" && entry.value != null ? Number(entry.value) : null;
      const metric        = String(entry.metric || "Score").trim();
      const notes         = String(entry.notes  || "").trim() || null;

      if (!studentUserId) continue;
      if (value === null) continue;
      if (value < 0 || value > 100) return res.status(400).json({ message: `Score must be between 0 and 100 (got ${value}).` });
      const placement = entry.placement ? String(entry.placement).trim() : null;

      if (eventId) {
        // Upsert: one record per student+event+type+metric
        await pool.query(
          `INSERT INTO performance_entries (student_user_id, sport_id, event_id, type, metric, value, notes, placement, created_by_admin_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value), notes = VALUES(notes), placement = VALUES(placement), created_by_admin_id = VALUES(created_by_admin_id)`,
          [studentUserId, sportId, eventId, type, metric, value, notes, placement, req.user.id]
        );
      } else {
        // No event context — plain insert (fitness / discipline without event)
        await pool.query(
          `INSERT INTO performance_entries (student_user_id, sport_id, type, metric, value, notes, placement, created_by_admin_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [studentUserId, sportId, type, metric, value, notes, placement, req.user.id]
        );
      }
      saved++;
    }

    return res.json({ ok: true, saved });
  } catch (err) {
    console.error("PERFORMANCE BATCH SAVE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


adminRouter.get("/performance/history", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.query.sportId);
    const type    = String(req.query.type || "").toUpperCase();

    let where = "WHERE pe.sport_id = ?";
    const params = [sportId];
    if (["MATCH", "FITNESS", "DISCIPLINE"].includes(type)) {
      where += " AND pe.type = ?";
      params.push(type);
    }

    const [rows] = await pool.query(`
      SELECT
        pe.id, pe.type, pe.metric, pe.value, pe.notes, pe.recorded_at,
        u.full_name, u.student_id
      FROM performance_entries pe
      JOIN users u ON u.id = pe.student_user_id
      ${where}
      ORDER BY pe.recorded_at DESC
      LIMIT 100
    `, params);

    return res.json(rows);
  } catch (err) {
    console.error("PERFORMANCE HISTORY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// ─────────────────────────────────────────────────────────────
// ADMIN STATS (live dashboard counts)
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────
adminRouter.get("/stats", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query(
      "SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'STUDENT'"
    );
    const [[{ totalSports }]] = await pool.query(
      "SELECT COUNT(*) AS totalSports FROM sports"
    );
    const [[{ pendingEnrollments }]] = await pool.query(
      "SELECT COUNT(*) AS pendingEnrollments FROM sport_enrollments WHERE status = 'PENDING'"
    );
    const [[{ inSquadCount }]] = await pool.query(
      "SELECT COUNT(*) AS inSquadCount FROM sport_enrollments WHERE status = 'APPROVED' AND squad_level = 'SQUAD'"
    );
    return res.json({ totalStudents, totalSports, pendingEnrollments, inSquadCount });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN PROFILE
// GET /api/admin/profile
// PUT /api/admin/profile  { fullName }
// ─────────────────────────────────────────────────────────────
adminRouter.get("/profile", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("ADMIN PROFILE GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/profile", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    if (!fullName) return res.status(400).json({ message: "fullName is required" });
    await pool.query("UPDATE users SET full_name = ? WHERE id = ?", [fullName, req.user.id]);
    return res.json({ ok: true, message: "Profile updated" });
  } catch (err) {
    console.error("ADMIN PROFILE PUT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// SOCIAL FEED — POSTS
// GET  /api/admin/posts          — list all posts
// POST /api/admin/posts          — create post (admin)
// POST /api/admin/posts/:id/like — toggle like
// ─────────────────────────────────────────────────────────────
adminRouter.get("/posts", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const filterMySports = req.query.filter === "my-sports";
    // Admins see everything except ONLY_ME posts from other users
    let where = "WHERE (p.visibility != 'ONLY_ME' OR p.author_id = ?)";
    const params = [req.user.id, req.user.id];

    if (filterMySports) {
      // Also filter: get sport names admin is tagged in (sport_tag matches any sport)
      // For admin, "my sports" means posts tagged with any sport (since admin manages all)
      // But for consistency we just show all non-ONLY_ME here
    }

    const [rows] = await pool.query(`
      SELECT
        p.id, p.author_id, p.author_name, p.author_role, p.sport_tag,
        p.content, p.likes_count, p.visibility, p.created_at,
        IFNULL(pl.user_id, 0) AS liked_by_me
      FROM posts p
      LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
      ${where}
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id, req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error("POSTS GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/posts", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const content    = String(req.body?.content    || "").trim();
    const sportTag   = String(req.body?.sportTag   || "").trim() || null;
    const visibility = ["PUBLIC","ALL_USERS","ENROLLED","ONLY_ME"].includes(req.body?.visibility)
      ? req.body.visibility : "ALL_USERS";
    if (!content) return res.status(400).json({ message: "content is required" });

    const [userRow] = await pool.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
    const authorName = userRow[0]?.full_name || "Admin";

    const [result] = await pool.query(
      "INSERT INTO posts (author_id, author_name, author_role, sport_tag, content, visibility) VALUES (?, ?, 'ADMIN', ?, ?, ?)",
      [req.user.id, authorName, sportTag, content, visibility]
    );
    return res.status(201).json({ ok: true, postId: result.insertId });
  } catch (err) {
    console.error("POST CREATE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.id;
    const [existing] = await pool.query(
      "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]
    );
    if (existing.length > 0) {
      await pool.query("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      await pool.query("UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?", [postId]);
      return res.json({ liked: false });
    } else {
      await pool.query("INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      await pool.query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error("LIKE TOGGLE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// GET  /api/admin/announcements
// POST /api/admin/announcements  { title, message, sportTag }
//   → saves to announcements table
//   → inserts into notifications for all students (or sport-specific)
// ─────────────────────────────────────────────────────────────
adminRouter.get("/announcements", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50"
    );
    return res.json(rows);
  } catch (err) {
    console.error("ANNOUNCEMENTS GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/announcements", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const title    = String(req.body?.title   || "").trim();
    const message  = String(req.body?.message || "").trim();
    const sportTag = String(req.body?.sportTag || "").trim() || null;

    if (!title || !message) return res.status(400).json({ message: "title and message are required" });

    const [userRow] = await pool.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
    const adminName = userRow[0]?.full_name || "Admin";

    // Save announcement
    await pool.query(
      "INSERT INTO announcements (admin_id, admin_name, title, message, sport_tag) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, adminName, title, message, sportTag]
    );

    // Push to notifications — all students OR sport-specific students
    let studentIds = [];
    if (sportTag) {
      const [sportRow] = await pool.query("SELECT id FROM sports WHERE name = ? LIMIT 1", [sportTag]);
      if (sportRow[0]) {
        const [enrolled] = await pool.query(
          "SELECT DISTINCT student_user_id FROM sport_enrollments WHERE sport_id = ? AND status = 'APPROVED'",
          [sportRow[0].id]
        );
        studentIds = enrolled.map((r) => r.student_user_id);
      }
    } else {
      const [allStudents] = await pool.query("SELECT id FROM users WHERE role = 'STUDENT'");
      studentIds = allStudents.map((r) => r.id);
    }

    if (studentIds.length > 0) {
      const values = studentIds.map((id) => [id, title, message, "ANNOUNCEMENT"]);
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES ?",
        [values]
      );
    }

    return res.status(201).json({ ok: true, notified: studentIds.length });
  } catch (err) {
    console.error("ANNOUNCEMENT CREATE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// EVENTS
// GET  /api/admin/events
// POST /api/admin/events  { title, description, sportTag, venue, eventDate, eventTime }
// DELETE /api/admin/events/:id
// ─────────────────────────────────────────────────────────────
adminRouter.get("/events", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events ORDER BY event_date ASC, event_time ASC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("EVENTS GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/events", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const title          = String(req.body?.title          || "").trim();
    const description    = String(req.body?.description    || "").trim() || null;
    const sportTag       = String(req.body?.sportTag       || "").trim() || null;
    const venue          = String(req.body?.venue          || "").trim() || null;
    const eventDate      = String(req.body?.eventDate      || "").trim() || null;
    const eventTime      = String(req.body?.eventTime      || "").trim() || null;
    const subCategory    = String(req.body?.subCategory    || "").trim() || null;
    const genderCategory = String(req.body?.genderCategory || "").trim() || null;

    if (!title) return res.status(400).json({ message: "title is required" });

    // Resolve sport_id from sport_tag
    let sportId = null;
    if (sportTag) {
      const [sportRows] = await pool.query("SELECT id FROM sports WHERE name = ? LIMIT 1", [sportTag]);
      sportId = sportRows[0]?.id || null;
    }

    const [result] = await pool.query(
      "INSERT INTO events (admin_id, title, description, sub_category, gender_category, sport_tag, sport_id, venue, event_date, event_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, title, description, subCategory, genderCategory, sportTag, sportId, venue, eventDate, eventTime]
    );

    // Notify all students
    const [allStudents] = await pool.query("SELECT id FROM users WHERE role = 'STUDENT'");
    if (allStudents.length > 0) {
      const values = allStudents.map((r) => [
        r.id,
        `📅 New Event: ${title}`,
        `${venue ? venue + " · " : ""}${eventDate || "Date TBD"} ${eventTime || ""}`.trim(),
        "SYSTEM",
      ]);
      await pool.query("INSERT INTO notifications (user_id, title, message, type) VALUES ?", [values]);
    }

    return res.status(201).json({ ok: true, eventId: result.insertId });
  } catch (err) {
    console.error("EVENT CREATE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.delete("/events/:id", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("EVENT DELETE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
adminRouter.get("/users", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, role, student_id, full_name, email, created_at FROM users ORDER BY id DESC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// SPORTS
// ─────────────────────────────────────────────────────────────
adminRouter.get("/sports", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, venue, schedule_text, instructor_name, instructor_email, whatsapp_link, eligibility_criteria, created_at
       FROM sports ORDER BY id DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("ADMIN SPORTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/sports", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const name                 = String(req.body?.name                 || "").trim();
    const venue                = String(req.body?.venue                || "").trim();
    const schedule_text        = String(req.body?.schedule_text        || "").trim();
    const instructor_name      = String(req.body?.instructor_name      || "").trim();
    const instructor_email     = String(req.body?.instructor_email     || "").trim().toLowerCase();
    const whatsapp_link        = String(req.body?.whatsapp_link        || "").trim();
    const eligibility_criteria = String(req.body?.eligibility_criteria || "").trim();

    if (!name) return res.status(400).json({ message: "Sport name is required" });

    // instructor_email is optional — accept any email format or leave blank
    const [existing] = await pool.query("SELECT id FROM sports WHERE name = ?", [name]);
    if (existing.length > 0) return res.status(409).json({ message: "Sport already exists" });

    const [result] = await pool.query(
      `INSERT INTO sports (name, venue, schedule_text, instructor_name, instructor_email, whatsapp_link, eligibility_criteria)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, venue || null, schedule_text || null, instructor_name || null, instructor_email || null, whatsapp_link || null, eligibility_criteria || null]
    );
    return res.status(201).json({ message: "Sport created successfully", sportId: result.insertId });
  } catch (err) {
    console.error("CREATE SPORT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// ENROLLMENTS
// ─────────────────────────────────────────────────────────────
adminRouter.get("/enrollments/pending", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        se.id AS enrollment_id, se.status, se.requested_at,
        s.id AS sport_id, s.name AS sport_name,
        u.id AS student_user_id, u.student_id, u.full_name, u.email
      FROM sport_enrollments se
      JOIN sports s ON s.id = se.sport_id
      JOIN users u  ON u.id = se.student_user_id
      WHERE se.status = 'PENDING'
      ORDER BY se.requested_at ASC
    `);
    return res.json(rows);
  } catch (err) {
    console.error("PENDING ENROLLMENTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/enrollments/:enrollmentId/decision", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const enrollmentId = Number(req.params.enrollmentId);
    const decision     = String(req.body?.decision || "").toUpperCase();
    const note         = String(req.body?.note     || "").trim();

    if (!enrollmentId) return res.status(400).json({ message: "Invalid enrollmentId" });
    if (!["APPROVE", "REJECT"].includes(decision))
      return res.status(400).json({ message: "decision must be APPROVE or REJECT" });

    const [rows] = await pool.query("SELECT id, status FROM sport_enrollments WHERE id = ?", [enrollmentId]);
    if (rows.length === 0) return res.status(404).json({ message: "Enrollment not found" });
    if (rows[0].status !== "PENDING") return res.status(409).json({ message: "Already decided" });

    const newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const [detailRows] = await pool.query(
      `SELECT se.student_user_id, s.name AS sport_name
       FROM sport_enrollments se JOIN sports s ON s.id = se.sport_id WHERE se.id = ? LIMIT 1`,
      [enrollmentId]
    );

    await pool.query(
      `UPDATE sport_enrollments SET status = ?, decided_at = NOW(), decided_by_admin_id = ?, decision_note = ? WHERE id = ?`,
      [newStatus, req.user.id, note || null, enrollmentId]
    );

    if (detailRows.length > 0) {
      const { student_user_id, sport_name } = detailRows[0];
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'ENROLLMENT')",
        [student_user_id, `Sport Enrollment ${newStatus}`, `Your request to join ${sport_name} was ${newStatus}.`]
      );
    }
    return res.json({ message: `Enrollment ${newStatus}` });
  } catch (err) {
    console.error("ENROLLMENT DECISION ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// CREATE ADVISORY ACCOUNT
// ─────────────────────────────────────────────────────────────
adminRouter.post("/create-advisory", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const email    = String(req.body?.email    || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!fullName || !email || !password) return res.status(400).json({ message: "fullName, email, password are required" });
    if (password.length < 8)              return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!isStaffEmail(email))             return res.status(400).json({ message: "Advisory email must be an official @kln.ac.lk email" });

    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (role, student_id, full_name, email, password_hash) VALUES (?, ?, ?, ?, ?)`,
      ["ADVISORY", null, fullName, email, passwordHash]
    );
    return res.status(201).json({ message: "Advisory account created", user: { id: result.insertId, role: "ADVISORY", fullName, email } });
  } catch (err) {
    console.error("CREATE ADVISORY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// SQUAD POOL
// ─────────────────────────────────────────────────────────────
adminRouter.get("/squad-pool/sports", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT s.id, s.name FROM sports s
      INNER JOIN sport_enrollments se ON se.sport_id = s.id
      WHERE se.status = 'APPROVED' ORDER BY s.name ASC
    `);
    return res.json(rows);
  } catch (err) {
    console.error("SQUAD-POOL SPORTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/squad-pool/:sportId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.params.sportId);
    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    const [rows] = await pool.query(`
      SELECT
        u.id AS student_user_id, u.full_name, u.student_id,
        se.squad_level,
        COUNT(DISTINCT a.id)    AS attendance_count,
        COUNT(DISTINCT pe.id)   AS performance_count,
        ROUND(AVG(pe.value), 1) AS avg_score,
        SUM(CASE WHEN pe.type = 'MATCH'      THEN 1 ELSE 0 END) AS match_entries,
        SUM(CASE WHEN pe.type = 'FITNESS'    THEN 1 ELSE 0 END) AS fitness_entries,
        SUM(CASE WHEN pe.type = 'DISCIPLINE' THEN 1 ELSE 0 END) AS discipline_entries,
        (SELECT COUNT(*) FROM student_team_assignment sta
         WHERE sta.student_user_id = u.id AND sta.sport_id = ?) AS in_team
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      LEFT JOIN attendance a   ON a.student_user_id = u.id AND a.sport_id = ?
      LEFT JOIN performance_entries pe ON pe.student_user_id = u.id AND pe.sport_id = ?
      WHERE se.sport_id = ? AND se.status = 'APPROVED'
      GROUP BY u.id, u.full_name, u.student_id, se.squad_level
      ORDER BY se.squad_level DESC, avg_score DESC
    `, [sportId, sportId, sportId, sportId]);
    return res.json(rows);
  } catch (err) {
    console.error("SQUAD-POOL STUDENTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/squad-pool/:sportId/:studentUserId/level", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId       = Number(req.params.sportId);
    const studentUserId = Number(req.params.studentUserId);
    const level         = String(req.body?.level || "").toUpperCase();

    if (!sportId || !studentUserId) return res.status(400).json({ message: "Invalid sportId or studentUserId" });
    if (!["NONE", "POOL", "SQUAD"].includes(level)) return res.status(400).json({ message: "level must be NONE, POOL, or SQUAD" });

    const [rows] = await pool.query(
      "SELECT id FROM sport_enrollments WHERE sport_id=? AND student_user_id=? AND status='APPROVED'",
      [sportId, studentUserId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "No approved enrollment found" });

    await pool.query(
      "UPDATE sport_enrollments SET squad_level=? WHERE sport_id=? AND student_user_id=?",
      [level, sportId, studentUserId]
    );

    const [sportRows] = await pool.query("SELECT name FROM sports WHERE id=?", [sportId]);
    const sportName = sportRows[0]?.name || "Unknown Sport";
    const msgs = {
      POOL:  `You have been selected to the ${sportName} Pool! Keep training hard.`,
      SQUAD: `Congratulations! You have been selected to the ${sportName} Squad! 🏆`,
      NONE:  `Your squad/pool status for ${sportName} has been updated.`,
    };
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
      [studentUserId, `${sportName} — Level Updated`, msgs[level]]
    );
    return res.json({ ok: true, level });
  } catch (err) {
    console.error("SET SQUAD LEVEL ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/squad-pool/:sportId/:studentUserId/team", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId       = Number(req.params.sportId);
    const studentUserId = Number(req.params.studentUserId);
    const inTeam        = Boolean(req.body?.inTeam);

    if (!sportId || !studentUserId) return res.status(400).json({ message: "Invalid sportId or studentUserId" });

    if (inTeam) {
      const [existing] = await pool.query(
        "SELECT id FROM student_team_assignment WHERE sport_id=? AND student_user_id=?",
        [sportId, studentUserId]
      );
      if (existing.length === 0) {
        const [enrollRow] = await pool.query(
          "SELECT squad_level FROM sport_enrollments WHERE sport_id=? AND student_user_id=? LIMIT 1",
          [sportId, studentUserId]
        );
        const teamLevel = ["POOL","SQUAD"].includes(enrollRow[0]?.squad_level) ? enrollRow[0].squad_level : "SQUAD";
        await pool.query(
          "INSERT INTO student_team_assignment (sport_id, student_user_id, assigned_by_admin_id, level) VALUES (?, ?, ?, ?)",
          [sportId, studentUserId, req.user.id, teamLevel]
        );
      }
      const [sportRows] = await pool.query("SELECT name FROM sports WHERE id=?", [sportId]);
      const sportName = sportRows[0]?.name || "Unknown Sport";
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
        [studentUserId, `${sportName} — Team Selected`, `You have been selected for the official ${sportName} team! 🎉`]
      );
    } else {
      await pool.query("DELETE FROM student_team_assignment WHERE sport_id=? AND student_user_id=?", [sportId, studentUserId]);
    }
    return res.json({ ok: true, inTeam });
  } catch (err) {
    console.error("TOGGLE TEAM ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// REPORTS — aggregated data for admin reports screen
// GET /api/admin/reports/summary
// ─────────────────────────────────────────────────────────────
adminRouter.get("/reports/summary", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    // KPI
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'STUDENT'");
    const [[{ totalSports }]]   = await pool.query("SELECT COUNT(*) AS totalSports FROM sports");
    const [[{ totalSessions }]] = await pool.query("SELECT COUNT(*) AS totalSessions FROM attendance_sessions").catch(() => [[{ totalSessions: 0 }]]);
    const [[{ eligibleCount }]] = await pool.query("SELECT COUNT(*) AS eligibleCount FROM sport_enrollments WHERE squad_level IN ('POOL','SQUAD') AND status='APPROVED'");

    // Per-sport stats
    const [sportStats] = await pool.query(`
      SELECT
        s.name AS sport,
        COUNT(DISTINCT se.student_user_id) AS enrolled,
        ROUND(AVG(CASE WHEN pe.type = 'MATCH'      THEN pe.value END), 1) AS avg_match,
        ROUND(AVG(CASE WHEN pe.type = 'FITNESS'    THEN pe.value END), 1) AS avg_fitness,
        ROUND(AVG(CASE WHEN pe.type = 'DISCIPLINE' THEN pe.value END), 1) AS avg_discipline,
        SUM(CASE WHEN se.squad_level IN ('POOL','SQUAD') THEN 1 ELSE 0 END) AS eligible
      FROM sports s
      LEFT JOIN sport_enrollments se ON se.sport_id = s.id AND se.status = 'APPROVED'
      LEFT JOIN performance_entries pe ON pe.student_user_id = se.student_user_id AND pe.sport_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `);

    // Top performers across all sports
    const [topStudents] = await pool.query(`
      SELECT
        u.full_name AS name,
        s.name AS sport,
        ROUND(AVG(pe.value), 1) AS avg_score,
        se.squad_level
      FROM users u
      JOIN sport_enrollments se ON se.student_user_id = u.id AND se.status = 'APPROVED'
      JOIN sports s ON s.id = se.sport_id
      LEFT JOIN performance_entries pe ON pe.student_user_id = u.id AND pe.sport_id = s.id
      GROUP BY u.id, s.id
      HAVING avg_score IS NOT NULL
      ORDER BY avg_score DESC
      LIMIT 10
    `);

    return res.json({
      kpi: { totalStudents, totalSports, totalSessions, eligibleCount },
      sportStats: sportStats.map((r) => ({
        sport:      r.sport,
        enrolled:   Number(r.enrolled),
        avgMatch:   Number(r.avg_match   ?? 0),
        avgFitness: Number(r.avg_fitness ?? 0),
        avgDisc:    Number(r.avg_discipline ?? 0),
        eligible:   Number(r.eligible),
      })),
      topStudents: topStudents.map((r) => ({
        name:       r.name,
        sport:      r.sport,
        avgScore:   Number(r.avg_score ?? 0),
        squadLevel: r.squad_level,
      })),
    });
  } catch (err) {
    console.error("REPORTS SUMMARY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// EVENT TEAM MEMBERS — per-event roster
// GET    /api/admin/events/by-sport/:sportId — events for a sport
// GET    /api/admin/event-team/:eventId       — team assigned to event
// POST   /api/admin/event-team/:eventId/assign   — add student to event team
// DELETE /api/admin/event-team/:eventId/:studentUserId — remove from event team
// ─────────────────────────────────────────────────────────────

// GET events by sport (joins sport_id OR name-matches sport_tag)
adminRouter.get("/events/by-sport/:sportId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.params.sportId);
    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    // Get sport name for tag fallback matching
    const [sportRows] = await pool.query("SELECT name FROM sports WHERE id = ?", [sportId]);
    const sportName = sportRows[0]?.name || "";

    const [rows] = await pool.query(`
      SELECT id, title, description, sub_category, gender_category, sport_tag, sport_id, venue, event_date, event_time, created_at
      FROM events
      WHERE sport_id = ? OR (sport_id IS NULL AND sport_tag = ?)
      ORDER BY event_date DESC, created_at DESC
    `, [sportId, sportName]);
    return res.json(rows);
  } catch (err) {
    console.error("EVENTS BY SPORT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET team members assigned to an event
adminRouter.get("/event-team/:eventId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) return res.status(400).json({ message: "Invalid eventId" });

    const [rows] = await pool.query(`
      SELECT
        etm.id, etm.event_id, etm.student_user_id, etm.sport_id, etm.assigned_at,
        u.full_name, u.student_id,
        se.squad_level,
        COALESCE(ROUND(AVG(pe.value), 1), 0) AS avg_score
      FROM event_team_members etm
      JOIN users u ON u.id = etm.student_user_id
      LEFT JOIN sport_enrollments se ON se.student_user_id = etm.student_user_id AND se.sport_id = etm.sport_id
      LEFT JOIN performance_entries pe ON pe.student_user_id = etm.student_user_id AND pe.sport_id = etm.sport_id
      WHERE etm.event_id = ?
      GROUP BY etm.id, u.full_name, u.student_id, se.squad_level
      ORDER BY avg_score DESC
    `, [eventId]);
    return res.json(rows);
  } catch (err) {
    console.error("EVENT TEAM GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST assign student to event team
adminRouter.post("/event-team/:eventId/assign", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const eventId       = Number(req.params.eventId);
    const studentUserId = Number(req.body?.studentUserId);
    const sportId       = Number(req.body?.sportId);

    if (!eventId || !studentUserId || !sportId)
      return res.status(400).json({ message: "eventId, studentUserId, sportId are required" });

    await pool.query(
      `INSERT IGNORE INTO event_team_members (event_id, student_user_id, sport_id, assigned_by) VALUES (?, ?, ?, ?)`,
      [eventId, studentUserId, sportId, req.user.id]
    );

    // Notify student
    const [evtRows] = await pool.query("SELECT title FROM events WHERE id = ?", [eventId]);
    const evtTitle = evtRows[0]?.title || "an event";
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
      [studentUserId, `Event Team Selected`, `You have been selected for the team: ${evtTitle} 🎉`]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("EVENT TEAM ASSIGN ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE remove student from event team
adminRouter.delete("/event-team/:eventId/:studentUserId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const eventId       = Number(req.params.eventId);
    const studentUserId = Number(req.params.studentUserId);
    if (!eventId || !studentUserId)
      return res.status(400).json({ message: "Invalid params" });

    await pool.query(
      "DELETE FROM event_team_members WHERE event_id = ? AND student_user_id = ?",
      [eventId, studentUserId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("EVENT TEAM REMOVE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET squad/pool members for a sport (for event team assignment from squad)
adminRouter.get("/squad-pool/:sportId/squad-members", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId = Number(req.params.sportId);
    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    const [rows] = await pool.query(`
      SELECT
        u.id AS student_user_id, u.full_name, u.student_id,
        se.squad_level,
        COALESCE(ROUND(AVG(pe.value), 1), 0) AS avg_score,
        COUNT(DISTINCT a.id) AS attendance_count
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      LEFT JOIN performance_entries pe ON pe.student_user_id = u.id AND pe.sport_id = ?
      LEFT JOIN attendance a ON a.student_user_id = u.id AND a.sport_id = ?
      WHERE se.sport_id = ? AND se.status = 'APPROVED' AND se.squad_level IN ('POOL', 'SQUAD')
      GROUP BY u.id, u.full_name, u.student_id, se.squad_level
      ORDER BY avg_score DESC
    `, [sportId, sportId, sportId]);
    return res.json(rows);
  } catch (err) {
    console.error("SQUAD MEMBERS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// ATTENDANCE SESSIONS
// GET  /api/admin/attendance/sessions          — list all sessions
// GET  /api/admin/attendance/sessions/:id/attendees — attendees for session
// POST /api/admin/attendance/sessions          — create a session
// ─────────────────────────────────────────────────────────────

// GET all sessions with attendee counts
adminRouter.get("/attendance/sessions", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ats.id,
        s.name       AS sport,
        s.id         AS sport_id,
        ats.session_date,
        ats.session_name,
        ats.location,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent_count,
        COUNT(a.id)  AS attendees,
        (SELECT COUNT(*) FROM sport_enrollments se
         WHERE se.sport_id = ats.sport_id AND se.status = 'APPROVED') AS total_enrolled
      FROM attendance_sessions ats
      JOIN sports s ON s.id = ats.sport_id
      LEFT JOIN attendance a ON a.session_id = ats.id
      GROUP BY ats.id, s.name, s.id, ats.session_date, ats.session_name, ats.location
      ORDER BY ats.session_date DESC, ats.created_at DESC
      LIMIT 100
    `);
    return res.json(rows);
  } catch (err) {
    console.error("ATTENDANCE SESSIONS LIST ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET all enrolled students for a session's sport, with their current attendance status
// GET /api/admin/attendance/sessions/:id/enrolled
adminRouter.get("/attendance/sessions/:id/enrolled", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) return res.status(400).json({ message: "Invalid sessionId" });

    // Get session's sport_id
    const [sessRows] = await pool.query(
      "SELECT sport_id FROM attendance_sessions WHERE id = ? LIMIT 1",
      [sessionId]
    );
    if (sessRows.length === 0) return res.status(404).json({ message: "Session not found" });
    const { sport_id } = sessRows[0];

    // All approved enrolled students + their status for this specific session
    const [rows] = await pool.query(`
      SELECT
        u.id          AS student_user_id,
        u.full_name,
        u.student_id,
        se.squad_level,
        IFNULL(a.status, 'NOT_MARKED') AS status,
        a.attended_at
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      LEFT JOIN attendance a ON a.student_user_id = se.student_user_id AND a.session_id = ?
      WHERE se.sport_id = ? AND se.status = 'APPROVED'
      ORDER BY u.full_name ASC
    `, [sessionId, sport_id]);
    return res.json(rows);
  } catch (err) {
    console.error("SESSION ENROLLED ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET attendees (only those who have a record) for a specific session
adminRouter.get("/attendance/sessions/:id/attendees", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) return res.status(400).json({ message: "Invalid sessionId" });

    const [rows] = await pool.query(`
      SELECT
        u.id AS student_user_id,
        u.full_name,
        u.student_id,
        se.squad_level,
        a.status,
        a.attended_at
      FROM attendance a
      JOIN users u ON u.id = a.student_user_id
      LEFT JOIN attendance_sessions ats ON ats.id = a.session_id
      LEFT JOIN sport_enrollments se ON se.student_user_id = u.id AND se.sport_id = ats.sport_id
      WHERE a.session_id = ?
      ORDER BY a.status ASC, u.full_name ASC
    `, [sessionId]);
    return res.json(rows);
  } catch (err) {
    console.error("SESSION ATTENDEES ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST bulk mark attendance for a session
// Body: { entries: [{ studentUserId, status: 'PRESENT'|'ABSENT' }] }
adminRouter.post("/attendance/sessions/:id/mark", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const entries   = req.body?.entries;
    const adminId   = req.user.id;

    if (!sessionId) return res.status(400).json({ message: "Invalid sessionId" });
    if (!Array.isArray(entries) || entries.length === 0)
      return res.status(400).json({ message: "entries array is required" });

    // Verify session exists and get sport_id
    const [sessRows] = await pool.query(
      "SELECT sport_id, session_date FROM attendance_sessions WHERE id = ? LIMIT 1",
      [sessionId]
    );
    if (sessRows.length === 0) return res.status(404).json({ message: "Session not found" });
    const { sport_id, session_date } = sessRows[0];

    let saved = 0;
    for (const entry of entries) {
      const studentUserId = Number(entry.studentUserId);
      const status = ["PRESENT", "ABSENT"].includes(entry.status) ? entry.status : null;
      if (!studentUserId || !status) continue;

      // Upsert: insert or update on duplicate (session_id, student_user_id)
      await pool.query(`
        INSERT INTO attendance (student_user_id, sport_id, session_id, session_date, status, marked_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
      `, [studentUserId, sport_id, sessionId, session_date, status, adminId]);
      saved++;
    }

    return res.json({ ok: true, saved });
  } catch (err) {
    console.error("BULK MARK ATTENDANCE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST create a new session
adminRouter.post("/attendance/sessions", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sportId    = Number(req.body?.sportId);
    const location   = String(req.body?.location   || "").trim();
    const sessionDate= String(req.body?.sessionDate || "").trim();
    const sessionName= String(req.body?.sessionName || "").trim() || null;
    const startTime  = String(req.body?.startTime   || "").trim() || null;
    const endTime    = String(req.body?.endTime     || "").trim() || null;

    if (!sportId || !location || !sessionDate)
      return res.status(400).json({ message: "sportId, location and sessionDate are required" });

    let result;
    try {
      // Try full insert with new columns (start_time, end_time, created_by)
      [result] = await pool.query(
        "INSERT INTO attendance_sessions (sport_id, location, session_date, session_name, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [sportId, location, sessionDate, sessionName, startTime, endTime, req.user.id]
      );
    } catch (innerErr) {
      // Fallback: columns may not exist yet in older DB — use base insert
      console.warn("Session insert fell back to base schema:", innerErr.message);
      [result] = await pool.query(
        "INSERT INTO attendance_sessions (sport_id, location, session_date, session_name) VALUES (?, ?, ?, ?)",
        [sportId, location, sessionDate, sessionName]
      );
    }
    return res.status(201).json({ ok: true, sessionId: result.insertId });
  } catch (err) {
    console.error("CREATE SESSION ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET single session detail
adminRouter.get("/attendance/sessions/:id", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) return res.status(400).json({ message: "Invalid sessionId" });
    const [rows] = await pool.query(`
      SELECT
        ats.id, ats.session_date, ats.session_name, ats.location, ats.start_time, ats.end_time, ats.created_at,
        s.id AS sport_id, s.name AS sport,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent_count,
        COUNT(a.id) AS marked_count,
        (SELECT COUNT(*) FROM sport_enrollments se
         WHERE se.sport_id = ats.sport_id AND se.status = 'APPROVED') AS total_enrolled
      FROM attendance_sessions ats
      JOIN sports s ON s.id = ats.sport_id
      LEFT JOIN attendance a ON a.session_id = ats.id
      WHERE ats.id = ?
      GROUP BY ats.id, s.id, s.name
    `, [sessionId]);
    if (rows.length === 0) return res.status(404).json({ message: "Session not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("SESSION DETAIL ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE a session (and cascade-remove attendance records)
adminRouter.delete("/attendance/sessions/:id", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) return res.status(400).json({ message: "Invalid sessionId" });
    // Remove linked attendance rows first to avoid FK constraint issues
    await pool.query("DELETE FROM attendance WHERE session_id = ?", [sessionId]);
    const [result] = await pool.query("DELETE FROM attendance_sessions WHERE id = ?", [sessionId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Session not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE SESSION ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET attendance records filtered by user (admin view of a student's history)
// GET /api/admin/attendance/user/:userId
adminRouter.get("/attendance/user/:userId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: "Invalid userId" });
    const [rows] = await pool.query(`
      SELECT
        a.id, a.status, a.attended_at,
        ats.id AS session_id, ats.session_date, ats.session_name, ats.location,
        ats.start_time, ats.end_time,
        s.name AS sport, s.id AS sport_id
      FROM attendance a
      JOIN attendance_sessions ats ON ats.id = a.session_id
      JOIN sports s ON s.id = ats.sport_id
      WHERE a.student_user_id = ?
      ORDER BY ats.session_date DESC, ats.created_at DESC
    `, [userId]);
    return res.json(rows);
  } catch (err) {
    console.error("ATTENDANCE BY USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { adminRouter };

