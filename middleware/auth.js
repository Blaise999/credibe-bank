// middleware/auth.js (FULL EDIT)
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Shared token verifier (for both user and admin)
const verifyToken = async (req, res, next) => {
  // ✅ IMPORTANT: allow CORS preflight to pass (OPTIONS requests don't carry auth headers)
  if (req.method === "OPTIONS") return next();

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res
        .status(401)
        .json({ error: "Invalid token payload: missing user ID" });
    }

    const user = await User.findById(decoded.id).select(
      "email phone name role isBlocked"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Only block if user is blocked AND trying to modify data (GETs still allowed)
    if (user.isBlocked && req.method !== "GET") {
      return res.status(403).json({ error: "User is blocked" });
    }

    // ✅ keep shape consistent everywhere
    req.user = {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isBlocked: !!user.isBlocked,
    };

    return next();
  } catch (err) {
    console.error("❌ Invalid token error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ✅ User-only protection
const verifyUserToken = async (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user?.role !== "user") {
      return res.status(403).json({ error: "Access denied. Users only." });
    }
    return next();
  });
};

// ✅ Admin-only protection (NOTE: this already verifies token)
const verifyAdminToken = async (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    return next();
  });
};

module.exports = {
  verifyToken,
  verifyUserToken,
  isAdmin: verifyAdminToken, // keep your existing import name working
  verifyAdminToken,
};
