const express = require("express");
const router = express.Router();

const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

/**
 * STUDENT ROUTES (RBAC: STUDENT)
 * Base: /api/student
 */

// ✅ GET all sports + this student's enrollment status (if any)
router.get("/sports", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const studentUserId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        s.id,
        s.name,
        s.venue,
        s.schedule_text,
        s.instructor_name,
        s.instructor_email,
        s.whatsapp_link,
        se.status AS enrollment_status,
        se.requested_at,
        se.decided_at
      FROM sports s
      LEFT JOIN sport_enrollments se
        ON se.sport_id = s.id
        AND se.student_user_id = ?
      ORDER BY s.name ASC
      `,
      [studentUserId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("GET /student/sports error:", err);
    return res.status(500).json({ message: "Failed to load sports" });
  }
});

// ✅ Create PENDING enrollment request
router.post(
  "/sports/:sportId/enroll",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      const studentUserId = req.user.id;
      const sportId = Number(req.params.sportId);

      if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

      // Check sport exists
      const [sportRows] = await pool.query("SELECT id FROM sports WHERE id = ?", [sportId]);
      if (sportRows.length === 0) return res.status(404).json({ message: "Sport not found" });

      // Check existing enrollment
      const [existingRows] = await pool.query(
        `
        SELECT id, status
        FROM sport_enrollments
        WHERE sport_id = ? AND student_user_id = ?
        LIMIT 1
        `,
        [sportId, studentUserId]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];

        if (existing.status === "PENDING") {
          return res.status(409).json({ message: "Request already pending" });
        }
        if (existing.status === "APPROVED") {
          return res.status(409).json({ message: "Already approved for this sport" });
        }

        // If REJECTED, allow re-request
        await pool.query(
          `
          UPDATE sport_enrollments
          SET status = 'PENDING',
              requested_at = NOW(),
              decided_at = NULL,
              decided_by_admin_id = NULL
          WHERE id = ?
          `,
          [existing.id]
        );

        return res.json({ ok: true, status: "PENDING", message: "Re-requested successfully" });
      }

      // Create new request
      await pool.query(
        `
        INSERT INTO sport_enrollments (sport_id, student_user_id, status, requested_at)
        VALUES (?, ?, 'PENDING', NOW())
        `,
        [sportId, studentUserId]
      );

      return res.json({ ok: true, status: "PENDING", message: "Enrollment request created" });
    } catch (err) {
      console.error("POST /student/sports/:sportId/enroll error:", err);
      return res.status(500).json({ message: "Failed to create enrollment request" });
    }
  }
);

// ✅ Approved sports only
router.get("/my-sports", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const studentUserId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        s.id,
        s.name,
        s.venue,
        s.schedule_text,
        s.instructor_name,
        s.instructor_email,
        s.whatsapp_link,
        se.status AS enrollment_status,
        se.decided_at
      FROM sport_enrollments se
      INNER JOIN sports s ON s.id = se.sport_id
      WHERE se.student_user_id = ?
        AND se.status = 'APPROVED'
      ORDER BY s.name ASC
      `,
      [studentUserId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("GET /student/my-sports error:", err);
    return res.status(500).json({ message: "Failed to load my sports" });
  }
});

/**
 * ✅ NOTIFICATIONS
 */

// ✅ Get notifications
router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT id, title, message, type, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [req.user.id]
      );

      return res.json(rows);
    } catch (err) {
      console.error("GET /student/notifications error:", err);
      return res.status(500).json({ message: "Failed to load notifications" });
    }
  }
);

// ✅ NEW: Unread count
router.get(
  "/notifications/unread-count",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT COUNT(*) AS unread
        FROM notifications
        WHERE user_id = ? AND is_read = 0
        `,
        [req.user.id]
      );

      return res.json({ unread: rows[0]?.unread || 0 });
    } catch (err) {
      console.error("GET /student/notifications/unread-count error:", err);
      return res.status(500).json({ message: "Failed to get unread count" });
    }
  }
);

// ✅ Mark one as read
router.post(
  "/notifications/:id/read",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      const notifId = Number(req.params.id);
      if (!notifId) return res.status(400).json({ message: "Invalid notification id" });

      await pool.query(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND user_id = ?
        `,
        [notifId, req.user.id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error("POST /student/notifications/:id/read error:", err);
      return res.status(500).json({ message: "Failed to mark as read" });
    }
  }
);

// ✅ Mark all as read
router.post(
  "/notifications/read-all",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      await pool.query(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
        `,
        [req.user.id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error("POST /student/notifications/read-all error:", err);
      return res.status(500).json({ message: "Failed to mark all as read" });
    }
  }
);

module.exports = { studentRouter: router };
