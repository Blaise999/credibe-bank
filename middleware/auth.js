const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Verify token (user or admin)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const fullUser = await User.findById(decoded.id).select("email phone name");
    if (fullUser) {
      req.user.email = fullUser.email;
      req.user.phone = fullUser.phone;
      req.user.name = fullUser.name;
    }

    next();
  } catch (err) {
    console.error("❌ Invalid token error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// ✅ Export both
module.exports = {
  verifyToken,
  isAdmin,
};
