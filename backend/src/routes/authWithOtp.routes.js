const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { sendEmail } = require("../mailer");
const crypto = require("crypto");

const router = express.Router();

// Helper functions
function isStudentEmail(email) {
    const studentEmailRegex = /^[a-zA-Z0-9._-]+-[a-z]{2,}\d+@stu\.kln\.ac\.lk$/;
    return studentEmailRegex.test(String(email || "").trim().toLowerCase());
}

function hashOtp(otp) {
    return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function signToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, email: user.email, fullName: user.fullName },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

/**
 * STEP 1: Send OTP for student registration
 * POST /api/auth-otp/send-registration-otp
 * 
 * This validates the student details and sends an OTP WITHOUT creating the account yet.
 */
router.post("/send-registration-otp", async (req, res) => {
    try {
        const { studentId, fullName, email, password } = req.body;

        // Validation
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

        if (!isStudentEmail(email)) {
            return res.status(400).json({
                message: "Student email must be like shankar-im22048@stu.kln.ac.lk",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Check if email already exists
        const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Check if studentId already exists
        const [existingStudent] = await pool.query("SELECT id FROM users WHERE student_id = ?", [studentId]);
        if (existingStudent.length > 0) {
            return res.status(409).json({ message: "Student ID already registered" });
        }

        // Check rate limiting (prevent OTP spam)
        const [recent] = await pool.query(
            `SELECT id, created_at FROM otp_codes
       WHERE email=? AND purpose='REGISTER'
       ORDER BY id DESC LIMIT 1`,
            [cleanEmail]
        );

        if (recent.length) {
            const last = new Date(recent[0].created_at).getTime();
            if (Date.now() - last < 60 * 1000) {
                return res.status(429).json({ message: "Please wait before requesting another OTP" });
            }
        }

        // Generate and store OTP
        const otp = generateOtp();
        const otp_hash = hashOtp(otp);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate old unused OTPs for same email+purpose
        await pool.query(
            "UPDATE otp_codes SET used_at = NOW() WHERE email=? AND purpose='REGISTER' AND used_at IS NULL",
            [cleanEmail]
        );

        // Insert new OTP
        await pool.query(
            "INSERT INTO otp_codes (email, purpose, otp_hash, expires_at, attempts) VALUES (?,?,?,?,0)",
            [cleanEmail, "REGISTER", otp_hash, expires_at]
        );

        // Send email
        await sendEmail(
            cleanEmail,
            "EKEL Sport - Registration OTP",
            `Welcome to EKEL Sport!\n\nYour registration OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
        );

        return res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error("SEND REGISTRATION OTP ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * STEP 2: Verify OTP and complete registration
 * POST /api/auth-otp/verify-and-register
 * 
 * This verifies the OTP and creates the user account in one transaction.
 */
router.post("/verify-and-register", async (req, res) => {
    try {
        const { studentId, fullName, email, password, otp } = req.body;

        // Validation
        if (!studentId || !fullName || !email || !password || !otp) {
            return res.status(400).json({
                message: "All fields including OTP are required",
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = String(otp).trim();

        if (cleanOtp.length !== 6) {
            return res.status(400).json({ message: "OTP must be 6 digits" });
        }

        // Find the OTP record
        const otp_hash = hashOtp(cleanOtp);
        const [rows] = await pool.query(
            `SELECT * FROM otp_codes
       WHERE email=? AND purpose='REGISTER' AND used_at IS NULL
       ORDER BY id DESC LIMIT 1`,
            [cleanEmail]
        );

        if (!rows.length) {
            return res.status(400).json({ message: "No OTP found for this email" });
        }

        const otpRecord = rows[0];

        // Check if expired
        if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Check attempts
        if (otpRecord.attempts >= 5) {
            return res.status(400).json({ message: "Too many attempts" });
        }

        // Verify OTP
        if (otpRecord.otp_hash !== otp_hash) {
            await pool.query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id=?", [otpRecord.id]);
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP is valid! Mark as used
        await pool.query("UPDATE otp_codes SET used_at=NOW() WHERE id=?", [otpRecord.id]);

        // Double-check user doesn't exist (race condition protection)
        const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const [existingStudent] = await pool.query("SELECT id FROM users WHERE student_id = ?", [studentId]);
        if (existingStudent.length > 0) {
            return res.status(409).json({ message: "Student ID already registered" });
        }

        // Create user account
        const passwordHash = await bcrypt.hash(password, 12);
        const [result] = await pool.query(
            `INSERT INTO users (role, student_id, full_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
            ["STUDENT", studentId, fullName, cleanEmail, passwordHash]
        );

        const user = {
            id: result.insertId,
            role: "STUDENT",
            studentId,
            fullName,
            email: cleanEmail,
        };

        const token = signToken(user);
        return res.status(201).json({
            token,
            user,
            message: "Registration successful"
        });
    } catch (err) {
        console.error("VERIFY AND REGISTER ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
