const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail(to, subject, text) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  });
}

module.exports = { sendEmail };
