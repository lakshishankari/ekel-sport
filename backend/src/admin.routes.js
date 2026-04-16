const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

const adminRouter = express.Router();

function isStaffEmail(email) {
  return String(email || "").trim().toLowerCase().endsWith("@kln.ac.lk");
}

// ✅ GET all users (ADMIN only)
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

// ✅ GET all sports (ADMIN only)
adminRouter.get("/sports", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, venue, schedule_text, instructor_name, instructor_email, whatsapp_link, created_at
       FROM sports
       ORDER BY id DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("ADMIN SPORTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ CREATE sport module (ADMIN only)
adminRouter.post("/sports", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const venue = String(req.body?.venue || "").trim();
    const schedule_text = String(req.body?.schedule_text || "").trim();
    const instructor_name = String(req.body?.instructor_name || "").trim();
    const instructor_email = String(req.body?.instructor_email || "").trim().toLowerCase();
    const whatsapp_link = String(req.body?.whatsapp_link || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Sport name is required" });
    }

    // Optional: enforce official email for instructor if provided
    if (instructor_email && !isStaffEmail(instructor_email)) {
      return res.status(400).json({
        message: "Instructor email must be an official @kln.ac.lk email",
      });
    }

    const [existing] = await pool.query("SELECT id FROM sports WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Sport already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO sports (name, venue, schedule_text, instructor_name, instructor_email, whatsapp_link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        venue || null,
        schedule_text || null,
        instructor_name || null,
        instructor_email || null,
        whatsapp_link || null,
      ]
    );

    return res.status(201).json({
      message: "Sport created successfully",
      sportId: result.insertId,
    });
  } catch (err) {
    console.error("CREATE SPORT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ ADMIN: View pending enrollment requests
adminRouter.get(
  "/enrollments/pending",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          se.id AS enrollment_id,
          se.status,
          se.requested_at,
          s.id AS sport_id,
          s.name AS sport_name,
          u.id AS student_user_id,
          u.student_id,
          u.full_name,
          u.email
        FROM sport_enrollments se
        JOIN sports s ON s.id = se.sport_id
        JOIN users u ON u.id = se.student_user_id
        WHERE se.status = 'PENDING'
        ORDER BY se.requested_at ASC
        `
      );

      return res.json(rows);
    } catch (err) {
      console.error("PENDING ENROLLMENTS ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ✅ ADMIN: Approve/Reject enrollment request (creates notification ✅)
adminRouter.post(
  "/enrollments/:enrollmentId/decision",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const enrollmentId = Number(req.params.enrollmentId);
      const decision = String(req.body?.decision || "").toUpperCase(); // APPROVE / REJECT
      const note = String(req.body?.note || "").trim();

      if (!enrollmentId) return res.status(400).json({ message: "Invalid enrollmentId" });
      if (!["APPROVE", "REJECT"].includes(decision)) {
        return res.status(400).json({ message: "decision must be APPROVE or REJECT" });
      }

      // Check enrollment exists + is pending
      const [rows] = await pool.query(
        "SELECT id, status FROM sport_enrollments WHERE id = ?",
        [enrollmentId]
      );

      if (rows.length === 0) return res.status(404).json({ message: "Enrollment not found" });
      if (rows[0].status !== "PENDING") {
        return res.status(409).json({ message: "This request is already decided" });
      }

      const newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";

      // ✅ Get details for notification (student + sport name)
      const [detailRows] = await pool.query(
        `
        SELECT se.student_user_id, s.name AS sport_name
        FROM sport_enrollments se
        JOIN sports s ON s.id = se.sport_id
        WHERE se.id = ?
        LIMIT 1
        `,
        [enrollmentId]
      );

      await pool.query(
        `
        UPDATE sport_enrollments
        SET status = ?, decided_at = NOW(), decided_by_admin_id = ?, decision_note = ?
        WHERE id = ?
        `,
        [newStatus, req.user.id, note || null, enrollmentId]
      );

      // ✅ Insert notification
      if (detailRows.length > 0) {
        const studentUserId = detailRows[0].student_user_id;
        const sportName = detailRows[0].sport_name;

        await pool.query(
          `
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, 'ENROLLMENT')
          `,
          [
            studentUserId,
            `Sport Enrollment ${newStatus}`,
            `Your request to join ${sportName} was ${newStatus}.`,
          ]
        );
      }

      return res.json({ message: `Enrollment ${newStatus}` });
    } catch (err) {
      console.error("ENROLLMENT DECISION ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ✅ Create advisory account (ADMIN sets password)
adminRouter.post(
  "/create-advisory",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const fullName = String(req.body?.fullName || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");

      if (!fullName || !email || !password) {
        return res.status(400).json({ message: "fullName, email, password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // ✅ Enforce advisory email domain
      if (!isStaffEmail(email)) {
        return res.status(400).json({
          message: "Advisory email must be an official @kln.ac.lk email",
        });
      }

      const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const role = "ADVISORY";

      const [result] = await pool.query(
        `INSERT INTO users (role, student_id, full_name, email, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [role, null, fullName, email, passwordHash]
      );

      return res.status(201).json({
        message: "Advisory account created",
        user: {
          id: result.insertId,
          role,
          fullName,
          email,
        },
      });
    } catch (err) {
      console.error("CREATE ADVISORY ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SQUAD & POOL MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/squad-pool/sports
 * Returns sports that have at least one APPROVED enrollment
 */
adminRouter.get(
  "/squad-pool/sports",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT DISTINCT s.id, s.name
        FROM sports s
        INNER JOIN sport_enrollments se ON se.sport_id = s.id
        WHERE se.status = 'APPROVED'
        ORDER BY s.name ASC
      `);
      return res.json(rows);
    } catch (err) {
      console.error("SQUAD-POOL SPORTS ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/admin/squad-pool/:sportId
 * Returns all APPROVED students for a sport with aggregated performance stats
 */
adminRouter.get(
  "/squad-pool/:sportId",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const sportId = Number(req.params.sportId);
      if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

      const [rows] = await pool.query(
        `
        SELECT
          u.id                          AS student_user_id,
          u.full_name,
          u.student_id,
          se.squad_level,
          COUNT(DISTINCT a.id)          AS attendance_count,
          COUNT(DISTINCT pe.id)         AS performance_count,
          ROUND(AVG(pe.value), 1)       AS avg_score,
          SUM(CASE WHEN pe.type = 'MATCH'     THEN 1 ELSE 0 END) AS match_entries,
          SUM(CASE WHEN pe.type = 'FITNESS'   THEN 1 ELSE 0 END) AS fitness_entries,
          SUM(CASE WHEN pe.type = 'DISCIPLINE' THEN 1 ELSE 0 END) AS discipline_entries,
          (SELECT COUNT(*) FROM student_team_assignment sta
           WHERE sta.student_user_id = u.id AND sta.sport_id = ?) AS in_team
        FROM sport_enrollments se
        JOIN users u ON u.id = se.student_user_id
        LEFT JOIN attendance a
          ON a.student_user_id = u.id AND a.sport_id = ?
        LEFT JOIN performance_entries pe
          ON pe.student_user_id = u.id AND pe.sport_id = ?
        WHERE se.sport_id = ? AND se.status = 'APPROVED'
        GROUP BY u.id, u.full_name, u.student_id, se.squad_level
        ORDER BY se.squad_level DESC, avg_score DESC
        `,
        [sportId, sportId, sportId, sportId]
      );

      return res.json(rows);
    } catch (err) {
      console.error("SQUAD-POOL STUDENTS ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/squad-pool/:sportId/:studentUserId/level
 * Update a student's squad_level (NONE / POOL / SQUAD) for a sport
 * Body: { level: "NONE" | "POOL" | "SQUAD" }
 */
adminRouter.post(
  "/squad-pool/:sportId/:studentUserId/level",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const sportId = Number(req.params.sportId);
      const studentUserId = Number(req.params.studentUserId);
      const level = String(req.body?.level || "").toUpperCase();

      if (!sportId || !studentUserId) {
        return res.status(400).json({ message: "Invalid sportId or studentUserId" });
      }
      if (!["NONE", "POOL", "SQUAD"].includes(level)) {
        return res.status(400).json({ message: "level must be NONE, POOL, or SQUAD" });
      }

      // Check enrollment exists and is APPROVED
      const [rows] = await pool.query(
        "SELECT id FROM sport_enrollments WHERE sport_id=? AND student_user_id=? AND status='APPROVED'",
        [sportId, studentUserId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "No approved enrollment found" });
      }

      await pool.query(
        "UPDATE sport_enrollments SET squad_level=? WHERE sport_id=? AND student_user_id=?",
        [level, sportId, studentUserId]
      );

      // Get sport name for notification
      const [sportRows] = await pool.query("SELECT name FROM sports WHERE id=?", [sportId]);
      const sportName = sportRows[0]?.name || "Unknown Sport";

      const notifMessages = {
        POOL:  `You have been selected to the ${sportName} Pool! Keep training hard.`,
        SQUAD: `Congratulations! You have been selected to the ${sportName} Squad! 🏆`,
        NONE:  `Your squad/pool status for ${sportName} has been updated.`,
      };

      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
        [
          studentUserId,
          `${sportName} — Level Updated`,
          notifMessages[level],
        ]
      );

      return res.json({ ok: true, level });
    } catch (err) {
      console.error("SET SQUAD LEVEL ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/squad-pool/:sportId/:studentUserId/team
 * Toggle student into / out of the team for a sport
 * Body: { inTeam: boolean }
 */
adminRouter.post(
  "/squad-pool/:sportId/:studentUserId/team",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const sportId = Number(req.params.sportId);
      const studentUserId = Number(req.params.studentUserId);
      const inTeam = Boolean(req.body?.inTeam);

      if (!sportId || !studentUserId) {
        return res.status(400).json({ message: "Invalid sportId or studentUserId" });
      }

      if (inTeam) {
        // Safe check-then-insert (avoids needing a unique key with INSERT IGNORE)
        const [existing] = await pool.query(
          "SELECT id FROM student_team_assignment WHERE sport_id=? AND student_user_id=?",
          [sportId, studentUserId]
        );
        if (existing.length === 0) {
          // Use student's actual squad level (must be POOL or SQUAD for the team level enum)
          const [enrollRow] = await pool.query(
            "SELECT squad_level FROM sport_enrollments WHERE sport_id=? AND student_user_id=? LIMIT 1",
            [sportId, studentUserId]
          );
          const teamLevel = ["POOL","SQUAD"].includes(enrollRow[0]?.squad_level)
            ? enrollRow[0].squad_level
            : "SQUAD";
          await pool.query(
            `INSERT INTO student_team_assignment
               (sport_id, student_user_id, assigned_by_admin_id, level)
             VALUES (?, ?, ?, ?)`,
            [sportId, studentUserId, req.user.id, teamLevel]
          );
        }

        // Notify student
        const [sportRows] = await pool.query("SELECT name FROM sports WHERE id=?", [sportId]);
        const sportName = sportRows[0]?.name || "Unknown Sport";
        await pool.query(
          "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
          [
            studentUserId,
            `${sportName} — Team Selected`,
            `You have been selected for the official ${sportName} team! 🎉`,
          ]
        );
      } else {
        await pool.query(
          "DELETE FROM student_team_assignment WHERE sport_id=? AND student_user_id=?",
          [sportId, studentUserId]
        );
      }

      return res.json({ ok: true, inTeam });
    } catch (err) {
      console.error("TOGGLE TEAM ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = { adminRouter };

