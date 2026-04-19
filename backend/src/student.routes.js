const express = require("express");
const router  = express.Router();
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

/**
 * STUDENT ROUTES (RBAC: STUDENT)
 * Base: /api/student
 */

// ─────────────────────────────────────────────────────────────
// PROFILE (DB-backed)
// GET /api/student/profile
// PUT /api/student/profile  { department, yearOfStudy, bio, avatarColor }
// ─────────────────────────────────────────────────────────────
router.get("/profile", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [userRows] = await pool.query(
      "SELECT id, full_name, email, student_id, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!userRows[0]) return res.status(404).json({ message: "User not found" });

    const [profileRows] = await pool.query(
      "SELECT department, year_of_study, bio, avatar_color FROM user_profiles WHERE user_id = ?",
      [req.user.id]
    );
    const profile = profileRows[0] || { department: "", year_of_study: "", bio: "", avatar_color: "#4F46E5" };

    return res.json({
      ...userRows[0],
      department:  profile.department  || "",
      yearOfStudy: profile.year_of_study || "",
      bio:         profile.bio         || "",
      avatarColor: profile.avatar_color || "#4F46E5",
    });
  } catch (err) {
    console.error("STUDENT PROFILE GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/profile", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const department  = String(req.body?.department  || "").trim();
    const yearOfStudy = String(req.body?.yearOfStudy || "").trim();
    const bio         = String(req.body?.bio         || "").trim();
    const avatarColor = String(req.body?.avatarColor || "#4F46E5").trim();

    await pool.query(`
      INSERT INTO user_profiles (user_id, department, year_of_study, bio, avatar_color)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        department    = VALUES(department),
        year_of_study = VALUES(year_of_study),
        bio           = VALUES(bio),
        avatar_color  = VALUES(avatar_color)
    `, [req.user.id, department, yearOfStudy, bio, avatarColor]);

    return res.json({ ok: true, message: "Profile updated" });
  } catch (err) {
    console.error("STUDENT PROFILE PUT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// SOCIAL FEED — POSTS (visible to student)
// GET  /api/student/posts
// POST /api/student/posts  { content, sportTag }
// POST /api/student/posts/:id/like
// ─────────────────────────────────────────────────────────────
router.get("/posts", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const filterMySports = req.query.filter === "my-sports";
    const userId = req.user.id;

    // Get all sport names the student is enrolled in (APPROVED)
    const [enrolledRows] = await pool.query(`
      SELECT s.name AS sport_name, s.id AS sport_id
      FROM sport_enrollments se
      JOIN sports s ON s.id = se.sport_id
      WHERE se.student_user_id = ? AND se.status = 'APPROVED'
    `, [userId]);
    const enrolledSportNames = enrolledRows.map((r) => r.sport_name);

    // Build visibility filter:
    //   PUBLIC      → always show
    //   ALL_USERS   → always show
    //   ENROLLED    → show only if post sport_tag is a sport the student enrolled in, or sport_tag is null
    //   ONLY_ME     → show only to the author
    // Plus optional my-sports filter
    let sportFilter = "";
    const params = [userId];

    let visibilityWhere;
    if (enrolledSportNames.length > 0) {
      const placeholders = enrolledSportNames.map(() => "?").join(",");
      visibilityWhere = `(
        p.visibility IN ('PUBLIC','ALL_USERS')
        OR (p.visibility = 'ENROLLED' AND (p.sport_tag IN (${placeholders}) OR p.sport_tag IS NULL))
        OR (p.visibility = 'ONLY_ME'  AND p.author_id = ?)
      )`;
      params.push(...enrolledSportNames, userId);
    } else {
      visibilityWhere = `(
        p.visibility IN ('PUBLIC','ALL_USERS')
        OR (p.visibility = 'ONLY_ME' AND p.author_id = ?)
      )`;
      params.push(userId);
    }

    if (filterMySports && enrolledSportNames.length > 0) {
      const placeholders = enrolledSportNames.map(() => "?").join(",");
      sportFilter = `AND (p.sport_tag IN (${placeholders}) OR p.sport_tag IS NULL)`;
      params.push(...enrolledSportNames);
    }

    const [rows] = await pool.query(`
      SELECT
        p.id, p.author_id, p.author_name, p.author_role, p.sport_tag,
        p.content, p.likes_count, p.visibility, p.created_at,
        IFNULL(pl.user_id, 0) AS liked_by_me
      FROM posts p
      LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
      WHERE ${visibilityWhere} ${sportFilter}
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [userId, ...params]);
    return res.json(rows);
  } catch (err) {
    console.error("STUDENT POSTS GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/posts", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const content    = String(req.body?.content    || "").trim();
    const sportTag   = String(req.body?.sportTag   || "").trim() || null;
    const visibility = ["PUBLIC","ALL_USERS","ENROLLED","ONLY_ME"].includes(req.body?.visibility)
      ? req.body.visibility : "ALL_USERS";
    if (!content) return res.status(400).json({ message: "content is required" });

    const [userRow] = await pool.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
    const authorName = userRow[0]?.full_name || "Student";

    const [result] = await pool.query(
      "INSERT INTO posts (author_id, author_name, author_role, sport_tag, content, visibility) VALUES (?, ?, 'STUDENT', ?, ?, ?)",
      [req.user.id, authorName, sportTag, content, visibility]
    );
    return res.status(201).json({ ok: true, postId: result.insertId });
  } catch (err) {
    console.error("STUDENT POST CREATE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/posts/:id/like", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
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
    console.error("STUDENT LIKE TOGGLE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// EVENTS (student can view upcoming events)
// GET /api/student/events
// ─────────────────────────────────────────────────────────────
router.get("/events", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events ORDER BY event_date ASC, event_time ASC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("STUDENT EVENTS GET ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// SPORTS
// ─────────────────────────────────────────────────────────────
router.get("/sports", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const studentUserId = req.user.id;
    const [rows] = await pool.query(`
      SELECT
        s.id, s.name, s.venue, s.schedule_text,
        s.instructor_name, s.instructor_email, s.whatsapp_link,
        se.status AS enrollment_status,
        se.requested_at, se.decided_at
      FROM sports s
      LEFT JOIN sport_enrollments se
        ON se.sport_id = s.id AND se.student_user_id = ?
      ORDER BY s.name ASC
    `, [studentUserId]);
    return res.json(rows);
  } catch (err) {
    console.error("GET /student/sports error:", err);
    return res.status(500).json({ message: "Failed to load sports" });
  }
});

router.post("/sports/:sportId/enroll", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const studentUserId = req.user.id;
    const sportId = Number(req.params.sportId);
    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    const [sportRows] = await pool.query("SELECT id FROM sports WHERE id = ?", [sportId]);
    if (sportRows.length === 0) return res.status(404).json({ message: "Sport not found" });

    const [existingRows] = await pool.query(
      "SELECT id, status FROM sport_enrollments WHERE sport_id = ? AND student_user_id = ? LIMIT 1",
      [sportId, studentUserId]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.status === "PENDING")  return res.status(409).json({ message: "Request already pending" });
      if (existing.status === "APPROVED") return res.status(409).json({ message: "Already approved for this sport" });
      await pool.query(
        "UPDATE sport_enrollments SET status = 'PENDING', requested_at = NOW(), decided_at = NULL, decided_by_admin_id = NULL WHERE id = ?",
        [existing.id]
      );
      return res.json({ ok: true, status: "PENDING", message: "Re-requested successfully" });
    }

    await pool.query(
      "INSERT INTO sport_enrollments (sport_id, student_user_id, status, requested_at) VALUES (?, ?, 'PENDING', NOW())",
      [sportId, studentUserId]
    );
    return res.json({ ok: true, status: "PENDING", message: "Enrollment request created" });
  } catch (err) {
    console.error("POST /student/sports/:sportId/enroll error:", err);
    return res.status(500).json({ message: "Failed to create enrollment request" });
  }
});

router.get("/my-sports", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id, s.name, s.venue, s.schedule_text,
        s.instructor_name, s.instructor_email, s.whatsapp_link,
        se.status AS enrollment_status, se.decided_at
      FROM sport_enrollments se
      INNER JOIN sports s ON s.id = se.sport_id
      WHERE se.student_user_id = ? AND se.status = 'APPROVED'
      ORDER BY s.name ASC
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error("GET /student/my-sports error:", err);
    return res.status(500).json({ message: "Failed to load my sports" });
  }
});

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
router.get("/notifications", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /student/notifications error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.get("/notifications/unread-count", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    return res.json({ unread: rows[0]?.unread || 0 });
  } catch (err) {
    console.error("GET /student/notifications/unread-count error:", err);
    return res.status(500).json({ message: "Failed to get unread count" });
  }
});

router.post("/notifications/:id/read", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const notifId = Number(req.params.id);
    if (!notifId) return res.status(400).json({ message: "Invalid notification id" });
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notifId, req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /student/notifications/:id/read error:", err);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

router.post("/notifications/read-all", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /student/notifications/read-all error:", err);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// ─────────────────────────────────────────────────────────────
// ATTENDANCE (student view)
// GET /api/student/attendance  → list attendance counts per sport
// ─────────────────────────────────────────────────────────────
router.get("/attendance", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    // Count distinct sessions the student attended per sport
    const [rows] = await pool.query(`
      SELECT
        s.id   AS sport_id,
        s.name AS sport_name,
        COUNT(a.id) AS days_attended,
        (SELECT COUNT(*) FROM attendance_sessions ats WHERE ats.sport_id = s.id) AS total_sessions
      FROM sport_enrollments se
      JOIN sports s ON s.id = se.sport_id
      LEFT JOIN attendance a ON a.sport_id = s.id AND a.student_user_id = ?
      WHERE se.student_user_id = ? AND se.status = 'APPROVED'
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `, [req.user.id, req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error("GET /student/attendance error:", err);
    return res.status(500).json({ message: "Failed to load attendance" });
  }
});

// ─────────────────────────────────────────────────────────────
// PERFORMANCE (student view)
// GET /api/student/performance  → aggregated scores per type per sport
// ─────────────────────────────────────────────────────────────
router.get("/performance", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    // Per sport, per type avg
    const [rows] = await pool.query(`
      SELECT
        s.id   AS sport_id,
        s.name AS sport_name,
        pe.type,
        ROUND(AVG(pe.value), 1) AS avg_score,
        COUNT(pe.id)            AS entry_count,
        MAX(pe.value)           AS best_score,
        MIN(pe.value)           AS lowest_score
      FROM sport_enrollments se
      JOIN sports s ON s.id = se.sport_id
      JOIN performance_entries pe ON pe.student_user_id = ? AND pe.sport_id = s.id
      WHERE se.student_user_id = ? AND se.status = 'APPROVED'
      GROUP BY s.id, s.name, pe.type
      ORDER BY s.name ASC, pe.type ASC
    `, [req.user.id, req.user.id]);

    // Also get squad level per sport
    const [squadRows] = await pool.query(`
      SELECT s.id AS sport_id, se.squad_level
      FROM sport_enrollments se
      JOIN sports s ON s.id = se.sport_id
      WHERE se.student_user_id = ? AND se.status = 'APPROVED'
    `, [req.user.id]);

    const squadMap = {};
    squadRows.forEach(r => { squadMap[r.sport_id] = r.squad_level || "NONE"; });

    // Group by sport
    const bySpot = {};
    rows.forEach(r => {
      if (!bySpot[r.sport_id]) {
        bySpot[r.sport_id] = {
          sport_id:    r.sport_id,
          sport_name:  r.sport_name,
          squad_level: squadMap[r.sport_id] || "NONE",
          types:       {}
        };
      }
      bySpot[r.sport_id].types[r.type] = {
        avg_score:    Number(r.avg_score || 0),
        entry_count:  Number(r.entry_count || 0),
        best_score:   Number(r.best_score || 0),
        lowest_score: Number(r.lowest_score || 0),
      };
    });

    return res.json(Object.values(bySpot));
  } catch (err) {
    console.error("GET /student/performance error:", err);
    return res.status(500).json({ message: "Failed to load performance" });
  }
});


// ─────────────────────────────────────────────────────────────
// SESSION-WISE ATTENDANCE HISTORY (student view)
// GET /api/student/attendance/sessions
// Returns each session the student was part of with their status
// ─────────────────────────────────────────────────────────────
router.get("/attendance/sessions", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ats.id            AS session_id,
        ats.session_date,
        ats.location,
        ats.session_name,
        s.name            AS sport_name,
        s.id              AS sport_id,
        IFNULL(a.status, 'NOT_MARKED') AS status,
        a.attended_at
      FROM attendance_sessions ats
      JOIN sports s ON s.id = ats.sport_id
      JOIN sport_enrollments se
        ON se.sport_id = ats.sport_id AND se.student_user_id = ? AND se.status = 'APPROVED'
      LEFT JOIN attendance a
        ON a.session_id = ats.id AND a.student_user_id = ?
      ORDER BY ats.session_date DESC, ats.created_at DESC
      LIMIT 60
    `, [req.user.id, req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error("GET /student/attendance/sessions error:", err);
    return res.status(500).json({ message: "Failed to load session history" });
  }
});

module.exports = { studentRouter: router };

