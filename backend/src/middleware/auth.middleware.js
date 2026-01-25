const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // keep it simple + consistent
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };
