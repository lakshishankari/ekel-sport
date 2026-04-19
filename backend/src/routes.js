const express = require("express");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");
const { testDbConnection, pool } = require("./db");

const router = express.Router();

/**
 * ✅ PUBLIC — List all sports (no auth required, for Guest Portal)
 */
router.get("/sports", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, venue, schedule_text, instructor_name, whatsapp_link, eligibility_criteria FROM sports ORDER BY name ASC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("PUBLIC SPORTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * ✅ PUBLIC — Public feed posts (no auth required, for Guest Portal)
 * Only returns posts with visibility = 'PUBLIC'
 */
router.get("/public-posts", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id, p.author_id, p.author_name, p.author_role, p.sport_tag,
        p.content, p.likes_count, p.visibility, p.created_at
      FROM posts p
      WHERE p.visibility = 'PUBLIC'
      ORDER BY p.created_at DESC
      LIMIT 30
    `);
    return res.json(rows);
  } catch (err) {
    console.error("PUBLIC POSTS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


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
