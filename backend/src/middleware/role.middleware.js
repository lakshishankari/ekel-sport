function roleMiddleware(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return next();
    } catch (err) {
      console.error("ROLE MIDDLEWARE ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

module.exports = { roleMiddleware };
