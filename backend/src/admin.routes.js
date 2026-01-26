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

// ✅ ADMIN: Approve/Reject enrollment request
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

      await pool.query(
        `
        UPDATE sport_enrollments
        SET status = ?, decided_at = NOW(), decided_by_admin_id = ?, decision_note = ?
        WHERE id = ?
        `,
        [newStatus, req.user.id, note || null, enrollmentId]
      );

      return res.json({ message: `Enrollment ${newStatus}` });
    } catch (err) {
      console.error("ENROLLMENT DECISION ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ✅ Create advisory account (ADMIN only)
adminRouter.post(
  "/create-advisory",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const fullName = String(req.body?.fullName || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();

      if (!fullName || !email) {
        return res.status(400).json({ message: "fullName and email are required" });
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

      const tempPassword = "Adv@" + Math.random().toString(36).slice(2, 10);
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const role = "ADVISORY";

      const [result] = await pool.query(
        `INSERT INTO users (role, student_id, full_name, email, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [role, null, fullName, email, passwordHash]
      );

      return res.status(201).json({
        message: "Advisory account created",
        tempPassword,
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

module.exports = { adminRouter };
