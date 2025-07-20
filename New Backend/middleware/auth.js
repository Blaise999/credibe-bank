const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Import User model

// ✅ Middleware to verify ANY token (user or admin)
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains user.id and role

    // ✅ Attach full user document (optional fields: email, phone)
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
