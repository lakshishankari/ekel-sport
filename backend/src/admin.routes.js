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

      // Generate a temporary password (admin will share it with the advisory member)
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
