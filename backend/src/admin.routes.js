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
