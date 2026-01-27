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

// Helpers
function isStudentEmail(email) {
  // Student email format: shankar-im2022048@stu.kln.ac.lk or shankar-py2023123@stu.kln.ac.lk
  // Accepts: name-<dept><year><serial>@stu.kln.ac.lk where dept is 2+ letters
  const studentEmailRegex = /^[a-zA-Z0-9._-]+-[a-z]{2,}\d+@stu\.kln\.ac\.lk$/;
  return studentEmailRegex.test(String(email || "").trim().toLowerCase());
}

function isValidStudentId(studentId) {
  // Format: DEPT/YEAR/SERIAL (e.g., IM/2022/048, PY/2023/123, CS/2021/017)
  // DEPT: 2-4 uppercase letters
  // YEAR: 4-digit year
  // SERIAL: 3-digit serial number
  const studentIdRegex = /^[A-Z]{2,4}\/\d{4}\/\d{3}$/;
  return studentIdRegex.test(String(studentId || "").trim());
}

function isStaffEmail(email) {
  // Advisory/Admin email format: something@kln.ac.lk
  return String(email || "").trim().toLowerCase().endsWith("@kln.ac.lk");
}

/**
 * ✅ STUDENT SELF-REGISTRATION (role is forced to STUDENT)
 * POST /api/auth/register-student
 */
authRouter.post("/register-student", async (req, res) => {
  try {
    const { studentId, fullName, email, password } = req.body;
    const role = "STUDENT";

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

    if (!isValidStudentId(studentId)) {
      return res.status(400).json({
        message: "Student ID must be in format: DEPT/YEAR/SERIAL (e.g., IM/2022/048)",
      });
    }

    if (!isStudentEmail(email)) {
      return res.status(400).json({
        message: "Student email must be like shankar-im2022048@stu.kln.ac.lk",
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
 * ✅ REGISTER (System-created users)
 * POST /api/auth/register
 *
 * Rules:
 * - STUDENT: must include studentId and student email format
 * - ADMIN/ADVISORY: must use @kln.ac.lk email
 */
authRouter.post("/register", async (req, res) => {
  try {
    const { role, studentId, fullName, email, password } = req.body;

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

    // Role-based email rules
    if (role === "STUDENT") {
      if (!studentId) {
        return res.status(400).json({ message: "studentId is required for STUDENT" });
      }
      if (!isValidStudentId(studentId)) {
        return res.status(400).json({
          message: "Student ID must be in format: DEPT/YEAR/SERIAL (e.g., IM/2022/048)",
        });
      }

      if (!isStudentEmail(email)) {
        return res.status(400).json({
          message: "Student email must be like shankar-im2022048@stu.kln.ac.lk",
        });
      }

      const [existingStudent] = await pool.query("SELECT id FROM users WHERE student_id = ?", [
        studentId,
      ]);
      if (existingStudent.length > 0) {
        return res.status(409).json({ message: "Student ID already registered" });
      }
    } else {
      // ADMIN / ADVISORY
      if (!isStaffEmail(email)) {
        return res.status(400).json({
          message: `${role} email must be an official @kln.ac.lk email`,
        });
      }
    }

    // Email already exists check (all roles)
    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

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
