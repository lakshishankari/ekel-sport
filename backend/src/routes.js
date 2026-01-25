const express = require("express");
const { requireAuth } = require("./middleware/auth.middleware");
const { requireRole } = require("./middleware/role.middleware");


const { testDbConnection } = require("./db");

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const dbOk = await testDbConnection();
    res.json({ status: "ok", db: dbOk ? "connected" : "not connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "failed", message: err.message });
  }
});

module.exports = { router };
router.get("/protected", requireAuth, (req, res) => {
  return res.json({
    message: "✅ You accessed a protected route!",
    user: req.user, // shows { id, role }
  });
});

// Only STUDENT can access
router.get("/student-only", requireAuth, requireRole("STUDENT"), (req, res) => {
  return res.json({
    message: "✅ Student-only route accessed",
    user: req.user,
  });
});

// Only ADMIN can access
router.get("/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
  return res.json({
    message: "✅ Admin-only route accessed",
    user: req.user,
  });
});
