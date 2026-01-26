const express = require("express");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

const studentRouter = express.Router();

// ✅ Student: view all sports + MY enrollment status for each sport
studentRouter.get("/sports", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res) => {
  try {
    const studentUserId = req.user.id;

    // Left join enrollments for THIS student to get status per sport
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
        COALESCE(se.status, 'NOT_REQUESTED') AS enrollment_status
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
    console.error("STUDENT SPORTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Student: request to enroll in a sport
studentRouter.post(
  "/sports/:sportId/enroll",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  async (req, res) => {
    try {
      const sportId = Number(req.params.sportId);
      if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

      const studentUserId = req.user.id;

      // Ensure sport exists
      const [sport] = await pool.query("SELECT id FROM sports WHERE id = ?", [sportId]);
      if (sport.length === 0) return res.status(404).json({ message: "Sport not found" });

      // Check if already requested/enrolled
      const [existing] = await pool.query(
        "SELECT id, status FROM sport_enrollments WHERE sport_id = ? AND student_user_id = ?",
        [sportId, studentUserId]
      );
      if (existing.length > 0) {
        return res.status(409).json({
          message: `Already requested/enrolled (status: ${existing[0].status})`,
        });
      }

      await pool.query(
        `INSERT INTO sport_enrollments (sport_id, student_user_id, status)
         VALUES (?, ?, 'PENDING')`,
        [sportId, studentUserId]
      );

      return res.status(201).json({ message: "Enrollment request submitted (PENDING)" });
    } catch (err) {
      console.error("ENROLL REQUEST ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = { studentRouter };
