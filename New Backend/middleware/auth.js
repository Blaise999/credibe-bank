const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Middleware to verify any valid user (used for both users and admins)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("email phone name role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role
    };

    next();
  } catch (err) {
    console.error("❌ Invalid token error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Optional: Middleware to verify only regular users (not admins)
const verifyUserToken = async (req, res, next) => {
  await verifyToken(req, res, () => {
    if (req.user.role !== "user") {
      return res.status(403).json({ error: "Access denied. Users only." });
    }
    next();
  });
};

// ✅ Admin check
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyUserToken,
  isAdmin
};
