const jwt = require("jsonwebtoken");

// ✅ Middleware to verify ANY token (user or admin)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains user.id and role
    next();
  } catch (err) {
    console.error("❌ Invalid token error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Middleware to check for admin role
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Not an admin." });
  }
  next();
};

// ✅ Middleware to check for regular user role
exports.verifyUserToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return res.status(403).json({ error: "Access denied" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ User token error:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};
