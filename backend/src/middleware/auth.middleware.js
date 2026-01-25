const jwt = require("jsonwebtoken");

/**
 * Verifies JWT token from: Authorization: Bearer <token>
 * If valid, attaches user info to req.user and calls next()
 */
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ message: "Invalid Authorization format. Use: Bearer <token>" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // We will use this in routes to know who is calling the API
    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
