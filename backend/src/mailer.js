const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,          // STARTTLS (not SSL)
    requireTLS: true,       // force STARTTLS upgrade
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // helps on Windows with self-signed certs
    },
    connectionTimeout: 10000,   // 10s
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function buildOtpHtml(otp, purpose, expiryMinutes = 10) {
  const purposeLabel =
    purpose === "REGISTER" ? "Email Verification" : "Password Reset";
  const digits = String(otp).split("");

  const digitBoxes = digits
    .map(
      (d) =>
        `<span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:28px;font-weight:900;background:#1a2233;color:#C9A227;border-radius:12px;margin:0 4px;border:2px solid #C9A227;">${d}</span>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B0F14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F14;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1e2d45;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a2233 0%,#0d1a2b 100%);padding:32px 40px;text-align:center;border-bottom:2px solid #C9A227;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#C9A227;font-size:22px;font-weight:900;letter-spacing:1px;">EKEL SPORT</h1>
            <p style="margin:4px 0 0;color:#A7B0BE;font-size:13px;">${purposeLabel}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <h2 style="margin:0 0 8px;color:#F9FAFB;font-size:18px;font-weight:700;">Your One-Time Code</h2>
            <p style="margin:0 0 28px;color:#A7B0BE;font-size:14px;">Enter this code in the app to continue.</p>
            <!-- OTP Boxes -->
            <div style="margin:0 auto 28px;text-align:center;">
              ${digitBoxes}
            </div>
            <p style="margin:0 0 8px;color:#A7B0BE;font-size:13px;">⏱ This code expires in <strong style="color:#F9FAFB;">${expiryMinutes} minutes</strong>.</p>
            <p style="margin:0;color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d1420;padding:20px 40px;text-align:center;border-top:1px solid #1e2d45;">
            <p style="margin:0;color:#4B5563;font-size:11px;">© 2025 EKEL Sport · University of Kelaniya</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to, subject, textFallback, otp = null, purpose = null) {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: `"EKEL Sport" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: textFallback,
    };

    if (otp && purpose) {
      mailOptions.html = buildOtpHtml(otp, purpose);
    }

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("sendEmail failed:", err);
    throw err;
  }
}

module.exports = { sendEmail };
