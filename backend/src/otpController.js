const crypto = require("crypto");
const { pool } = require("./db");
const { sendEmail } = require("./mailer");

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

const ALLOWED_PURPOSES = new Set(["REGISTER", "RESET_PASSWORD"]);

async function sendOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const purpose = String(req.body.purpose || "").trim().toUpperCase();

    if (!email || !purpose) {
      return res.status(400).json({ message: "email and purpose are required" });
    }

    if (!ALLOWED_PURPOSES.has(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    // OPTIONAL: stop spamming (if last OTP created < 60s ago)
    const [recent] = await pool.query(
      `SELECT id, created_at FROM otp_codes
       WHERE email=? AND purpose=? 
       ORDER BY id DESC LIMIT 1`,
      [email, purpose]
    );

    if (recent.length) {
      const last = new Date(recent[0].created_at).getTime();
      if (Date.now() - last < 60 * 1000) {
        return res.status(429).json({ message: "Please wait before requesting another OTP" });
      }
    }

    const otp = generateOtp();
    const otp_hash = hashOtp(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // invalidate old unused OTPs for same email+purpose
    await pool.query(
      "UPDATE otp_codes SET used_at = NOW() WHERE email=? AND purpose=? AND used_at IS NULL",
      [email, purpose]
    );

    await pool.query(
      "INSERT INTO otp_codes (email, purpose, otp_hash, expires_at, attempts) VALUES (?,?,?,?,0)",
      [email, purpose, otp_hash, expires_at]
    );

    // send email
    await sendEmail(
      email,
      "Your EKEL-Sport OTP Code",
      `Your OTP is: ${otp}\n\nPurpose: ${purpose}\nThis code expires in 10 minutes.`
    );

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ message: "OTP send failed" });
  }
}

async function verifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const purpose = String(req.body.purpose || "").trim().toUpperCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !purpose || !otp) {
      return res.status(400).json({ message: "email, purpose, otp are required" });
    }

    if (!ALLOWED_PURPOSES.has(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    const otp_hash = hashOtp(otp);

    const [rows] = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email=? AND purpose=? AND used_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [email, purpose]
    );

    if (!rows.length) return res.status(400).json({ message: "No OTP found" });

    const row = rows[0];

    // expired?
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // too many attempts
    if (row.attempts >= 5) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    if (row.otp_hash !== otp_hash) {
      await pool.query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id=?", [row.id]);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // success
    await pool.query("UPDATE otp_codes SET used_at=NOW() WHERE id=?", [row.id]);

    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "OTP verify failed" });
  }
}

module.exports = { sendOtp, verifyOtp };
