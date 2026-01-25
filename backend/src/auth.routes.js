const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

const authRouter = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, fullName: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * ✅ STUDENT SELF-REGISTRATION (NO role from client)
 * POST /api/auth/register-student
 * - studentId required
 * - must use student email format like: shankar-im22048@stu.kln.ac.lk
 */
authRouter.post("/register-student", async (req, res) => {
  try {
    const { studentId, fullName, email, password } = req.body;
    const role = "STUDENT";

    // Basic validation
    if (!studentId || !fullName || !email || !password) {
      return res.status(400).json({
        message: "studentId, fullName, email, password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Student email format: shankar-im22048@stu.kln.ac.lk
    const studentEmailRegex = /^[a-zA-Z0-9._-]+-im\d+@stu\.kln\.ac\.lk$/;
    if (!studentEmailRegex.test(email)) {
      return res.status(400).json({
        message: "Student email must be like shankar-im22048@stu.kln.ac.lk",
      });
    }

    // Email already exists
    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // StudentId already exists
    const [existingStudent] = await pool.query("SELECT id FROM users WHERE student_id = ?", [
      studentId,
    ]);
    if (existingStudent.length > 0) {
      return res.status(409).json({ message: "Student ID already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO users (role, student_id, full_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [role, studentId, fullName, email, passwordHash]
    );

    const user = {
      id: result.insertId,
      role,
      studentId,
      fullName,
      email,
    };

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("REGISTER STUDENT ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * ✅ REGISTER (ADMIN / ADVISORY)  (and can still be used for STUDENT if you pass role)
 * POST /api/auth/register
 * - For system-created users (admin/advisory). We'll use this later in Admin dashboard.
 */
authRouter.post("/register", async (req, res) => {
  try {
    const { role, studentId, fullName, email, password } = req.body;

    // Basic validation (role is required here)
    if (!role || !fullName || !email || !password) {
      return res.status(400).json({
        message: "role, fullName, email, password are required",
      });
    }

    const allowedRoles = ["STUDENT", "ADMIN", "ADVISORY"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Use STUDENT, ADMIN, or ADVISORY",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Email already exists check (all roles)
    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // STUDENT-specific rules (if role is STUDENT using this endpoint)
    if (role === "STUDENT") {
      if (!studentId) {
        return res.status(400).json({ message: "studentId is required for STUDENT" });
      }

      const studentEmailRegex = /^[a-zA-Z0-9._-]+-im\d+@stu\.kln\.ac\.lk$/;
      if (!studentEmailRegex.test(email)) {
        return res.status(400).json({
          message: "Student email must be like shankar-im22048@stu.kln.ac.lk",
        });
      }

      const [existingStudent] = await pool.query("SELECT id FROM users WHERE student_id = ?", [
        studentId,
      ]);
      if (existingStudent.length > 0) {
        return res.status(409).json({ message: "Student ID already registered" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user (student_id is null for ADMIN/ADVISORY)
    const [result] = await pool.query(
      `INSERT INTO users (role, student_id, full_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [role, role === "STUDENT" ? studentId : null, fullName, email, passwordHash]
    );

    const user = {
      id: result.insertId,
      role,
      studentId: role === "STUDENT" ? studentId : null,
      fullName,
      email,
    };

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * ✅ LOGIN (STUDENT / ADMIN / ADVISORY)
 * POST /api/auth/login
 */
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const [rows] = await pool.query(
      "SELECT id, role, student_id, full_name, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);

    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = {
      id: u.id,
      role: u.role,
      studentId: u.student_id,
      fullName: u.full_name,
      email: u.email,
    };

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { authRouter };
