const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../mailer");
const { pool } = require("../db");

const router = express.Router();

const OTP_EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES || 10);
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || "reset_secret";


function genOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 1) send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const [users] = await pool.query("SELECT id, email FROM users WHERE email=? LIMIT 1", [email]);
    if (users.length === 0) {
      // security: don't reveal existence
      return res.json({ message: "If your email exists, OTP has been sent." });
    }

    const user = users[0];
    const otp = genOtp6();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);
    const expiresStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      "INSERT INTO password_reset_otps (user_id, otp_hash, expires_at) VALUES (?,?,?)",
      [user.id, otpHash, expiresStr]
    );

    await sendEmail(
      email,
      "EKEL Sport - Password Reset OTP",
      `Your OTP is: ${otp}\nThis OTP expires in ${OTP_EXP_MINUTES} minutes.`
    );

    return res.json({ message: "OTP sent" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// 2) verify OTP => return reset_token
router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    console.log("🔐 [VERIFY-OTP] Request:", { email, otpLength: otp.length });
    if (!email || otp.length !== 6) return res.status(400).json({ message: "Invalid request" });

    const [users] = await pool.query("SELECT id FROM users WHERE email=? LIMIT 1", [email]);
    if (users.length === 0) return res.status(400).json({ message: "Invalid OTP" });
    const userId = users[0].id;

    const [rows] = await pool.query(
      `SELECT id, otp_hash, expires_at, attempts, used_at
       FROM password_reset_otps
       WHERE user_id=?
       ORDER BY id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) return res.status(400).json({ message: "Invalid OTP" });

    const rec = rows[0];
    console.log("📊 [VERIFY-OTP] Record:", { id: rec.id, expires_at: rec.expires_at, used: !!rec.used_at, attempts: rec.attempts });

    if (rec.used_at) return res.status(400).json({ message: "OTP already used" });
    if (rec.attempts >= 5) return res.status(400).json({ message: "Too many attempts" });

    const now = new Date();
    const exp = new Date(rec.expires_at);
    console.log("⏰ [VERIFY-OTP] Time:", { now: now.toISOString(), exp: exp.toISOString(), diff_sec: ((exp - now) / 1000).toFixed(2) });

    if (now > exp) {
      console.log("❌ [VERIFY-OTP] EXPIRED!");
      return res.status(400).json({ message: "OTP expired" });
    }

    console.log("🔑 [VERIFY-OTP] Checking OTP hash...");
    const ok = await bcrypt.compare(otp, rec.otp_hash);
    if (!ok) {
      console.log("❌ [VERIFY-OTP] Invalid OTP");
      await pool.query("UPDATE password_reset_otps SET attempts=attempts+1 WHERE id=?", [rec.id]);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    console.log("✅ [VERIFY-OTP] Success! Generating reset token...");
    await pool.query("UPDATE password_reset_otps SET used_at=NOW() WHERE id=?", [rec.id]);

    const resetToken = jwt.sign({ user_id: userId, email }, RESET_TOKEN_SECRET, { expiresIn: "15m" });

    return res.json({ reset_token: resetToken });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// 3) reset password
router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const resetToken = String(req.body.reset_token || "");
    const newPassword = String(req.body.new_password || "");

    if (!email || !resetToken || newPassword.length < 6) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, RESET_TOKEN_SECRET);
    } catch {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (payload.email !== email) return res.status(400).json({ message: "Invalid token" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [passwordHash, payload.user_id]);

    return res.json({ message: "Password updated" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
