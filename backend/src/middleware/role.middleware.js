/**
 * Usage:
 *   requireRole("ADMIN")
 *   requireRole("STUDENT")
 *   requireRole("ADVISORY")
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // requireAuth must run before this (so req.user exists)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    return next();
  };
}

module.exports = { requireRole };
