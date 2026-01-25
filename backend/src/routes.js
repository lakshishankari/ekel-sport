const express = require("express");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");
const { testDbConnection } = require("./db");

const router = express.Router();

/**
 * ✅ Health check (public)
 */
router.get("/health", async (req, res) => {
  try {
    const dbOk = await testDbConnection();
    res.json({
      status: "ok",
      db: dbOk ? "connected" : "not connected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "failed",
      message: err.message,
    });
  }
});

/**
 * ✅ Protected route (any logged-in user)
 */
router.get("/protected", authMiddleware, (req, res) => {
  return res.json({
    message: "✅ You accessed a protected route!",
    user: req.user,
  });
});

/**
 * ✅ STUDENT-only route
 */
router.get(
  "/student-only",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  (req, res) => {
    return res.json({
      message: "✅ Student-only route accessed",
      user: req.user,
    });
  }
);

/**
 * ✅ ADMIN-only route
 */
router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res) => {
    return res.json({
      message: "✅ Admin-only route accessed",
      user: req.user,
    });
  }
);

module.exports = { router };
