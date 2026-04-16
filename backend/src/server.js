require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { router } = require("./routes"); // src/routes.js
const { authRouter } = require("./auth.routes"); // src/auth.routes.js
const { adminRouter } = require("./admin.routes"); // src/admin.routes.js
const { studentRouter } = require("./student.routes"); // src/student.routes.js
const { advisoryRouter } = require("./advisory.routes"); // src/advisory.routes.js

const otpRoutes = require("./routes/otpRoutes"); // src/routes/otpRoutes.js
const authResetRoutes = require("./routes/authResetRoutes"); // src/routes/authResetRoutes.js
const authOtpRoutes = require("./routes/authWithOtp.routes"); // src/routes/authWithOtp.routes.js

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);
app.use("/api/advisory", advisoryRouter);

// OTP
app.use("/api/otp", otpRoutes);

// OTP-based registration (new professional flow)
app.use("/api/auth-otp", authOtpRoutes);

// Reset password flow (if you already use /auth)
app.use("/auth", authResetRoutes);

app.get("/", (req, res) => {
  res.json({ message: "EKEL-Sport API running" });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️  Port ${PORT} in use — killing old process and retrying…`);
    const { execSync } = require("child_process");
    try {
      if (process.platform === "win32") {
        const result = execSync(
          `netstat -ano | findstr :${PORT}`,
          { encoding: "utf8" }
        );
        const lines = result.trim().split("\n");
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && parseInt(pid) !== process.pid) {
            try { execSync(`taskkill /PID ${pid} /F`); } catch (_) {}
          }
        });
      } else {
        execSync(`fuser -k ${PORT}/tcp`);
      }
    } catch (_) {}

    setTimeout(() => {
      server.close();
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running on http://0.0.0.0:${PORT} (after port recovery)`);
      });
    }, 1000);
  } else {
    throw err;
  }
});
